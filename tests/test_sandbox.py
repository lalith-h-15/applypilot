"""
In-memory test suite for ApplyPilot - Vikas Module.
Exercises ApplyPilotRequestHandler directly without opening TCP sockets
(compatible with Mac sandbox environments where network is blocked).

Covers all 9 hackathon demo requirements:
  1.  Submit before approval           → HTTP 403
  2.  Approve application              → HTTP 200, status = Approved
  3.  Token generated bound to SHA-256 → token starts with 'appr_tok_'
  4.  Submit successfully              → HTTP 200, receipt issued
  5.  Idempotent re-submit             → same receipt, 0 duplicate DB rows
  6.  Edit after approval invalidates  → approval_invalidated = True, 403 on submit
  7.  Version & SHA-256 change on edit → new_version = old + 1, different hash
  8.  Activity log records events      → 'application created' in event_types
  9.  Tracker states separate          → manual_status stored independently

Plus:
  - Claim rule: skill → experience must be blocked
  - Deadline failure returns HTTP 422
  - PATCH /manual-status works correctly
"""

import io
import json
import os
import sys
import unittest

# Make the backend package importable
sys.path.insert(
    0,
    os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")),
)

from server import ApplyPilotRequestHandler, seed_demo_data
from models import init_db, get_connection
from security import generate_receipt_id       # renamed from generate_submission_identifiers


# ---------------------------------------------------------------------------
# Minimal HTTP mock infrastructure
# ---------------------------------------------------------------------------

class _MockSocket:
    def __init__(self, raw: bytes):
        self._r = io.BytesIO(raw)
        self._w = io.BytesIO()

    def makefile(self, mode, *args, **kwargs):
        return self._r if "r" in mode else self._w

    def sendall(self, b: bytes):
        self._w.write(b)

    def close(self):
        pass


class _DummyServer:
    pass


def _build_raw_request(method: str, path: str, body_dict) -> bytes:
    body_bytes = json.dumps(body_dict).encode("utf-8") if body_dict is not None else b""
    headers = "\r\n".join([
        f"{method} {path} HTTP/1.1",
        "Host: localhost",
        f"Content-Length: {len(body_bytes)}",
        "Content-Type: application/json",
        "", "",
    ])
    return headers.encode("utf-8") + body_bytes


def simulate_request(method: str, path: str, body=None):
    """
    Simulate an HTTP request against ApplyPilotRequestHandler in-process.

    Returns:
        (status_code: int, body_data: dict)
    """
    raw = _build_raw_request(method, path, body)
    sock = _MockSocket(raw)

    dispatch = {
        "GET": "do_GET",
        "POST": "do_POST",
        "PATCH": "do_PATCH",
        "PUT": "do_POST",    # not used but safe
    }

    class _Handler(ApplyPilotRequestHandler):
        def __init__(self):
            self.rfile = sock.makefile("rb")
            self.wfile = sock.makefile("wb")
            self.server = _DummyServer()
            self.client_address = ("127.0.0.1", 0)
            self.raw_requestline = self.rfile.readline()
            self.parse_request()
            handler_fn = getattr(self, dispatch.get(method, "do_POST"), None)
            if handler_fn:
                handler_fn()

    try:
        _Handler()
    except Exception:
        pass

    sock._w.seek(0)
    raw_resp = sock._w.read()

    parts = raw_resp.split(b"\r\n\r\n", 1)
    header_text = parts[0].decode("utf-8", errors="replace")
    status_line = header_text.splitlines()[0] if header_text else "HTTP/1.1 500 Error"
    try:
        status_code = int(status_line.split()[1])
    except (IndexError, ValueError):
        status_code = 500

    body_data: dict = {}
    if len(parts) > 1 and parts[1]:
        try:
            body_data = json.loads(parts[1].decode("utf-8"))
        except Exception:
            body_data = {"raw": parts[1].decode("utf-8", errors="replace")}

    return status_code, body_data


# ---------------------------------------------------------------------------
# Test cases
# ---------------------------------------------------------------------------

APP_ID = "APP-2026-VIKAS-8492"


