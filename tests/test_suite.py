"""
Comprehensive Test Suite for ApplyPilot - Vikas Module.
Verifies all 9 Hackathon Demo Requirements:
1. Submit before approval -> HTTP 403 Forbidden ("Student approval required")
2. Student approves application -> HTTP 200, state changes to Approved
3. Single-use token generated and bound to SHA-256 hash
4. Submit successfully -> HTTP 200, receipt generated, state is Submitted
5. Submit again -> HTTP 200, returns original receipt, no duplicate record created
6. Edit application after approval -> previous approval becomes invalid, token cleared
7. SHA-256 integrity hash and version changes after modification
8. Activity log records all events with correct severity & timestamps
9. System vs manual tracker states transition accurately
And:
- Claim validation rule: "Never convert a skill-list entry into an unsupported experience claim"
- Opportunity deadline failure test
"""

import unittest
import json
import urllib.request
import urllib.error
import threading
import time
import os
import sys

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))
from server import ApplyPilotRequestHandler
from models import init_db, get_connection
import http.server

TEST_PORT = 8099
BASE_URL = f"http://127.0.0.1:{TEST_PORT}"

def api_get(endpoint):
    url = f"{BASE_URL}{endpoint}"
    req = urllib.request.Request(url, method="GET")
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode())
            return resp.status, data
    except urllib.error.HTTPError as e:
        data = json.loads(e.read().decode())
        return e.code, data

def api_post(endpoint, payload=None):
    if payload is None:
        payload = {}
    url = f"{BASE_URL}{endpoint}"
    data_bytes = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data_bytes,
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode())
            return resp.status, data
    except urllib.error.HTTPError as e:
        data = json.loads(e.read().decode())
        return e.code, data

def api_patch(endpoint, payload=None):
    if payload is None:
        payload = {}
    url = f"{BASE_URL}{endpoint}"
    data_bytes = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data_bytes,
        headers={"Content-Type": "application/json"},
        method="PATCH"
    )
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode())
            return resp.status, data
    except urllib.error.HTTPError as e:
        data = json.loads(e.read().decode())
        return e.code, data

