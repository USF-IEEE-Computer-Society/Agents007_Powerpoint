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
