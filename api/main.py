"""Resume kit API for IEEE-CS at USF.

The browser cannot talk to postgres directly, so this service sits between
the React frontend and the database.
"""

import json
import logging
from contextlib import asynccontextmanager
from uuid import UUID

from fastapi import FastAPI, HTTPException, Response
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware

from agent import AGENT, MAX_REVISIONS, final_payload, mermaid
from db import execute, pool, rows
from models import (
    Experience,
    ExperienceIn,
    Job,
    JobIn,
    TailoredIn,
    TailorIn,
)
from pdf import build_pdf


@asynccontextmanager
async def lifespan(app: FastAPI):
    pool.open()
    pool.wait()
    yield
    pool.close()


logger = logging.getLogger("uvicorn.error")

app = FastAPI(title="Resume Kit API", lifespan=lifespan)

# Vite proxies /api in dev, so same-origin is the normal path. These origins
# cover hitting the API directly from a dev server.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:4173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/api/experiences", response_model=list[Experience])
def list_experiences() -> list[Experience]:
    # Roles still held first, then most recent — the order the timeline shows.
    records = rows(
        """
        SELECT id, role, company, location, start_date, end_date, current, description
        FROM experiences
        ORDER BY current DESC, start_date DESC
        """
    )
    return [
        Experience(
            id=r["id"],
            role=r["role"],
            company=r["company"],
            location=r["location"],
            startDate=r["start_date"],
            endDate=r["end_date"],
            current=r["current"],
            description=r["description"],
        )
        for r in records
    ]


@app.post("/api/experiences", response_model=Experience, status_code=201)
def create_experience(payload: ExperienceIn) -> Experience:
    experience = Experience(**payload.model_dump())
    execute(
        """
        INSERT INTO experiences
            (id, role, company, location, start_date, end_date, current, description)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """,
        (
            experience.id,
            experience.role,
            experience.company,
            experience.location,
            experience.startDate,
            experience.endDate,
            experience.current,
            experience.description,
        ),
    )
    return experience


@app.delete("/api/experiences/{experience_id}", status_code=204)
def delete_experience(experience_id: UUID) -> None:
    if not execute("DELETE FROM experiences WHERE id = %s", (experience_id,)):
        raise HTTPException(status_code=404, detail="Experience not found")


@app.get("/api/jobs", response_model=list[Job])
def list_jobs() -> list[Job]:
    records = rows(
        """
        SELECT id, title, company, link, description, saved_at
        FROM jobs
        ORDER BY saved_at DESC
        """
    )
    return [
        Job(
            id=r["id"],
            title=r["title"],
            company=r["company"],
            link=r["link"],
            description=r["description"],
            savedAt=r["saved_at"],
        )
        for r in records
    ]


@app.post("/api/jobs", response_model=Job, status_code=201)
def create_job(payload: JobIn) -> Job:
    # saved_at is defaulted by postgres, so read it back rather than guessing
    # at the server's clock.
    result = rows(
        """
        INSERT INTO jobs (id, title, company, link, description)
        VALUES (gen_random_uuid(), %s, %s, %s, %s)
        RETURNING id, title, company, link, description, saved_at
        """,
        (payload.title, payload.company, payload.link, payload.description),
    )[0]
    return Job(
        id=result["id"],
        title=result["title"],
        company=result["company"],
        link=result["link"],
        description=result["description"],
        savedAt=result["saved_at"],
    )


@app.delete("/api/jobs/{job_id}", status_code=204)
def delete_job(job_id: UUID) -> None:
    if not execute("DELETE FROM jobs WHERE id = %s", (job_id,)):
        raise HTTPException(status_code=404, detail="Job not found")


@app.post("/api/tailor")
def tailor_bullets(payload: TailorIn) -> dict:
    """Run the agent to completion and return the finished result."""
    records = _load_experiences()
    try:
        state = AGENT.invoke({
            "job_description": payload.jobDescription,
            "records": records,
            "max_experiences": payload.maxExperiences,
            "selected": [], "drafts": [], "issues": [], "revisions": 0, "trace": [],
        })
        return final_payload(state, records)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Agent run failed")
        raise HTTPException(
            status_code=502,
            detail="The agent run failed. Check the API logs for details.",
        ) from exc


@app.post("/api/tailor/pdf")
def tailor_pdf(payload: TailoredIn) -> Response:
    """Render a result the caller already has as a PDF.

    Takes the result rather than regenerating it, so downloading never costs
    another model call.
    """
    try:
        pdf = build_pdf(payload.model_dump())
    except Exception as exc:
        logger.exception("PDF rendering failed")
        raise HTTPException(
            status_code=500, detail="Could not build the PDF."
        ) from exc

    filename = f"tailored-bullets-{payload.generatedAt[:10]}.pdf"
    return Response(
        content=pdf,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


def _load_experiences() -> list[dict]:
    records = rows(
        """
        SELECT id, role, company, location, start_date, end_date, current, description
        FROM experiences
        ORDER BY current DESC, start_date DESC
        """
    )
    if not records:
        raise HTTPException(
            status_code=400,
            detail="Add at least one experience before generating bullets.",
        )
    return records


@app.get("/api/agent/graph")
def agent_graph() -> dict:
    """The graph's own mermaid diagram, generated from the compiled graph."""
    return {"mermaid": mermaid(), "maxRevisions": MAX_REVISIONS}


@app.post("/api/tailor/stream")
def tailor_stream(payload: TailorIn) -> StreamingResponse:
    """Run the agent, streaming each node as it finishes.

    Server-sent events. Every node emits one event so the page can show the
    cycle happening — including the trip back to `write` when the critic
    rejects a bullet.
    """
    records = _load_experiences()

    def events():
        def sse(obj: dict) -> str:
            return f"data: {json.dumps(obj)}\n\n"

        state: dict = {}
        try:
            stream = AGENT.stream(
                {
                    "job_description": payload.jobDescription,
                    "records": records,
                    "max_experiences": payload.maxExperiences,
                    "selected": [],
                    "drafts": [],
                    "issues": [],
                    "revisions": 0,
                    "trace": [],
                },
                stream_mode="updates",
            )
            for update in stream:
                for node, delta in update.items():
                    state.update(delta)
                    step = (delta.get("trace") or [{}])[-1]
                    yield sse({
                        "type": "node",
                        "node": node,
                        "detail": step.get("detail", ""),
                        "revisions": state.get("revisions", 0),
                    })
            yield sse({"type": "done", "result": final_payload(state, records)})
        except RuntimeError as exc:
            yield sse({"type": "error", "detail": str(exc)})
        except Exception:
            logger.exception("Agent run failed")
            yield sse({
                "type": "error",
                "detail": "The agent run failed. Check the API logs for details.",
            })

    return StreamingResponse(
        events(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
