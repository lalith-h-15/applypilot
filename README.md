# ApplyPilot — Vikas Frontend Handoff

This branch contains the Vikas ApplyPilot demo module pushed in commit
`43582689d743b504892eea6e1ea868bc0facb103`. It is a small full-stack demo:
the Python server serves the browser UI, exposes the API, and stores demo data
in SQLite. The UI and API run together; there is no separate frontend server to
start.

## Get the `vikas-frontend` branch

For a fresh checkout:

```bash
git clone --branch vikas-frontend https://github.com/lalith-h-15/applypilot.git
cd applypilot
```

In an existing clone, fetch and switch to the branch:

```bash
git fetch origin
git switch --track origin/vikas-frontend
```

If you already have a local `vikas-frontend` branch, update it instead:

```bash
git switch vikas-frontend
git pull --ff-only origin vikas-frontend
```

## Run the demo

You need Python 3. No Node.js packages or external Python packages are needed
to run this module.

```bash
./run.sh
```

Then open [http://localhost:8000](http://localhost:8000). To use another port,
pass it to the script:

```bash
./run.sh 8080
```

The equivalent direct command is `python3 backend/server.py 8000`. Stop the
server with Ctrl+C. On first startup the server creates the SQLite database at
`data/applypilot.db` and seeds the demo application if the database is empty.
The database is local and ignored by Git. Use **Reset Demo** in the UI to
re-seed its demo records.

## What this branch adds

- A browser-based application review and tracker UI in `frontend/index.html`,
  `frontend/style.css`, and `frontend/app.js`.
- A Python standard-library HTTP server in `backend/server.py`, plus SQLite
  schema/storage in `backend/models.py`.
- Approval protections: answers are versioned and hashed with SHA-256;
  submission requires student approval, uses an approval token, checks the
  opportunity deadline, and returns the same receipt for duplicate submissions.
- Claim validation in `backend/validation_engine.py` so a listed skill alone
  does not support a claim of work experience; integrity and token helpers are
  in `backend/security.py`.
- An interactive nine-step demo, audit/activity log, and automated tests.

For the detailed feature walkthrough and demo steps, see
[`apply.md`](apply.md).

## Tests

Run the in-process test suite with:

```bash
python3 tests/test_sandbox.py
```

There is also an HTTP integration suite:

```bash
python3 tests/test_suite.py
```

Both suites re-seed the local demo database at `data/applypilot.db`; run them
only when it is safe to reset that demo data. The integration suite also uses
port `8099`, which must be available.

## Main files

```text
backend/server.py           HTTP API and static-file server
backend/models.py           SQLite schema, connections, and activity logging
backend/security.py         Integrity hashing, approval tokens, deadline checks
backend/validation_engine.py Claim and application-answer validation
frontend/index.html         Application UI
frontend/style.css          UI styling
frontend/app.js             UI behavior and API calls
tests/test_sandbox.py       In-process behavioral tests
tests/test_suite.py         HTTP integration tests
apply.md                    Detailed capability and demo walkthrough
run.sh                      Local development/demo launcher
```

No environment file or external database is configured for this demo. The
server listens on all interfaces; use it only on a trusted development
environment.
