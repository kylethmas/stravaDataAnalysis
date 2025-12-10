from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import Cookie, FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse

from cache import CACHE, init_session, update_last_fetched
from schemas import (
    ActivityHighlight,
    FactsResponse,
    HighlightsResponse,
    SummaryResponse,
    TrendsResponse,
    WrappedResponse,
)
from strava_client import (
    StravaError,
    build_auth_url,
    ensure_fresh_token,
    exchange_code_for_token,
    fetch_activities,
)
from utils import (
    build_activity_highlight,
    compute_facts,
    compute_highlights,
    compute_summary,
    compute_trends,
    compute_wrapped,
)


app = FastAPI(title="Strava Year in Review")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SESSION_COOKIE_NAME = "codex_session"


@app.get("/api/session")
def get_or_create_session(response: Response, codex_session: Optional[str] = Cookie(default=None)):
    if codex_session and codex_session in CACHE:
        return {"session_id": codex_session}

    session_id = str(uuid.uuid4())
    init_session(session_id)
    response.set_cookie(SESSION_COOKIE_NAME, session_id, httponly=True, samesite="lax")
    return {"session_id": session_id}


def get_session_id(request: Request) -> str:
    session_id = request.cookies.get(SESSION_COOKIE_NAME)
    if not session_id or session_id not in CACHE:
        raise HTTPException(status_code=401, detail="Session not found")
    return session_id


def _get_session_tokens(request: Request) -> Dict[str, Any]:
    session_id = get_session_id(request)
    tokens = CACHE[session_id].get("tokens")
    if not tokens:
        raise HTTPException(status_code=401, detail="Not connected to Strava")
    fresh_tokens = ensure_fresh_token(tokens)
    CACHE[session_id]["tokens"] = fresh_tokens
    return fresh_tokens


@app.get("/api/auth/strava/url")
def auth_url():
    try:
        url = build_auth_url()
    except StravaError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    return {"url": url}


@app.get("/auth/strava/callback")
def auth_callback(request: Request, code: str):
    session_id = get_session_id(request)
    try:
        token_resp = exchange_code_for_token(code)
    except StravaError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    tokens = {
        "access_token": token_resp.get("access_token"),
        "refresh_token": token_resp.get("refresh_token"),
        "expires_at": token_resp.get("expires_at"),
    }
    CACHE[session_id]["tokens"] = tokens

    start_of_year = datetime.utcnow().replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
    after_ts = int(start_of_year.timestamp())
    try:
        activities = fetch_activities(tokens.get("access_token"), after_ts)
    except StravaError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    simplified = [
        {
            "id": a.get("id"),
            "name": a.get("name"),
            "type": a.get("type"),
            "start_date_local": a.get("start_date_local") or a.get("start_date"),
            "start_date": a.get("start_date"),
            "distance": a.get("distance"),
            "moving_time": a.get("moving_time"),
            "total_elevation_gain": a.get("total_elevation_gain"),
            "average_speed": a.get("average_speed"),
            "kudos_count": a.get("kudos_count"),
            "start_latlng": a.get("start_latlng"),
            "athlete_count": a.get("athlete_count"),
        }
        for a in activities
    ]

    CACHE[session_id]["activities"] = simplified
    update_last_fetched(session_id)

    frontend_url = "http://localhost:5173/"
    return RedirectResponse(url=frontend_url)


def _get_activities_for_session(request: Request) -> List[Dict[str, Any]]:
    session_id = get_session_id(request)
    _get_session_tokens(request)
    activities = CACHE[session_id].get("activities", [])
    if activities is None:
        activities = []
    return activities


@app.get("/api/summary", response_model=SummaryResponse)
def summary(request: Request, activity_type: str = "All"):
    activities = _get_activities_for_session(request)
    result = compute_summary(activities, activity_type=activity_type)
    CACHE[get_session_id(request)]["summary"] = result.dict()
    return result


@app.get("/api/trends", response_model=TrendsResponse)
def trends(request: Request, activity_type: str = "All"):
    activities = _get_activities_for_session(request)
    result = compute_trends(activities, activity_type=activity_type)
    CACHE[get_session_id(request)]["trends"] = result.dict()
    return result


@app.get("/api/highlights", response_model=HighlightsResponse)
def highlights(request: Request, activity_type: str = "All"):
    activities = _get_activities_for_session(request)
    result = compute_highlights(activities, activity_type=activity_type)
    CACHE[get_session_id(request)]["highlights"] = result.dict()
    return result


@app.get("/api/facts", response_model=FactsResponse)
def facts(request: Request, activity_type: str = "All"):
    activities = _get_activities_for_session(request)
    summary_res = compute_summary(activities, activity_type=activity_type)
    result = compute_facts(summary_res)
    CACHE[get_session_id(request)]["facts"] = result.dict()
    return result


@app.get("/api/wrapped", response_model=WrappedResponse)
def wrapped(request: Request, activity_type: str = "All"):
    session_id = get_session_id(request)
    tokens = _get_session_tokens(request)
    activities = CACHE[session_id].get("activities", []) or []
    result = compute_wrapped(activities, activity_type=activity_type, tokens=tokens)
    CACHE[session_id]["wrapped"] = result.dict()
    return result


@app.get("/api/day/{date}", response_model=List[ActivityHighlight])
def activities_for_day(request: Request, date: str, activity_type: str = "All"):
    activities = _get_activities_for_session(request)
    day_activities: List[Dict[str, Any]] = []
    for a in activities:
        date_str = a.get("start_date_local") or a.get("start_date")
        if not date_str:
            continue
        if date_str.split("T")[0] == date:
            day_activities.append(a)
    if activity_type != "All":
        day_activities = [a for a in day_activities if a.get("type") == activity_type]
    return [build_activity_highlight(a) for a in day_activities]


@app.get("/api/period", response_model=List[ActivityHighlight])
def activities_for_period(request: Request, start: str, end: str, activity_type: str = "All"):
    activities = _get_activities_for_session(request)
    try:
        start_date = datetime.fromisoformat(start).date()
        end_date = datetime.fromisoformat(end).date()
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid date format") from exc

    period_activities: List[Dict[str, Any]] = []
    for a in activities:
        date_str = a.get("start_date_local") or a.get("start_date")
        if not date_str:
            continue
        activity_date = datetime.fromisoformat(date_str.replace("Z", "+00:00")).date()
        if start_date <= activity_date <= end_date:
            period_activities.append(a)

    if activity_type != "All":
        period_activities = [a for a in period_activities if a.get("type") == activity_type]
    return [build_activity_highlight(a) for a in period_activities]


@app.exception_handler(StravaError)
async def strava_exception_handler(_: Request, exc: StravaError):
    return JSONResponse(status_code=400, content={"detail": str(exc)})
