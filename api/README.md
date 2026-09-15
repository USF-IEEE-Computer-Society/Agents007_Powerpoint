# Resume Kit API

FastAPI service between the React frontend and postgres. The browser cannot
connect to postgres directly, so every read and write goes through here.

## Run it

```bash
docker compose up -d                  # from the repo root; starts postgres
cd api
python3 -m venv .venv
./.venv/bin/pip install -r requirements.txt
./.venv/bin/uvicorn main:app --reload --port 8000
```

The frontend's dev server proxies `/api` to port 8000, so run `npm run dev`
from the repo root in a second terminal.

`DATABASE_URL` overrides the connection string; it defaults to the
docker-compose database on host port 5433.

## The agent

`POST /api/tailor` takes `{"jobDescription": "...", "maxExperiences": 4}`,
reads every saved experience, and returns only the ones worth putting on that
resume - ranked strongest first, each with a line on why it was picked, and
rewritten as bullets. It returns fewer than the limit when fewer genuinely fit.
What was left out is computed server-side by diffing against the database, so
it cannot be hallucinated.

`POST /api/tailor/pdf` takes a result the caller already has and returns it as
a PDF. It does not call the model, so downloading costs nothing. Tailoring runs a LangGraph agent in `agent.py`, not a single call:

    select ──▶ write ──▶ critique ──▶ (clean?) ──▶ END
                 ▲                        │
                 └──────── revise ────────┘

`select` picks which experiences belong on the resume, `write` drafts bullets,
and `critique` checks every bullet against what the student actually wrote. If
the critic finds an invented claim, the conditional edge sends the bullets back
to `write` with that feedback - up to `MAX_REVISIONS` (2), so it cannot loop
forever. That cycle is what LangGraph gives you over a plain chain.

`GET /api/agent/graph` returns the graph's own mermaid diagram, so the picture
on the page is generated from the compiled graph and cannot drift from the code.

`POST /api/tailor/stream` runs the agent over server-sent events, emitting one
event per node so the page shows the cycle happening. `POST /api/tailor` runs
the same graph and returns only the final result.

`chain.py` is the earlier single-call version, kept for the workshop to compare
against.

Haiku 4.5 is the cheapest current model ($1/$5 per million tokens in/out). A
measured agent run is 3 calls (select, write, critique) at about $0.005 -
roughly 900 generations per $5 of credit. A revision adds two more calls.
Set `ANTHROPIC_MODEL` in `.env` to use a different one.

This needs an Anthropic API key:

```bash
cp .env.example .env     # then paste your key into it
```

`just api` loads `api/.env` automatically. Without a key the endpoint returns
503 with a message saying so rather than failing at startup.

**Each generation is a billed API call.** The prompt constrains Claude to work
only from what the student wrote - it must not invent metrics, technologies, or
outcomes - but read the bullets before using them.
