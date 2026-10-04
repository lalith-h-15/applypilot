"""
Production REST API Server for ApplyPilot - Vikas Module.
Built with Python 3 Standard Library: http.server + sqlite3 + hashlib.

Endpoints
---------
GET  /                                          → serves frontend/index.html
GET  /style.css | /app.js                       → static assets
GET  /api/health                                → health check
GET  /api/applications                          → list all applications
GET  /api/applications/<id>                     → full application detail
GET  /api/activity-logs?application_id=<id>     → activity log
POST /api/demo/reset                            → re-seed demo data
POST /api/validate-claim                        → live claim rule tester
POST /api/applications/<id>/edit               → edit answers (invalidates approval)
POST /api/applications/<id>/request-approval   → move to 'Awaiting approval'
POST /api/applications/<id>/approve            → approve + issue single-use token
POST /api/applications/<id>/submit             → submit (403 if unapproved, idempotent)
POST /api/applications/<id>/set-deadline       → toggle deadline past/future (demo)
PATCH /api/applications/<id>/manual-status     → set Interview / Selected / Rejected

FIX: Added do_PATCH() so PATCH /manual-status is correctly routed (was silently
     falling through to do_POST which then failed to match any handler path).
"""

import http.server
import json
import os
import sys
import urllib.parse
from datetime import datetime, timezone, timedelta
from typing import Any, Dict

# ---------------------------------------------------------------------------
# Allow running the file directly from the backend/ directory OR from any cwd
# ---------------------------------------------------------------------------
_BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
if _BACKEND_DIR not in sys.path:
    sys.path.insert(0, _BACKEND_DIR)

from models import init_db, get_connection, log_activity
from validation_engine import evaluate_application_answers, validate_claim
from security import (
    generate_canonical_payload,
    generate_approval_token,
    is_deadline_expired,
    generate_receipt_id,           # renamed from generate_submission_identifiers
)

PORT = 8000
FRONTEND_DIR = os.path.abspath(os.path.join(_BACKEND_DIR, "..", "frontend"))


# ---------------------------------------------------------------------------
# Demo seed data
# ---------------------------------------------------------------------------

