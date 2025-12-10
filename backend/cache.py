from datetime import datetime
from typing import Any, Dict

CACHE: Dict[str, Dict[str, Any]] = {}


def init_session(session_id: str) -> None:
    if session_id not in CACHE:
        CACHE[session_id] = {
            "tokens": None,
            "activities": [],
            "last_fetched": None,
            "summary": None,
            "trends": None,
            "highlights": None,
            "facts": None,
        }


def update_last_fetched(session_id: str) -> None:
    if session_id in CACHE:
        CACHE[session_id]["last_fetched"] = datetime.utcnow()
