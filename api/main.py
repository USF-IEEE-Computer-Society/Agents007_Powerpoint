"""Resume kit API for IEEE-CS at USF.

The browser cannot talk to postgres directly, so this service sits between
the React frontend and the database.
"""

from contextlib import asynccontextmanager
from uuid import UUID

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from db import execute, pool, rows
from models import Experience, ExperienceIn, Job, JobIn


@asynccontextmanager
async def lifespan(app: FastAPI):
    pool.open()
    pool.wait()
    yield
    pool.close()


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