def seed_demo_data(conn) -> None:
    """Wipe and re-seed all demo data for a clean hackathon demonstration."""
    cur = conn.cursor()
    for table in ("activity_logs", "submission_receipts",
                  "application_versions", "applications", "candidate_profiles"):
        cur.execute(f"DELETE FROM {table}")

    # ── Candidate profile ─────────────────────────────────────────────────
    skills = ["React", "TypeScript", "Python", "FastAPI",
              "PostgreSQL", "Docker", "Distributed Systems"]
    experience = [
        {
            "company": "CloudScale Technologies",
            "role": "Senior Backend Engineer",
            "period": "2023 - Present",
            "technologies": ["Python", "FastAPI", "PostgreSQL",
                             "Docker", "Distributed Systems"],
            "summary": (
                "Engineered high-throughput Python microservices handling "
                "25M daily requests. Architected PostgreSQL database layer "
                "with 99.99% uptime."
            ),
            "verified": True,
        }
    ]
    projects = [
        {
            "name": "Distributed Task Queue",
            "technologies": ["Python", "Docker"],
            "summary": "Built high-reliability async job processor with resilient retries.",
            "repo_url": "https://github.com/vikas/distributed-task-queue",
            "verified": True,
        }
    ]
    missing_fields = [
        "No verified work experience or project repo for React "
        "(React only exists in skills list)",
        "Missing portfolio link for frontend applications",
    ]

    cur.execute(
        """
        INSERT INTO candidate_profiles
            (id, name, email, skills_json, experience_json,
             projects_json, missing_profile_fields_json)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (
            "CAND-VIKAS-01", "Vikas Sajjan", "vikas@applypilot.dev",
            json.dumps(skills), json.dumps(experience),
            json.dumps(projects), json.dumps(missing_fields),
        ),
    )

    # ── Application ───────────────────────────────────────────────────────
    app_id = "APP-2026-VIKAS-8492"
    future_deadline = (datetime.now(timezone.utc) + timedelta(hours=48)).isoformat()

    # Q2 intentionally contains a skill→experience rule violation to demo it
    initial_answers = [
        {
            "question_id": "q1",
            "question_text": (
                "Describe a complex backend system you engineered "
                "and its architectural impact."
            ),
            "answer_text": (
                "At CloudScale Technologies, I engineered high-throughput "
                "Python microservices handling 25M daily requests and "
                "architected a PostgreSQL database layer with 99.99% uptime."
            ),
        },
        {
            "question_id": "q2",
            "question_text": (
                "What practical experience do you have with modern UI development?"
            ),
            "answer_text": (
                "I built production web applications using React for 2 years "
                "and led frontend feature delivery."
            ),
        },
    ]

    now = datetime.now(timezone.utc).isoformat()

    cur.execute(
        """
        INSERT INTO applications (
            id, candidate_id, candidate_name, target_company, target_role,
            opportunity_deadline, current_version, system_status, manual_status,
            is_approved, approval_token, token_generated_at, token_expires_at,
            reviewed_by_student, approved_by_student, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            app_id, "CAND-VIKAS-01", "Vikas Sajjan",
            "Stripe", "Full-Stack Software Engineer",
            future_deadline, 1, "Needs input", None,
            0, None, None, None,
            0, 0, now, now,
        ),
    )

    # Compute initial integrity hash
    candidate_profile = {
        "skills": skills, "experience": experience,
        "projects": projects, "missing_profile_fields": missing_fields,
    }
    app_dict = {
        "id": app_id, "candidate_id": "CAND-VIKAS-01",
        "target_company": "Stripe", "target_role": "Full-Stack Software Engineer",
        "current_version": 1, "opportunity_deadline": future_deadline,
        "answers": initial_answers,
    }
    canonical_payload, integrity_hash = generate_canonical_payload(app_dict)
    eval_result = evaluate_application_answers(initial_answers, candidate_profile)

    cur.execute(
        """
        INSERT INTO application_versions
            (application_id, version_number, answers_json, claims_json,
             integrity_hash, canonical_payload, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (
            app_id, 1,
            json.dumps(initial_answers), json.dumps(eval_result["all_claims"]),
            integrity_hash, canonical_payload, now,
        ),
    )

    log_activity(conn, app_id, "application created",
                 "Application created for Stripe "
                 "(Role: Full-Stack Software Engineer, Version: v1)",
                 "INFO", {"version": 1, "hash": integrity_hash})
    log_activity(conn, app_id, "version created",
                 f"Initial version v1 compiled with SHA-256: {integrity_hash[:16]}...",
                 "INFO", {"version": 1, "hash": integrity_hash})

    conn.commit()


# ---------------------------------------------------------------------------
# HTTP Request Handler
# ---------------------------------------------------------------------------

class ApplyPilotRequestHandler(http.server.BaseHTTPRequestHandler):

    # ── Helpers ──────────────────────────────────────────────────────────

    def log_message(self, fmt, *args):
        """Override to prefix logs with module name."""
        print(f"[ApplyPilot] {self.address_string()} - {fmt % args}")

    def send_json(self, status_code: int, data: Any) -> None:
        body = json.dumps(data, indent=2).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods",
                         "GET, POST, PUT, PATCH, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers",
                         "Content-Type, Authorization")
        self.end_headers()
        self.wfile.write(body)

    def parse_json_body(self) -> Dict[str, Any]:
        try:
            length = int(self.headers.get("Content-Length", 0))
            if length > 0:
                return json.loads(self.rfile.read(length).decode("utf-8"))
        except Exception:
            pass
        return {}

    def _get_app(self, conn, app_id: str):
        """Return dict for application row or None."""
        row = conn.execute(
            "SELECT * FROM applications WHERE id = ?", (app_id,)
        ).fetchone()
        return dict(row) if row else None

    # ── CORS preflight ────────────────────────────────────────────────────

    def do_OPTIONS(self) -> None:
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods",
                         "GET, POST, PUT, PATCH, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers",
                         "Content-Type, Authorization")
        self.end_headers()

    # ── Static files ──────────────────────────────────────────────────────

    def serve_static_file(self, filename: str, content_type: str) -> None:
        filepath = os.path.join(FRONTEND_DIR, filename)
        if not os.path.exists(filepath):
            self.send_response(404)
            self.end_headers()
            self.wfile.write(b"404 Not Found")
            return
        with open(filepath, "rb") as fh:
            content = fh.read()
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(content)))
        self.send_header("Cache-Control", "no-cache")
        self.end_headers()
        self.wfile.write(content)

    # ── GET ───────────────────────────────────────────────────────────────

    def do_GET(self) -> None:
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        if path in ("/", "/index.html"):
            return self.serve_static_file("index.html", "text/html")
        if path == "/style.css":
            return self.serve_static_file("style.css", "text/css")
        if path == "/app.js":
            return self.serve_static_file("app.js", "application/javascript")

        conn = get_connection()
        try:
            if path == "/api/health":
                return self.send_json(200, {
                    "status": "ok",
                    "module": "ApplyPilot Vikas Module",
                    "time": datetime.now(timezone.utc).isoformat(),
                })

            if path == "/api/applications":
                rows = conn.execute(
                    "SELECT * FROM applications ORDER BY created_at DESC"
                ).fetchall()
                return self.send_json(200, {"applications": [dict(r) for r in rows]})

            if path.startswith("/api/applications/"):
                app_id = path[len("/api/applications/"):].strip()
                app = self._get_app(conn, app_id)
                if not app:
                    return self.send_json(404, {"error": "Application not found", "id": app_id})

                # Candidate profile
                cand_row = conn.execute(
                    "SELECT * FROM candidate_profiles WHERE id = ?",
                    (app["candidate_id"],),
                ).fetchone()
                candidate_profile = {}
                if cand_row:
                    candidate_profile = {
                        "id": cand_row["id"],
                        "name": cand_row["name"],
                        "email": cand_row["email"],
                        "skills": json.loads(cand_row["skills_json"]),
                        "experience": json.loads(cand_row["experience_json"]),
                        "projects": json.loads(cand_row["projects_json"]),
                        "missing_profile_fields": json.loads(
                            cand_row["missing_profile_fields_json"]
                        ),
                    }

                # Current version
                v_row = conn.execute(
                    """SELECT * FROM application_versions
                       WHERE application_id = ? AND version_number = ?""",
                    (app_id, app["current_version"]),
                ).fetchone()
                current_version_data = {}
                if v_row:
                    current_version_data = {
                        "version_number": v_row["version_number"],
                        "answers": json.loads(v_row["answers_json"]),
                        "claims": json.loads(v_row["claims_json"]),
                        "integrity_hash": v_row["integrity_hash"],
                        "canonical_payload": v_row["canonical_payload"],
                        "created_at": v_row["created_at"],
                    }

                # Version history
                versions_history = [
                    dict(r)
                    for r in conn.execute(
                        """SELECT version_number, integrity_hash, created_at
                           FROM application_versions WHERE application_id = ?
                           ORDER BY version_number ASC""",
                        (app_id,),
                    ).fetchall()
                ]

                # Submission receipts
                receipts = [
                    dict(r)
                    for r in conn.execute(
                        """SELECT * FROM submission_receipts
                           WHERE application_id = ?
                           ORDER BY submitted_at DESC""",
                        (app_id,),
                    ).fetchall()
                ]

                # Run validation report against current answers
                eval_res: Dict = {}
                if current_version_data.get("answers") and candidate_profile:
                    eval_res = evaluate_application_answers(
                        current_version_data["answers"], candidate_profile
                    )

                is_expired, deadline_desc = is_deadline_expired(
                    app["opportunity_deadline"]
                )

                return self.send_json(200, {
                    "application": app,
                    "candidate_profile": candidate_profile,
                    "current_version": current_version_data,
                    "versions_history": versions_history,
                    "receipts": receipts,
                    "validation_report": eval_res,
                    "deadline_status": {
                        "is_expired": is_expired,
                        "description": deadline_desc,
                        "deadline_iso": app["opportunity_deadline"],
                    },
                })

            if path == "/api/activity-logs":
                qp = urllib.parse.parse_qs(parsed.query)
                app_id = qp.get("application_id", [None])[0]
                if app_id:
                    rows = conn.execute(
                        """SELECT * FROM activity_logs
                           WHERE application_id = ?
                           ORDER BY id DESC LIMIT 50""",
                        (app_id,),
                    ).fetchall()
                else:
                    rows = conn.execute(
                        "SELECT * FROM activity_logs ORDER BY id DESC LIMIT 50"
                    ).fetchall()

                logs = []
                for row in rows:
                    d = dict(row)
                    d["metadata"] = json.loads(d["metadata_json"])
                    logs.append(d)
                return self.send_json(200, {"logs": logs})

            return self.send_json(404, {"error": "Not Found"})
        finally:
            conn.close()

    # ── POST ──────────────────────────────────────────────────────────────

    def do_POST(self) -> None:
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        body = self.parse_json_body()
        conn = get_connection()

        try:
            # ── Demo reset ────────────────────────────────────────────────
            if path == "/api/demo/reset":
                seed_demo_data(conn)
                return self.send_json(200, {
                    "message": "Demo data reset successfully",
                    "application_id": "APP-2026-VIKAS-8492",
                })

            # ── Live claim validator ──────────────────────────────────────
            if path == "/api/validate-claim":
                claim_text = body.get("claim_text", "")
                candidate_id = body.get("candidate_id", "CAND-VIKAS-01")
                c_row = conn.execute(
                    "SELECT * FROM candidate_profiles WHERE id = ?",
                    (candidate_id,),
                ).fetchone()
                if not c_row:
                    return self.send_json(404, {"error": "Candidate not found"})
                profile = {
                    "skills": json.loads(c_row["skills_json"]),
                    "experience": json.loads(c_row["experience_json"]),
                    "projects": json.loads(c_row["projects_json"]),
                    "missing_profile_fields": json.loads(
                        c_row["missing_profile_fields_json"]
                    ),
                }
                return self.send_json(200, validate_claim(claim_text, profile))

            # ── Edit answers ──────────────────────────────────────────────
            if path.startswith("/api/applications/") and path.endswith("/edit"):
                app_id = path[len("/api/applications/"):-len("/edit")].strip()
                new_answers = body.get("answers", [])
                if not new_answers:
                    return self.send_json(400, {"error": "answers array is required"})

                app = self._get_app(conn, app_id)
                if not app:
                    return self.send_json(404, {"error": "Application not found"})

                prev_approved = bool(app["is_approved"])
                prev_version = app["current_version"]
                new_version = prev_version + 1
                now = datetime.now(timezone.utc).isoformat()

                app_dict = {
                    "id": app_id,
                    "candidate_id": app["candidate_id"],
                    "target_company": app["target_company"],
                    "target_role": app["target_role"],
                    "current_version": new_version,
                    "opportunity_deadline": app["opportunity_deadline"],
                    "answers": new_answers,
                }
                canonical_payload, new_hash = generate_canonical_payload(app_dict)

                cand_row = conn.execute(
                    "SELECT * FROM candidate_profiles WHERE id = ?",
                    (app["candidate_id"],),
                ).fetchone()
                candidate_profile = {
                    "skills": json.loads(cand_row["skills_json"]),
                    "experience": json.loads(cand_row["experience_json"]),
                    "projects": json.loads(cand_row["projects_json"]),
                    "missing_profile_fields": json.loads(
                        cand_row["missing_profile_fields_json"]
                    ),
                }
                eval_res = evaluate_application_answers(new_answers, candidate_profile)

                conn.execute(
                    """
                    INSERT INTO application_versions
                        (application_id, version_number, answers_json,
                         claims_json, integrity_hash, canonical_payload, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        app_id, new_version,
                        json.dumps(new_answers), json.dumps(eval_res["all_claims"]),
                        new_hash, canonical_payload, now,
                    ),
                )

                new_status = eval_res["recommended_system_state"]
                conn.execute(
                    """
                    UPDATE applications
                    SET current_version      = ?,
                        system_status        = ?,
                        is_approved          = 0,
                        approval_token       = NULL,
                        token_generated_at   = NULL,
                        token_expires_at     = NULL,
                        reviewed_by_student  = 0,
                        approved_by_student  = 0,
                        updated_at           = ?
                    WHERE id = ?
                    """,
                    (new_version, new_status, now, app_id),
                )

                log_activity(
                    conn, app_id, "application edited",
                    f"Application modified. Version incremented to v{new_version}. "
                    f"{'Previous approval and token invalidated.' if prev_approved else ''}",
                    "WARNING" if prev_approved else "INFO",
                    {
                        "previous_version": prev_version,
                        "new_version": new_version,
                        "approval_invalidated": prev_approved,
                    },
                )
                log_activity(
                    conn, app_id, "version created",
                    f"Version v{new_version} created. "
                    f"New SHA-256: {new_hash[:16]}...",
                    "INFO",
                    {"version": new_version, "integrity_hash": new_hash},
                )
                conn.commit()

                return self.send_json(200, {
                    "message": "Application edited successfully",
                    "previous_version": prev_version,
                    "new_version": new_version,
                    "approval_invalidated": prev_approved,
                    "new_integrity_hash": new_hash,
                    "system_status": new_status,
                    "validation_report": eval_res,
                })

            # ── Request approval ──────────────────────────────────────────
            if path.startswith("/api/applications/") and path.endswith("/request-approval"):
                app_id = path[len("/api/applications/"):-len("/request-approval")].strip()
                app = self._get_app(conn, app_id)
                if not app:
                    return self.send_json(404, {"error": "Application not found"})
                now = datetime.now(timezone.utc).isoformat()
                conn.execute(
                    "UPDATE applications SET system_status = 'Awaiting approval', "
                    "updated_at = ? WHERE id = ?",
                    (now, app_id),
                )
                log_activity(conn, app_id, "approval requested",
                             "Candidate requested review and submission approval.", "INFO")
                conn.commit()
                return self.send_json(200, {
                    "message": "Approval requested",
                    "system_status": "Awaiting approval",
                })

            # ── Approve application ───────────────────────────────────────
            if path.startswith("/api/applications/") and path.endswith("/approve"):
                app_id = path[len("/api/applications/"):-len("/approve")].strip()
                reviewed = body.get("reviewed_by_student", False)
                approved = body.get("approved_by_student", False)

                # REQUIREMENT: both checklist items must be explicitly ticked
                if not reviewed or not approved:
                    return self.send_json(400, {
                        "error": "APPROVAL_CHECKLIST_INCOMPLETE",
                        "message": (
                            "Both student review and student approval "
                            "checkboxes are required to grant approval."
                        ),
                        "reviewed_by_student": reviewed,
                        "approved_by_student": approved,
                    })

                app = self._get_app(conn, app_id)
                if not app:
                    return self.send_json(404, {"error": "Application not found"})

                # Deadline check
                is_expired, deadline_msg = is_deadline_expired(app["opportunity_deadline"])
                if is_expired:
                    log_activity(conn, app_id, "deadline failure",
                                 f"Cannot approve: {deadline_msg}", "ERROR")
                    conn.execute(
                        "UPDATE applications SET system_status = 'Expired' WHERE id = ?",
                        (app_id,),
                    )
                    conn.commit()
                    return self.send_json(422, {
                        "error": "DEADLINE_EXPIRED",
                        "message": f"Approval rejected: {deadline_msg}",
                    })

                v_row = conn.execute(
                    """SELECT integrity_hash FROM application_versions
                       WHERE application_id = ? AND version_number = ?""",
                    (app_id, app["current_version"]),
                ).fetchone()
                if not v_row:
                    return self.send_json(500, {"error": "Version record missing"})
                integrity_hash = v_row["integrity_hash"]

                token, gen_at, exp_at = generate_approval_token(
                    app_id, app["current_version"], integrity_hash
                )
                now = datetime.now(timezone.utc).isoformat()

                conn.execute(
                    """
                    UPDATE applications
                    SET is_approved         = 1,
                        approval_token      = ?,
                        token_generated_at  = ?,
                        token_expires_at    = ?,
                        reviewed_by_student = 1,
                        approved_by_student = 1,
                        system_status       = 'Approved',
                        updated_at          = ?
                    WHERE id = ?
                    """,
                    (token, gen_at, exp_at, now, app_id),
                )

                log_activity(
                    conn, app_id, "approved",
                    f"Application v{app['current_version']} approved by student. "
                    f"Integrity hash: {integrity_hash[:16]}...",
                    "SUCCESS",
                    {"version": app["current_version"], "integrity_hash": integrity_hash},
                )
                log_activity(
                    conn, app_id, "token generated",
                    f"Single-use approval token issued for version v{app['current_version']}.",
                    "SECURITY",
                    {"token_prefix": token[:24] + "...", "expires_at": exp_at},
                )
                conn.commit()

                return self.send_json(200, {
                    "message": "Application approved successfully",
                    "system_status": "Approved",
                    "version": app["current_version"],
                    "integrity_hash": integrity_hash,
                    "approval_token": token,
                    "expires_at": exp_at,
                })

            # ── Submit application ─────────────────────────────────────────
            if path.startswith("/api/applications/") and path.endswith("/submit"):
                app_id = path[len("/api/applications/"):-len("/submit")].strip()
                supplied_token = body.get("approval_token")

                app = self._get_app(conn, app_id)
                if not app:
                    return self.send_json(404, {"error": "Application not found"})

                # ── CHECK 1: Idempotency ───────────────────────────────────
                existing = conn.execute(
                    """SELECT * FROM submission_receipts
                       WHERE application_id = ? ORDER BY submitted_at ASC""",
                    (app_id,),
                ).fetchall()
                if existing:
                    orig = dict(existing[0])
                    log_activity(
                        conn, app_id, "duplicate submission attempt",
                        f"Idempotent call: already submitted. "
                        f"Returning original receipt {orig['receipt_id']}.",
                        "WARNING",
                        {"receipt_id": orig["receipt_id"],
                         "version": orig["version_number"]},
                    )
                    conn.commit()
                    return self.send_json(200, {
                        "status": "already_submitted",
                        "is_duplicate": True,
                        "message": (
                            "Application was previously submitted. "
                            "Idempotency enforced: returned existing receipt "
                            "without creating duplicate."
                        ),
                        "receipt": orig,
                    })

                # ── CHECK 2: Server-side approval gate (HTTP 403) ──────────
                if not app["is_approved"] or not app["approval_token"]:
                    log_activity(
                        conn, app_id, "submission attempted",
                        "Submission blocked: Student approval required (HTTP 403).",
                        "SECURITY",
                        {"reason": "UNAPPROVED_ATTEMPT",
                         "is_approved": bool(app["is_approved"])},
                    )
                    conn.commit()
                    return self.send_json(403, {
                        "error": "FORBIDDEN_UNAPPROVED",
                        "message": "Student approval required",
                        "detail": (
                            "Server-side security check failed: application has not "
                            "been approved or approval token is missing."
                        ),
                    })

                # Token match check (optional payload field)
                if supplied_token and supplied_token != app["approval_token"]:
                    log_activity(
                        conn, app_id, "submission attempted",
                        "Submission blocked: approval token mismatch.",
                        "SECURITY",
                        {"reason": "TOKEN_MISMATCH"},
                    )
                    conn.commit()
                    return self.send_json(403, {
                        "error": "FORBIDDEN_INVALID_TOKEN",
                        "message": "Student approval required",
                        "detail": "Provided token does not match the active server token.",
                    })

                # ── CHECK 3: Deadline immediately before submission ─────────
                is_expired, deadline_msg = is_deadline_expired(app["opportunity_deadline"])
                if is_expired:
                    conn.execute(
                        "UPDATE applications SET system_status = 'Expired' WHERE id = ?",
                        (app_id,),
                    )
                    log_activity(conn, app_id, "deadline failure",
                                 f"Submission aborted: {deadline_msg}",
                                 "ERROR",
                                 {"deadline": app["opportunity_deadline"]})
                    conn.commit()
                    return self.send_json(422, {
                        "error": "DEADLINE_EXPIRED",
                        "message": f"Deadline failure: {deadline_msg}",
                    })

                # ── All checks passed: process submission ──────────────────
                log_activity(
                    conn, app_id, "submission attempted",
                    f"Submission initiated for {app['target_company']} "
                    f"(Role: {app['target_role']}, Version: v{app['current_version']}).",
                    "INFO",
                )

                v_row = conn.execute(
                    """SELECT integrity_hash, canonical_payload
                       FROM application_versions
                       WHERE application_id = ? AND version_number = ?""",
                    (app_id, app["current_version"]),
                ).fetchone()
                integrity_hash = v_row["integrity_hash"]

                receipt_id = generate_receipt_id()
                now = datetime.now(timezone.utc).isoformat()
                portal_confirmation = f"EXT_PORTAL_CONF_{receipt_id[5:11]}"

                submission_meta = {
                    "application_id": app_id,
                    "target_company": app["target_company"],
                    "target_role": app["target_role"],
                    "candidate_id": app["candidate_id"],
                    "version_number": app["current_version"],
                    "integrity_hash": integrity_hash,
                    "used_token": app["approval_token"],
                    "submitted_at": now,
                }

                conn.execute(
                    """
                    INSERT INTO submission_receipts
                        (application_id, version_number, receipt_id,
                         integrity_hash, submission_payload, submitted_at,
                         portal_confirmation)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        app_id, app["current_version"], receipt_id,
                        integrity_hash, json.dumps(submission_meta),
                        now, portal_confirmation,
                    ),
                )

                # Consume single-use token: set to NULL and mark Submitted
                conn.execute(
                    """
                    UPDATE applications
                    SET system_status  = 'Submitted',
                        approval_token = NULL,
                        updated_at     = ?
                    WHERE id = ?
                    """,
                    (now, app_id),
                )

                log_activity(
                    conn, app_id, "submission successful",
                    f"Application submitted! Receipt: {receipt_id}. Token consumed.",
                    "SUCCESS",
                    {
                        "receipt_id": receipt_id,
                        "portal_confirmation": portal_confirmation,
                        "version": app["current_version"],
                    },
                )
                conn.commit()

                return self.send_json(200, {
                    "status": "submitted",
                    "is_duplicate": False,
                    "message": "Application submitted successfully.",
                    "receipt": {
                        "receipt_id": receipt_id,
                        "application_id": app_id,
                        "version_number": app["current_version"],
                        "integrity_hash": integrity_hash,
                        "submitted_at": now,
                        "portal_confirmation": portal_confirmation,
                    },
                })

            # ── Toggle deadline (demo utility) ────────────────────────────
            if path.startswith("/api/applications/") and path.endswith("/set-deadline"):
                app_id = path[len("/api/applications/"):-len("/set-deadline")].strip()
                mode = body.get("mode", "future")
                now = datetime.now(timezone.utc)
                new_deadline = (
                    (now - timedelta(hours=2)).isoformat()
                    if mode == "past"
                    else (now + timedelta(hours=48)).isoformat()
                )
                conn.execute(
                    "UPDATE applications SET opportunity_deadline = ?, updated_at = ? WHERE id = ?",
                    (new_deadline, now.isoformat(), app_id),
                )
                conn.commit()
                return self.send_json(200, {
                    "message": f"Deadline updated to {mode}",
                    "new_deadline": new_deadline,
                })

            return self.send_json(404, {"error": "Endpoint not found"})

        except Exception as exc:
            conn.rollback()
            return self.send_json(500, {
                "error": "Internal Server Error",
                "detail": str(exc),
            })
        finally:
            conn.close()

    # ── PATCH ─────────────────────────────────────────────────────────────
    # FIX: PATCH was not implemented. The frontend sends PATCH for
    #      /manual-status. Previously, test_sandbox.py fell back to do_POST
    #      which also works, but a browser sending PATCH would get no handler.

    def do_PATCH(self) -> None:
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        body = self.parse_json_body()
        conn = get_connection()

        try:
            if path.startswith("/api/applications/") and path.endswith("/manual-status"):
                app_id = path[len("/api/applications/"):-len("/manual-status")].strip()
                manual_status = body.get("manual_status")

                if manual_status not in ("Interview", "Selected", "Rejected", None):
                    return self.send_json(400, {
                        "error": "Invalid manual_status",
                        "allowed": ["Interview", "Selected", "Rejected", None],
                    })

                conn.execute(
                    "UPDATE applications SET manual_status = ? WHERE id = ?",
                    (manual_status, app_id),
                )
                log_activity(
                    conn, app_id, "application edited",
                    f"Recruiter manual status changed to: {manual_status or 'None'}",
                    "INFO",
                )
                conn.commit()
                return self.send_json(200, {"manual_status": manual_status})

            return self.send_json(404, {"error": "Endpoint not found"})

        except Exception as exc:
            conn.rollback()
            return self.send_json(500, {
                "error": "Internal Server Error",
                "detail": str(exc),
            })
        finally:
            conn.close()


# ---------------------------------------------------------------------------
# Server entry-point
# ---------------------------------------------------------------------------

def run_server(port: int = PORT) -> None:
    init_db()
    conn = get_connection()
    row = conn.execute("SELECT COUNT(*) AS cnt FROM applications").fetchone()
    if row["cnt"] == 0:
        seed_demo_data(conn)
    conn.close()

    server = http.server.HTTPServer(("0.0.0.0", port), ApplyPilotRequestHandler)
    print(f"╔══════════════════════════════════════════════════╗")
    print(f"║  ApplyPilot - Vikas Module                       ║")
    print(f"║  Server: http://localhost:{port:<23}║")
    print(f"╚══════════════════════════════════════════════════╝")
    server.serve_forever()


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else PORT
    run_server(port)
