-- Schema for the IEEE-CS at USF resume kit.
-- Loaded by the postgres container on first start (empty volume only).

CREATE TABLE IF NOT EXISTS experiences (
    id          UUID PRIMARY KEY,
    role        TEXT        NOT NULL,
    company     TEXT        NOT NULL,
    location    TEXT        NOT NULL DEFAULT '',
    start_date  TEXT        NOT NULL,
    end_date    TEXT        NOT NULL DEFAULT '',
    current     BOOLEAN     NOT NULL DEFAULT FALSE,
    description TEXT        NOT NULL DEFAULT '',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS jobs (
    id          UUID PRIMARY KEY,
    title       TEXT        NOT NULL,
    company     TEXT        NOT NULL,
    link        TEXT        NOT NULL DEFAULT '',
    description TEXT        NOT NULL,
    saved_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Both lists are read newest-first.
CREATE INDEX IF NOT EXISTS experiences_start_date_idx ON experiences (start_date DESC);
CREATE INDEX IF NOT EXISTS jobs_saved_at_idx ON jobs (saved_at DESC);