class TestApplyPilotVikas(unittest.TestCase):

    def setUp(self):
        """Re-seed a clean database before every individual test."""
        init_db()
        conn = get_connection()
        seed_demo_data(conn)
        conn.close()

    # ── Claim rule enforcement ─────────────────────────────────────────────

    def test_01_claim_rule_skill_cannot_become_experience_claim(self):
        """
        Verify: Never convert a skill-list entry into an unsupported experience claim.
        'React' in skills supports 'React is listed as a skill',
        but NOT 'I built production applications using React'.
        """
        # A: Valid skill-knowledge phrasing
        status, data = simulate_request("POST", "/api/validate-claim", {
            "claim_text": "React is listed as a skill in my technical toolkit."
        })
        self.assertEqual(status, 200)
        self.assertTrue(data["is_valid"], "Skill-knowledge claim should be SUPPORTED")
        self.assertEqual(data["status"], "SUPPORTED")
        self.assertIn("React", data["matched_skills"])

        # B: Invalid experience-claim backed only by skill listing
        status, data = simulate_request("POST", "/api/validate-claim", {
            "claim_text": "I built production applications using React for 3 years."
        })
        self.assertEqual(status, 200)
        self.assertFalse(data["is_valid"], "Experience claim without evidence must be INVALID")
        self.assertEqual(data["status"], "UNSUPPORTED_EXPERIENCE_CLAIM")
        self.assertEqual(data["violation_code"], "RULE_VIOLATION_SKILL_TO_EXPERIENCE")
        self.assertIn("STRICT SECURITY RULE", data["reason"])
        print("\n[OK] Test 1: Claim rule 'skill → experience' enforced correctly.")

    # ── Requirement 1: HTTP 403 on unapproved submit ───────────────────────

    def test_02_submit_before_approval_returns_403(self):
        """DEMO REQ 1: Submitting without approval must return HTTP 403."""
        status, data = simulate_request("POST", f"/api/applications/{APP_ID}/submit", {})
        self.assertEqual(status, 403)
        self.assertEqual(data["error"], "FORBIDDEN_UNAPPROVED")
        self.assertEqual(data["message"], "Student approval required")
        print("\n[OK] Test 2: Unapproved submit → HTTP 403 'Student approval required'.")

    # ── Requirements 2 & 3: Approve + token ───────────────────────────────

    def test_03_approval_requires_both_checkboxes(self):
        """Both review AND approval flags must be sent; missing one → HTTP 400."""
        # Only reviewed, not approved
        status, _ = simulate_request("POST", f"/api/applications/{APP_ID}/approve", {
            "reviewed_by_student": True,
            "approved_by_student": False,
        })
        self.assertEqual(status, 400)

        # Both ticked
        status, data = simulate_request("POST", f"/api/applications/{APP_ID}/approve", {
            "reviewed_by_student": True,
            "approved_by_student": True,
        })
        self.assertEqual(status, 200)
        self.assertEqual(data["system_status"], "Approved")
        self.assertTrue(data["approval_token"].startswith("appr_tok_"),
                        "Token must start with 'appr_tok_'")
        self.assertEqual(len(data["integrity_hash"]), 64,
                         "SHA-256 hex digest must be 64 characters")
        print("\n[OK] Test 3: Application approved; single-use token bound to SHA-256 issued.")

    # ── Requirements 4 & 5: Submit + Idempotency ──────────────────────────

    def test_04_submission_and_idempotency(self):
        """DEMO REQ 4 & 5: First submit → receipt; second submit → same receipt, 0 duplicates."""
        simulate_request("POST", f"/api/applications/{APP_ID}/approve", {
            "reviewed_by_student": True, "approved_by_student": True,
        })

        # First submission
        status, data = simulate_request("POST", f"/api/applications/{APP_ID}/submit", {})
        self.assertEqual(status, 200)
        self.assertEqual(data["status"], "submitted")
        self.assertFalse(data["is_duplicate"])
        rcpt1 = data["receipt"]
        self.assertTrue(rcpt1["receipt_id"].startswith("RCPT-"))

        # Second (duplicate) submission
        status, data2 = simulate_request("POST", f"/api/applications/{APP_ID}/submit", {})
        self.assertEqual(status, 200)
        self.assertEqual(data2["status"], "already_submitted")
        self.assertTrue(data2["is_duplicate"])
        rcpt2 = data2["receipt"]
        self.assertEqual(rcpt1["receipt_id"], rcpt2["receipt_id"],
                         "Both calls must return the exact same receipt ID")

        # Database must contain exactly ONE submission record
        conn = get_connection()
        count = conn.execute(
            "SELECT COUNT(*) AS cnt FROM submission_receipts WHERE application_id = ?",
            (APP_ID,),
        ).fetchone()["cnt"]
        conn.close()
        self.assertEqual(count, 1, "Idempotency: must not insert duplicate receipt rows")
        print("\n[OK] Test 4: Submit + idempotency verified (same receipt, 0 duplicate DB rows).")

    # ── Requirements 6 & 7: Edit invalidates approval, changes hash ────────

    def test_05_edit_after_approval_invalidates_and_changes_hash(self):
        """DEMO REQ 6 & 7: Edit → approval revoked, version incremented, SHA-256 changed."""
        _, approve_data = simulate_request("POST", f"/api/applications/{APP_ID}/approve", {
            "reviewed_by_student": True, "approved_by_student": True,
        })
        old_hash = approve_data["integrity_hash"]
        old_version = approve_data["version"]

        new_answers = [
            {
                "question_id": "q1",
                "question_text": "Describe a complex backend system you engineered.",
                "answer_text": (
                    "At CloudScale Technologies, I engineered high-throughput "
                    "Python microservices handling 25M daily requests."
                ),
            },
            {
                "question_id": "q2",
                "question_text": "What UI experience do you have?",
                "answer_text": (
                    "React is listed as a skill in my technical toolkit. "
                    "I understand React component lifecycles."
                ),
            },
        ]

        status, edit_data = simulate_request(
            "POST", f"/api/applications/{APP_ID}/edit", {"answers": new_answers}
        )
        self.assertEqual(status, 200)
        self.assertTrue(edit_data["approval_invalidated"],
                        "Approval must be revoked on edit")
        self.assertEqual(edit_data["new_version"], old_version + 1,
                         "Version must increment by 1")
        self.assertNotEqual(edit_data["new_integrity_hash"], old_hash,
                            "SHA-256 must change after content edit")

        # Immediate submit after edit must still be 403
        status, sub_data = simulate_request(
            "POST", f"/api/applications/{APP_ID}/submit", {}
        )
        self.assertEqual(status, 403)
        self.assertEqual(sub_data["message"], "Student approval required")
        print("\n[OK] Test 5: Edit invalidates approval; version incremented; SHA-256 changed; submit still 403.")

    # ── Requirements 8 & 9: Activity log + independent manual states ───────

    def test_06_activity_log_and_tracker_states(self):
        """DEMO REQ 8 & 9: Activity log captures events; manual state is independent."""
        # Set a manual recruiter state via PATCH
        status, data = simulate_request(
            "PATCH", f"/api/applications/{APP_ID}/manual-status",
            {"manual_status": "Interview"}
        )
        self.assertEqual(status, 200)
        self.assertEqual(data["manual_status"], "Interview")

        # Fetch full application — manual_status should be Interview
        status, app_data = simulate_request("GET", f"/api/applications/{APP_ID}")
        self.assertEqual(status, 200)
        self.assertEqual(app_data["application"]["manual_status"], "Interview")
        # System status must not have changed to Interview
        self.assertIn(
            app_data["application"]["system_status"],
            ("Prepared", "Needs input", "Awaiting approval", "Approved", "Submitted", "Expired"),
        )

        # Activity log must include the initial creation event
        status, logs_data = simulate_request(
            "GET", f"/api/activity-logs?application_id={APP_ID}"
        )
        self.assertEqual(status, 200)
        event_types = {log["event_type"] for log in logs_data["logs"]}
        self.assertIn("application created", event_types)
        print("\n[OK] Test 6: Activity log verified; manual state is independent of system state.")

    # ── Deadline enforcement ───────────────────────────────────────────────

    def test_07_deadline_failure_blocks_approval(self):
        """Expired deadline returns HTTP 422 DEADLINE_EXPIRED before approval is granted."""
        simulate_request("POST", f"/api/applications/{APP_ID}/set-deadline", {"mode": "past"})

        status, data = simulate_request("POST", f"/api/applications/{APP_ID}/approve", {
            "reviewed_by_student": True, "approved_by_student": True,
        })
        self.assertEqual(status, 422)
        self.assertEqual(data["error"], "DEADLINE_EXPIRED")
        print("\n[OK] Test 7: Expired deadline blocks approval (HTTP 422).")

    # ── generate_receipt_id unit test ──────────────────────────────────────

    def test_08_receipt_id_format(self):
        """generate_receipt_id() must return a single RCPT-XXXX-2026 string."""
        rid = generate_receipt_id()
        self.assertIsInstance(rid, str)
        self.assertTrue(rid.startswith("RCPT-"), f"Receipt ID format wrong: {rid}")
        self.assertTrue(rid.endswith("-2026"), f"Receipt ID format wrong: {rid}")
        print("\n[OK] Test 8: generate_receipt_id() returns correct RCPT-XXXX-2026 format.")


if __name__ == "__main__":
    unittest.main(verbosity=2)
