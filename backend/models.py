"""
Database models and schema setup for ApplyPilot - Vikas Module.
Uses standard library sqlite3 for embedded, zero-dependency persistence.

FIX: DB_PATH is now resolved relative to this file's directory so
     the database always lands in data/ regardless of where the
     process is launched from.
"""

import os
import sqlite3
import json
from datetime import datetime, timezone

# Always store the DB next to the project root (one level up from backend/)
_HERE = os.path.dirname(os.path.abspath(__file__))
_PROJECT_ROOT = os.path.dirname(_HERE)
DB_PATH = os.path.join(_PROJECT_ROOT, "data", "applypilot.db")

# Ensure data directory exists
os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)


def get_connection(db_path: str = DB_PATH) -> sqlite3.Connection:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db(db_path: str = DB_PATH) -> None:
    """Create all tables if they do not already exist."""
    conn = get_connection(db_path)
    cursor = conn.cursor()
    cursor.executescript("""
    CREATE TABLE IF NOT EXISTS candidate_profiles (
        id                          TEXT PRIMARY KEY,
        name                        TEXT NOT NULL,
        email                       TEXT NOT NULL,
        skills_json                 TEXT NOT NULL,
        experience_json             TEXT NOT NULL,
        projects_json               TEXT NOT NULL,
        missing_profile_fields_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS applications (
        id                   TEXT PRIMARY KEY,
        candidate_id         TEXT NOT NULL,
        candidate_name       TEXT NOT NULL,
        target_company       TEXT NOT NULL,
        target_role          TEXT NOT NULL,
        opportunity_deadline TEXT NOT NULL,
        current_version      INTEGER NOT NULL DEFAULT 1,
        system_status        TEXT    NOT NULL DEFAULT 'Prepared',
        manual_status        TEXT,
        is_approved          INTEGER NOT NULL DEFAULT 0,
        approval_token       TEXT,
        token_generated_at   TEXT,
        token_expires_at     TEXT,
        reviewed_by_student  INTEGER NOT NULL DEFAULT 0,
        approved_by_student  INTEGER NOT NULL DEFAULT 0,
        created_at           TEXT NOT NULL,
        updated_at           TEXT NOT NULL,
        FOREIGN KEY (candidate_id) REFERENCES candidate_profiles(id)
    );

    CREATE TABLE IF NOT EXISTS application_versions (
        id               INTEGER PRIMARY KEY AUTOINCREMENT,
        application_id   TEXT    NOT NULL,
        version_number   INTEGER NOT NULL,
        answers_json     TEXT    NOT NULL,
        claims_json      TEXT    NOT NULL,
        integrity_hash   TEXT    NOT NULL,
        canonical_payload TEXT   NOT NULL,
        created_at       TEXT    NOT NULL,
        FOREIGN KEY (application_id) REFERENCES applications(id),
        UNIQUE(application_id, version_number)
    );

    CREATE TABLE IF NOT EXISTS submission_receipts (
        id                   INTEGER PRIMARY KEY AUTOINCREMENT,
        application_id       TEXT    NOT NULL REFERENCES applications(id),
        version_number       INTEGER NOT NULL,
        receipt_id           TEXT    NOT NULL UNIQUE,
        integrity_hash       TEXT    NOT NULL,
        submission_payload   TEXT    NOT NULL,
        submitted_at         TEXT    NOT NULL,
        portal_confirmation  TEXT    NOT NULL
    );

    CREATE TABLE IF NOT EXISTS activity_logs (
        id             INTEGER PRIMARY KEY AUTOINCREMENT,
        application_id TEXT NOT NULL,
        event_type     TEXT NOT NULL,
        description    TEXT NOT NULL,
        severity       TEXT NOT NULL DEFAULT 'INFO',
        metadata_json  TEXT NOT NULL,
        timestamp      TEXT NOT NULL
    );
    """)
    conn.commit()
    conn.close()


def log_activity(
    conn: sqlite3.Connection,
    application_id: str,
    event_type: str,
    description: str,
    severity: str = "INFO",
    metadata: dict = None,
) -> None:
    """Insert a single audit-log entry and commit."""
    if metadata is None:
        metadata = {}
    now = datetime.now(timezone.utc).isoformat()
    conn.execute(
        """
        INSERT INTO activity_logs
            (application_id, event_type, description, severity, metadata_json, timestamp)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (application_id, event_type, description, severity,
         json.dumps(metadata, sort_keys=True), now),
    )
    conn.commit()


if __name__ == "__main__":
    init_db()
    print(f"Database initialised at: {DB_PATH}")