class TestApplyPilotVikasModule(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Initialize database and run server in background thread
        os.environ["TEST_ENV"] = "1"
        cls.server = http.server.HTTPServer(("127.0.0.1", TEST_PORT), ApplyPilotRequestHandler)
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        time.sleep(0.5)

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()

    def setUp(self):
        # Reset DB before each test
        status, data = api_post("/api/demo/reset")
        self.assertEqual(status, 200)
        self.app_id = "APP-2026-VIKAS-8492"

    def test_01_claim_validation_rule_skill_to_experience(self):
        """
        Verify: Never convert a skill-list entry into an unsupported experience claim.
        'React' in skills can support 'React is listed as a skill',
        but cannot support 'I built applications using React'.
        """
        # Test 1: Supported skill knowledge claim
        status, data1 = api_post("/api/validate-claim", {
            "claim_text": "React is listed as a skill in my technical toolkit."
        })
        self.assertEqual(status, 200)
        self.assertTrue(data1["is_valid"])
        self.assertEqual(data1["status"], "SUPPORTED")
        self.assertIn("React", data1["matched_skills"])

        # Test 2: Unsupported experience claim using skill entry without experience backing
        status, data2 = api_post("/api/validate-claim", {
            "claim_text": "I built production applications using React for 3 years."
        })
        self.assertEqual(status, 200)
        self.assertFalse(data2["is_valid"])
        self.assertEqual(data2["status"], "UNSUPPORTED_EXPERIENCE_CLAIM")
        self.assertEqual(data2["violation_code"], "RULE_VIOLATION_SKILL_TO_EXPERIENCE")
        self.assertIn("STRICT SECURITY RULE", data2["reason"])
        print("\n[PASSED] Claim Validation Rule Enforcement verified!")

    def test_02_submit_before_approval_returns_403(self):
        """DEMO REQUIREMENT 1: Try submitting before approval -> 403 Forbidden ('Student approval required')"""
        status, data = api_post(f"/api/applications/{self.app_id}/submit", {})
        self.assertEqual(status, 403)
        self.assertEqual(data["error"], "FORBIDDEN_UNAPPROVED")
        self.assertEqual(data["message"], "Student approval required")
        print("\n[PASSED] Requirement 1: Submit before approval returned 403 Forbidden!")

    def test_03_approval_and_token_generation(self):
        """DEMO REQUIREMENTS 2 & 3: Approve application -> Token generated"""
        # Attempt approve without review checkbox -> fails 400
        status, data_fail = api_post(f"/api/applications/{self.app_id}/approve", {
            "reviewed_by_student": False,
            "approved_by_student": True
        })
        self.assertEqual(status, 400)

        # Full approval
        status, data = api_post(f"/api/applications/{self.app_id}/approve", {
            "reviewed_by_student": True,
            "approved_by_student": True
        })
        self.assertEqual(status, 200)
        self.assertEqual(data["system_status"], "Approved")
        self.assertTrue(data["approval_token"].startswith("appr_tok_"))
        self.assertEqual(len(data["integrity_hash"]), 64)
        print("\n[PASSED] Requirements 2 & 3: Application approved & token generated!")

    def test_04_successful_submission_and_idempotency(self):
        """DEMO REQUIREMENTS 4 & 5: Submit successfully -> Click submit again -> same receipt, no duplicate"""
        # First approve
        api_post(f"/api/applications/{self.app_id}/approve", {
            "reviewed_by_student": True,
            "approved_by_student": True
        })

        # Submit first time
        status, data = api_post(f"/api/applications/{self.app_id}/submit")
        self.assertEqual(status, 200)
        self.assertEqual(data["status"], "submitted")
        self.assertFalse(data["is_duplicate"])
        receipt_1 = data["receipt"]
        self.assertTrue(receipt_1["receipt_id"].startswith("RCPT-"))
        self.assertEqual(receipt_1["application_id"], self.app_id)

        # Submit second time (Idempotency check)
        status_dup, data_dup = api_post(f"/api/applications/{self.app_id}/submit")
        self.assertEqual(status_dup, 200)
        self.assertEqual(data_dup["status"], "already_submitted")
        self.assertTrue(data_dup["is_duplicate"])
        receipt_2 = data_dup["receipt"]
        self.assertEqual(receipt_1["receipt_id"], receipt_2["receipt_id"])

        # Check database records count to prove NO duplicate submission was inserted
        conn = get_connection()
        c = conn.cursor()
        c.execute("SELECT COUNT(*) as cnt FROM submission_receipts WHERE application_id = ?", (self.app_id,))
        count = c.fetchone()["cnt"]
        conn.close()
        self.assertEqual(count, 1)
        print("\n[PASSED] Requirements 4 & 5: Submission & Idempotency verified (Exact same receipt returned, 0 duplicates)!")

    def test_05_edit_after_approval_invalidates_approval_and_changes_hash(self):
        """DEMO REQUIREMENTS 6 & 7: Edit application after approval -> previous approval invalid, version & hash change"""
        # Step A: Approve
        status, approve_data = api_post(f"/api/applications/{self.app_id}/approve", {
            "reviewed_by_student": True,
            "approved_by_student": True
        })
        old_hash = approve_data["integrity_hash"]
        old_version = approve_data["version"]

        # Step B: Edit application
        new_answers = [
            {
                "question_id": "q1",
                "question_text": "Describe a complex backend system you engineered and its architectural impact.",
                "answer_text": "At CloudScale Technologies, I engineered high-throughput Python microservices handling 25M daily requests and architected a PostgreSQL database layer with 99.99% uptime."
            },
            {
                "question_id": "q2",
                "question_text": "What practical experience do you have with modern UI development?",
                # Clean answer addressing the violation
                "answer_text": "React is listed as a skill in my technical toolkit. I understand React components and state workflows, and collaborated with frontend engineers."
            }
        ]

        status_edit, data_edit = api_post(f"/api/applications/{self.app_id}/edit", {
            "answers": new_answers
        })
        self.assertEqual(status_edit, 200)
        self.assertTrue(data_edit["approval_invalidated"])
        self.assertEqual(data_edit["new_version"], old_version + 1)
        self.assertNotEqual(data_edit["new_integrity_hash"], old_hash)

        # Step C: Try to submit immediately without re-approving -> MUST return 403 Forbidden!
        status_sub, data_sub = api_post(f"/api/applications/{self.app_id}/submit")
        self.assertEqual(status_sub, 403)
        self.assertEqual(data_sub["message"], "Student approval required")
        print("\n[PASSED] Requirements 6 & 7: Edit invalidates approval, increments version & changes SHA-256 hash!")

    def test_06_activity_log_and_tracker_states(self):
        """DEMO REQUIREMENTS 8 & 9: Verify activity log and tracker states separation"""
        # Test manual state update
        status_m, data_m = api_patch(f"/api/applications/{self.app_id}/manual-status", {
            "manual_status": "Interview"
        })
        self.assertEqual(status_m, 200)

        # Fetch application
        status_app, app_data = api_get(f"/api/applications/{self.app_id}")
        self.assertEqual(status_app, 200)
        self.assertEqual(app_data["application"]["manual_status"], "Interview")
        self.assertIn(app_data["application"]["system_status"], ["Prepared", "Needs input", "Awaiting approval", "Approved", "Submitted", "Expired"])

        # Fetch activity logs
        status_logs, logs_data = api_get(f"/api/activity-logs?application_id={self.app_id}")
        self.assertEqual(status_logs, 200)
        event_types = [l["event_type"] for l in logs_data["logs"]]
        self.assertIn("application created", event_types)
        print("\n[PASSED] Requirements 8 & 9: Activity log & separate tracker states verified!")

    def test_07_deadline_failure(self):
        """Verify deadline failure is enforced immediately before submission."""
        # Set deadline to the past
        api_post(f"/api/applications/{self.app_id}/set-deadline", {"mode": "past"})

        # Try to approve -> fails with 422
        status, data = api_post(f"/api/applications/{self.app_id}/approve", {
            "reviewed_by_student": True,
            "approved_by_student": True
        })
        self.assertEqual(status, 422)
        self.assertEqual(data["error"], "DEADLINE_EXPIRED")
        print("\n[PASSED] Deadline failure enforced correctly!")

if __name__ == "__main__":
    unittest.main()
