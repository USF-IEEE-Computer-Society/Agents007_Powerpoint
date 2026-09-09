"""Connection pool for the resume kit database."""

import os

from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool

# Matches docker-compose.yml. Host port is 5433 because 5432 is often already
# taken by a native postgres install.
DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql://ieeecs:ieeecs@localhost:5433/resume_kit",
)

# open=False so importing this module never blocks on a database that is not
# up yet; the app opens the pool during startup instead.
pool = ConnectionPool(DATABASE_URL, min_size=1, max_size=10, open=False)


def rows(sql: str, params: tuple = ()) -> list[dict]:
    """Run a query and return every row as a dict."""
    with pool.connection() as conn, conn.cursor(row_factory=dict_row) as cur:
        cur.execute(sql, params)
        return cur.fetchall()


def execute(sql: str, params: tuple = ()) -> int:
    """Run a statement and return the number of rows it touched."""
    with pool.connection() as conn, conn.cursor() as cur:
        cur.execute(sql, params)
        return cur.rowcount
