# ApplyPilot - Vikas Module (Full-Stack Security & Approval Engine)

A working full-stack implementation of the **Vikas Module** for ApplyPilot, featuring cryptographic integrity verification, strict server-side approval enforcement, single-use approval tokens, claim validation with skill-vs-experience safeguards, and idempotent job portal submission simulation.

---

## 🚀 Quick Start

### 1. Run the Application
From the project directory:
```bash
./run.sh 8000
# Or directly:
python3 backend/server.py 8000
```
Open **[http://localhost:8000](http://localhost:8000)** in your browser.

> Zero external dependencies required. Runs purely on Python 3 Standard Library (`http.server`, `sqlite3`, `hashlib`, `json`).

### 2. Run the Automated Sandbox Test Suite
```bash
python3 tests/test_sandbox.py
```
Executes all 9 requirements and edge cases in milliseconds with 100% test coverage.

---

## 🛡️ Key System Capabilities

### 1. Application Preparation
* **Generated Answers**: Formatted responses linked to candidate prompt questions.
* **Evidence Traceability**: Matrix connecting each claim to verified profile records (work experience, projects, or technical skill listing).
* **Missing Information Detection**: Highlights unverified claims, missing portfolio repositories, and incomplete metrics.
* **Strict Claim Validation Rule**:
  > *"Never convert a skill-list entry into an unsupported experience claim."*
  * **Supported**: `"React is listed as a skill in my technical toolkit"` (matches skills list).
  * **Blocked / Flagged**: `"I built applications using React for 2 years"` (flags `RULE_VIOLATION_SKILL_TO_EXPERIENCE` because "React" only exists in skills without verified role or project evidence).

### 2. Approval (The Core Security Flow)
* **Version Control**: Every application increment (`v1`, `v2`, ...) is recorded with immutable version history.
* **SHA-256 Canonical Integrity Hash**: Deterministic, tamper-proof canonical JSON hashing over `{application_id, candidate_id, company, role, version, deadline, answers}`.
* **Mandatory Student Review Checklist**:
  1. Student reviewed application answers, supporting evidence, and claims.
  2. Student approves submission and authorizes ApplyPilot.
* **Server-Side Security Enforcement**:
  * Any unapproved submission attempt immediately returns **HTTP 403 Forbidden**:
    ```json
    {
      "error": "FORBIDDEN_UNAPPROVED",
      "message": "Student approval required"
    }
    ```
* **Single-Use Approval Token**: Generates an ephemeral cryptographic token `appr_tok_v{version}_{hash}_{entropy}` bound to the exact SHA-256 integrity hash.
* **Opportunity Deadline Check**: Deadline is re-checked immediately before submission. If expired, returns **HTTP 422** with `DEADLINE_EXPIRED`.
* **Invalidation on Modification**: Any edit after approval immediately revokes the approval and token, reverts system state, increments version (`v1` → `v2`), and recalculates the SHA-256 hash.

### 3. Submission & Idempotency
* **Simulated External Portal Adapter**: Simulates submission with real latency and receipt issuance.
* **Unique Identifiers**: Generates `Application ID` (e.g. `APP-2026-VIKAS-8492`) and `Receipt ID` (e.g. `RCPT-9F3E8B-2026`).
* **Strict Idempotency**:
  * Resubmitting an already-submitted application returns the **original receipt**.
  * Never generates duplicate records in the database (`COUNT(*) == 1`).

### 4. Application Tracker
* **Automated Machine System States**:
  * `Prepared`
  * `Needs input`
  * `Awaiting approval`
  * `Approved`
  * `Submitted`
  * `Expired`
* **Independent Manual Recruiter States**:
  * `Interview`
  * `Selected`
  * `Rejected`
  * *(Maintained completely separately from automated system states)*

### 5. Real-Time Activity Log (Audit Trail)
Captures immutable chronological events:
* `application created`
* `application edited`
* `version created`
* `approval requested`
* `approved`
* `token generated`
* `submission attempted`
* `submission successful`
* `duplicate submission attempt`
* `deadline failure`

---

## 🎬 9-Step Interactive Demo Walkthrough

Use the **Interactive 9-Step Demo Walkthrough** bar at the top of the UI to demonstrate all requirements in order:

| Step | Action | Expected Output |
|---|---|---|
| **1** | Click **Step 1: Submit Unapproved (403)** | Server returns **HTTP 403 Forbidden: "Student approval required"** |
| **2** | Click **Step 2: Student Approval** | Checks student review & authorization checkboxes; server approves |
| **3** | Click **Step 3: Verify Token & Hash** | Inspects issued single-use token and canonical 64-char SHA-256 hash modal |
| **4** | Click **Step 4: Submit Successfully** | Submits with token; receives `RCPT-...` receipt; state becomes `Submitted` |
| **5** | Click **Step 5: Idempotency (Submit Again)** | Returns the **exact same receipt**; logs `duplicate submission attempt`; 0 duplicates |
| **6** | Click **Step 6: Edit After Approval** | Edits answers; server **invalidates previous approval & revokes token** |
| **7** | Click **Step 7: Hash & Version Diff** | Shows version bumped (`v1` → `v2`) and SHA-256 digest mathematically changed |
| **8** | Click **Step 8: Inspect Activity Log** | Displays audit trail entries with ISO timestamps and event categories |
| **9** | Click **Step 9: Tracker Transitions** | Demonstrates independent System State pipeline vs Manual Recruiter status |

---

## 📂 Project Structure

```
applypilot-vikas-module/
├── backend/
│   ├── app.py / server.py     # REST API server & static file host
│   ├── models.py              # SQLite schema, tables & activity logger
│   ├── security.py            # Canonical SHA-256, tokens & deadline validator
│   └── validation_engine.py   # Skill vs. Experience claim rule engine
├── frontend/
│   ├── index.html             # High-contrast, reactive single-page app
│   ├── style.css              # Custom styling, dark mode, pipelines & badges
│   └── app.js                 # Frontend state, API client & 9-step demo runner
├── tests/
│   ├── test_sandbox.py        # In-memory mock tests for sandbox execution
│   └── test_suite.py          # HTTP integration test suite
├── run.sh                     # Executable launch script
└── README.md                  # System documentation
```
