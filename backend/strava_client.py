import os
from datetime import datetime
from typing import Any, Dict, List, Optional

import requests

STRAVA_AUTH_URL = "https://www.strava.com/oauth/authorize"
STRAVA_TOKEN_URL = "https://www.strava.com/oauth/token"
STRAVA_ACTIVITIES_URL = "https://www.strava.com/api/v3/athlete/activities"


class StravaError(Exception):
    pass


def get_env_config() -> Dict[str, str]:
    client_id = os.getenv("STRAVA_CLIENT_ID")
    client_secret = os.getenv("STRAVA_CLIENT_SECRET")
    redirect_uri = os.getenv("STRAVA_REDIRECT_URI")
    if not client_id or not client_secret or not redirect_uri:
        raise StravaError("Missing Strava environment variables.")
    return {
        "client_id": client_id,
        "client_secret": client_secret,
        "redirect_uri": redirect_uri,
    }


def build_auth_url() -> str:
    config = get_env_config()
    params = {
        "client_id": config["client_id"],
        "redirect_uri": config["redirect_uri"],
        "response_type": "code",
        "scope": "activity:read_all",
    }
    query = "&".join([f"{k}={v}" for k, v in params.items()])
    return f"{STRAVA_AUTH_URL}?{query}"


def exchange_code_for_token(code: str) -> Dict[str, Any]:
    config = get_env_config()
    payload = {
        "client_id": config["client_id"],
        "client_secret": config["client_secret"],
        "code": code,
        "grant_type": "authorization_code",
    }
    resp = requests.post(STRAVA_TOKEN_URL, data=payload, timeout=20)
    if resp.status_code != 200:
        raise StravaError(f"Failed to exchange code: {resp.text}")
    return resp.json()


def refresh_access_token(refresh_token: str) -> Dict[str, Any]:
    config = get_env_config()
    payload = {
        "client_id": config["client_id"],
        "client_secret": config["client_secret"],
        "grant_type": "refresh_token",
        "refresh_token": refresh_token,
    }
    resp = requests.post(STRAVA_TOKEN_URL, data=payload, timeout=20)
    if resp.status_code != 200:
        raise StravaError(f"Failed to refresh token: {resp.text}")
    return resp.json()


def fetch_activities(access_token: str, after_ts: int) -> List[Dict[str, Any]]:
    activities: List[Dict[str, Any]] = []
    page = 1
    while True:
        params = {"after": after_ts, "per_page": 100, "page": page}
        headers = {"Authorization": f"Bearer {access_token}"}
        resp = requests.get(STRAVA_ACTIVITIES_URL, headers=headers, params=params, timeout=30)
        if resp.status_code == 401:
            raise StravaError("Unauthorized when fetching activities.")
        if resp.status_code != 200:
            raise StravaError(f"Error fetching activities: {resp.text}")
        data = resp.json()
        if not data:
            break
        activities.extend(data)
        page += 1
    return activities


def ensure_fresh_token(tokens: Dict[str, Any]) -> Dict[str, Any]:
    expires_at: Optional[int] = tokens.get("expires_at") if tokens else None
    if expires_at and expires_at < int(datetime.utcnow().timestamp()):
        refreshed = refresh_access_token(tokens.get("refresh_token"))
        return {
            "access_token": refreshed.get("access_token"),
            "refresh_token": refreshed.get("refresh_token", tokens.get("refresh_token")),
            "expires_at": refreshed.get("expires_at"),
        }
    return tokens
