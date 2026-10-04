# ApplyPilot frontend

ApplyPilot is a React single-page app built with Vite, React Router, Tailwind
CSS, Framer Motion, Lucide icons, and Zustand. This branch (`vaibhav-frontend`)
adds the frontend foundation and dashboard to the ApplyPilot repository.

## What is included

- Shared application shell with sidebar navigation, light/dark theme, and routes
  for Dashboard, Applications, Match Feed, Auto-Apply Queue, and Analytics.
- The Dashboard page, with pipeline summaries, sample applications, activity,
  and pilot controls.
- A shared API/data-access module (`src/api/applypilot.js`) and a small global
  store (`src/store/useStore.js`).
- Applications, Match Feed, Auto-Apply Queue, and Analytics routes currently
  render placeholders for teammates to implement.

## Get the branch

To clone the repository directly on this branch:

```sh
git clone --branch vaibhav-frontend https://github.com/lalith-h-15/applypilot.git
cd applypilot
```

If you already have the repository cloned, fetch the branch and switch to it:

```sh
git fetch origin
git switch --track origin/vaibhav-frontend
```

If you already have a local `vaibhav-frontend` branch, use `git switch
vaibhav-frontend` instead. To update it later, run `git pull --ff-only`.
Coordinate with the team before pushing commits to this shared branch; use a
pull request or merge it into the team's target branch when it is ready.

## Run locally

Use a current Node.js release with npm. From the repository root:

```sh
cd frontend
npm ci
npm run dev
```

Vite opens the app at <http://localhost:5173>. The dev server is configured to
open a browser automatically. Other useful commands, run from `frontend/`:

```sh
npm run lint       # Check the frontend with Oxlint
npm run build      # Create the production bundle in dist/
npm run preview    # Preview the production bundle locally
```

## Data and backend status

The dashboard currently uses sample/mock data, so no backend or environment
file is needed to run the UI. The API module has a `VITE_API_URL` default of
`http://localhost:8000`, but mock mode is enabled in
`src/api/applypilot.js`; setting that variable alone does **not** send requests
to a backend. The module includes API calls for dashboard data, applications,
and toggling the pilot. Backend integration will require implementing those
endpoints and disabling mock mode. The other page files mention planned
endpoints, but those pages are placeholders and are not wired to API calls yet.

## Project layout

```text
src/
  api/applypilot.js         Mock data and API access functions
  layouts/ApplyPilotLayout.jsx  Shared navigation and page layout
  pages/                    Dashboard and routed teammate placeholders
  store/useStore.js         Theme and user-session state
  App.jsx                   Application routes
  main.jsx                  Frontend entry point
```
When backend is ready
Open src/api/applypilot.js and change one line:
const useMock = false; // ← flip this
