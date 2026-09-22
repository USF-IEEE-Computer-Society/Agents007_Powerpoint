# Agent 007: An Intro to LangGraph and Multi-Agent AI

<img src="flyer.jpg" alt="Event flyer: Agent 007, An Intro to LangGraph and Multi-agent AI. Tuesday September 15, 6:30 to 7:30 PM, ENB 116." width="480">

A workshop run by the IEEE Computer Society student branch chapter at the University of South Florida, taught by Caio Bahlis, a senior in computer science and math, Honors IT developer, and security automation intern at Rockstar Games.

Tuesday, September 15, 2026, 6:30 to 7:30 PM, ENB 116.

## What the workshop covered

- The pieces every AI engineer works with, RAG, tool use, MCP, memory, and orchestration, and how they connect in one working pipeline.
- Building on LangChain and LangGraph instead of retrying a prompt until it behaves.
- A live demo of the app in this repo, which everyone took home.

No experience assumed and no setup required to attend.

## What we built

A resume tailoring tool. You save your experiences and a job description, and an agent picks the experiences worth putting on that particular resume, rewrites them as bullets, and hands back a PDF.

The interesting part is that it is a graph, not one model call:

```
select ──▶ write ──▶ critique ──▶ (clean?) ──▶ END
             ▲                        │
             └──────── revise ────────┘
```

`critique` checks every bullet against what you actually wrote. When it catches an invented claim, the bullets go back to `write` with that feedback, up to two revisions so it cannot spin forever. That loop is the reason to reach for LangGraph rather than a plain chain, and `chain.py` keeps the single-call version around to compare against.

The page draws the graph from `GET /api/agent/graph`, which returns the compiled graph's own mermaid diagram, so the picture cannot drift away from the code.

## What is in here

- `Agents 007.pptx`, the slides.
- `src/`, the React frontend. React 19, Vite, Tailwind, and mermaid for the graph.
- `api/`, a FastAPI service holding the agent, the model calls, and PDF generation.
- `db/`, the Postgres schema and seed data.
- `docker-compose.yml`, the database container.
- `justfile`, every command you need.

## Running it

You need Docker, Python 3, Node, and an Anthropic API key.

```bash
cp api/.env.example api/.env    # paste your key into it
just setup                      # install frontend and API dependencies
just db                         # start postgres and wait for it
```

Then `just api` and `just dev` in two more terminals. The frontend comes up on port 5173 and proxies `/api` to the service on 8000.

Without `just`, the same steps are written out in [api/README.md](api/README.md).

Tailoring costs money, since each run is a billed API call. A run is three calls on Haiku and lands around half a cent, so $5 of credit covers roughly 900 of them. Downloading the PDF calls no model and costs nothing.

## Where to look next

[api/README.md](api/README.md) goes through each endpoint, what every node in the graph does, and the model costs in detail.

## Links

- [Announcement on Instagram](https://www.instagram.com/p/Dc6ERBRR6v4/)
- [Teaser on Instagram](https://www.instagram.com/p/Dc_Qk6UumbO/)
