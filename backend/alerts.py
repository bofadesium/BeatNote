"""Clinician alert store (SQLite for the demo; use Postgres in production).

This records and tracks alerts. Actual delivery (pager, secure messaging, EHR in-basket)
is NOT integrated yet: `deliver()` is the single place to plug it in.
"""
import json
import os
import pathlib
import sqlite3
from datetime import datetime, timedelta, timezone

DEDUP_MINUTES = 10


def _db_path() -> pathlib.Path:
    return pathlib.Path(os.getenv("BEATNOTE_DB", pathlib.Path(__file__).parent / "data" / "beatnote.db"))


def _conn():
    p = _db_path()
    p.parent.mkdir(parents=True, exist_ok=True)
    c = sqlite3.connect(p)
    c.row_factory = sqlite3.Row
    c.execute("""CREATE TABLE IF NOT EXISTS alerts(
        id INTEGER PRIMARY KEY AUTOINCREMENT, case_id TEXT NOT NULL, level TEXT NOT NULL,
        reasons TEXT NOT NULL, created_at TEXT NOT NULL, acked_at TEXT)""")
    return c


def _row(r) -> dict:
    d = dict(r)
    d["reasons"] = json.loads(d["reasons"])
    return d


def deliver(alert: dict) -> None:
    """Hook for real notification channels. For now: log only."""
    print(f"[ALERT {alert['id']}] {alert['level']} case={alert['case_id']} reasons={alert['reasons']}")


def create_alert(case_id: str, level: str, reasons: list[str]) -> dict:
    now = datetime.now(timezone.utc)
    with _conn() as c:
        cutoff = (now - timedelta(minutes=DEDUP_MINUTES)).isoformat()
        existing = c.execute(
            "SELECT * FROM alerts WHERE case_id=? AND acked_at IS NULL AND created_at>=? ORDER BY id DESC LIMIT 1",
            (case_id, cutoff)).fetchone()
        if existing:
            return {**_row(existing), "deduped": True}
        cur = c.execute("INSERT INTO alerts(case_id, level, reasons, created_at) VALUES(?,?,?,?)",
                        (case_id, level, json.dumps(reasons), now.isoformat()))
        alert = _row(c.execute("SELECT * FROM alerts WHERE id=?", (cur.lastrowid,)).fetchone())
    deliver(alert)
    return {**alert, "deduped": False}


def list_alerts(limit: int = 50) -> list[dict]:
    with _conn() as c:
        return [_row(r) for r in c.execute("SELECT * FROM alerts ORDER BY id DESC LIMIT ?", (limit,))]


def ack_alert(alert_id: int):
    with _conn() as c:
        c.execute("UPDATE alerts SET acked_at=? WHERE id=? AND acked_at IS NULL",
                  (datetime.now(timezone.utc).isoformat(), alert_id))
        r = c.execute("SELECT * FROM alerts WHERE id=?", (alert_id,)).fetchone()
    return _row(r) if r else None
