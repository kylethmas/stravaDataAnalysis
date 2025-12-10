# Strava Year in Review

A web app that connects to Strava, pulls your past year's activities, and turns them into an interactive yearbook of stats, trends, personal records, and fun facts. The project is split into a FastAPI backend and a React/Vite frontend.

## Features
- OAuth link to Strava that exchanges the authorization code for access/refresh tokens and caches activities in-memory per session.
- Summary statistics (distance, elevation, time, active days, streaks, epic days) computed from the retrieved activities.
- Trend visualizations across weekly, monthly, and daily buckets.
- Highlights such as longest efforts, biggest climbs, and fastest runs/rides.
- Lighthearted factoids generated from your totals.

## Architecture
- **Backend (FastAPI)**
  - `backend/main.py` exposes REST endpoints for session management, Strava OAuth, and computed views (`/api/summary`, `/api/trends`, `/api/highlights`, `/api/facts`).【F:backend/main.py†L1-L93】【F:backend/main.py†L95-L155】
  - `backend/strava_client.py` handles OAuth URL construction, token exchange/refresh, and paginated activity retrieval from Strava's API.【F:backend/strava_client.py†L1-L78】【F:backend/strava_client.py†L80-L109】
  - `backend/utils.py` aggregates raw activities into summaries, trend series, highlights, and fun facts returned to the frontend.【F:backend/utils.py†L1-L173】【F:backend/utils.py†L175-L236】
  - Simple in-memory cache (`backend/cache.py`) stores session-scoped tokens, activities, and derived data.【F:backend/cache.py†L1-L19】
- **Frontend (React + Vite + TypeScript)**
  - `frontend/src/context/StravaDataContext.tsx` fetches backend endpoints with cookies, caches responses in React context, and exposes loading/error states.【F:frontend/src/context/StravaDataContext.tsx†L1-L63】【F:frontend/src/context/StravaDataContext.tsx†L65-L89】
  - Pages such as `LandingPage`, `DashboardPage`, `CalendarPage`, `TrendsPage`, and `HighlightsPage` consume the context for UI rendering.【F:frontend/src/App.tsx†L1-L22】
  - Vite configuration lives in `frontend/vite.config.ts`; entrypoints are `frontend/src/main.tsx` and `frontend/src/App.tsx`.
- **Data flow**
  1. User opens the landing page; the app creates a session cookie via `/api/session` and requests the Strava auth URL.
  2. After Strava OAuth callback (`/auth/strava/callback`), the backend exchanges the code for tokens and fetches the last year's activities into the cache.【F:backend/main.py†L42-L82】
  3. Frontend calls summary/trends/highlights/facts endpoints, which compute and return derived stats for display.

## Environment variables
Set the following variables for the backend (FastAPI) process:

| Variable | Description |
| --- | --- |
| `STRAVA_CLIENT_ID` | Your Strava application client ID. |
| `STRAVA_CLIENT_SECRET` | Your Strava application client secret. |
| `STRAVA_REDIRECT_URI` | Redirect URL registered with Strava (e.g., `http://localhost:8000/auth/strava/callback`). |

## Prerequisites
- Python 3.11+
- Node.js 18+
- npm or pnpm

## Backend setup
1. Create and activate a virtual environment.
   ```bash
   cd backend
   python -m venv .venv
   source .venv/bin/activate
   ```
2. Install dependencies.
   ```bash
   pip install -r requirements.txt
   ```
3. Set the environment variables above (consider a `.env` file exported before running).
4. Start the API server.
   ```bash
   uvicorn main:app --reload --port 8000
   ```

## Frontend setup
1. Install dependencies.
   ```bash
   cd frontend
   npm install
   ```
2. Run the development server (defaults to http://localhost:5173).
   ```bash
   npm run dev
   ```

## Running the full stack locally
1. Start the backend (`uvicorn` on port 8000) with Strava env vars set.
2. Start the frontend (`npm run dev`), which expects the backend at `http://localhost:8000` and uses cookies for session continuity.
3. Open the frontend in your browser, click **Connect with Strava**, complete OAuth, and explore the dashboard. The redirect URI used in your Strava app must match `STRAVA_REDIRECT_URI`.

## Notes
- Activities are cached in-memory per session; restarting the backend clears the cache and requires re-authentication.
- Backend CORS is configured for the frontend dev origin (`http://localhost:5173`).【F:backend/main.py†L19-L29】
