# IEEE-CS at USF resume kit
#
# Three pieces have to be running: postgres (docker), the FastAPI service,
# and the vite dev server. `just setup` once, then `just db` and, in two more
# terminals, `just api` and `just dev`.

# Loads api/.env into every recipe, so ANTHROPIC_API_KEY reaches the API
# without exporting it by hand. Not required — recipes run fine without it.
set dotenv-load := true
set dotenv-filename := "api/.env"
set dotenv-required := false

venv := "api/.venv"
python := venv / "bin/python"
pip := venv / "bin/pip"
uvicorn := venv / "bin/uvicorn"

# List the available recipes.
default:
    @just --list

# Install frontend and API dependencies. Run once, or after pulling changes.
setup: setup-frontend setup-api

setup-frontend:
    npm install

setup-api:
    python3 -m venv {{ venv }}
    {{ pip }} install --upgrade pip
    {{ pip }} install -r api/requirements.txt

# Start postgres and wait until it is actually accepting connections.
db:
    docker compose up -d
    @echo "waiting for postgres..."
    @until [ "$(docker inspect --format '{{{{.State.Health.Status}}' ieeecs-postgres 2>/dev/null)" = "healthy" ]; do sleep 1; done
    @echo "postgres healthy on localhost:5433"

# Stop postgres, keeping the data.
db-stop:
    docker compose down

# Destroy the database and rebuild it from db/schema.sql.
db-reset:
    docker compose down -v
    @just db

# Load demo tech experiences. Safe to run twice — ids are fixed.
seed:
    docker exec -i ieeecs-postgres psql -U ieeecs -d resume_kit -q < db/seed.sql
    @just db-rows

# Delete every experience and posting, keeping the tables.
db-clear:
    docker exec ieeecs-postgres psql -U ieeecs -d resume_kit -q -c 'TRUNCATE experiences, jobs;'
    @echo "cleared"

# Open a psql shell against the running database.
psql:
    docker exec -it ieeecs-postgres psql -U ieeecs -d resume_kit

# Show what is currently stored.
db-rows:
    docker exec ieeecs-postgres psql -U ieeecs -d resume_kit \
        -c 'SELECT id, role, company, current FROM experiences ORDER BY start_date DESC;' \
        -c 'SELECT id, title, company, saved_at FROM jobs ORDER BY saved_at DESC;'

# Start everything: postgres, the API, and the frontend. Ctrl-C stops both
# servers. This is the one to run day to day.
start: db
    #!/usr/bin/env bash
    set -euo pipefail
    # Kill the whole process group on exit, so Ctrl-C never leaves a server
    # holding port 8000 or 5173.
    trap 'kill 0' EXIT INT TERM
    {{ uvicorn }} --app-dir api main:app --reload --reload-dir api --port 8000 &
    npm run dev &
    wait

# Run the FastAPI service on :8000, reloading on change.
api:
    {{ uvicorn }} --app-dir api main:app --reload --reload-dir api --port 8000

# Run the vite dev server on :5173. It proxies /api to the FastAPI service.
dev:
    npm run dev

# Build the frontend for production.
build:
    npm run build

# Serve the production build on :4173.
preview:
    npm run preview

# Lint the frontend.
lint:
    npx oxlint src

# Build and lint — what to run before committing.
check: build lint
