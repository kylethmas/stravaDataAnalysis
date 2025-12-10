from typing import Any, Dict, List, Optional
from pydantic import BaseModel


class SummaryResponse(BaseModel):
    total_distance_km: float
    total_elevation_m: float
    total_time_hours: float
    activities_count: int
    active_days: int
    active_days_percent: float
    best_month: Optional[str]
    best_month_distance_km: Optional[float]
    longest_streak_days: int
    most_epic_day_date: Optional[str]
    most_epic_day_distance_km: Optional[float]
    activity_type: str = "All"


class TrendPoint(BaseModel):
    label: str
    distance_km: float
    moving_time_hours: float
    elevation_m: float
    activities_count: int
    activity_ids: List[int]


class DailyPoint(BaseModel):
    date: str
    distance_km: float
    moving_time_minutes: float
    activities_count: int
    activity_ids: List[int]


class TrendsResponse(BaseModel):
    weekly: List[TrendPoint]
    monthly: List[TrendPoint]
    daily: List[DailyPoint]
    weekday_stats: List[Dict[str, Any]]
    most_active_weekday: Optional[str]
    activity_type: str = "All"


class ActivityHighlight(BaseModel):
    id: int
    name: str
    date: str
    distance_km: float
    elevation_m: float
    moving_time_minutes: float
    type: str
    strava_url: str
    average_speed_kmh: Optional[float] = None
    pace_min_per_km: Optional[float] = None


class HighlightsResponse(BaseModel):
    longest_activities: List[ActivityHighlight]
    biggest_climbs: List[ActivityHighlight]
    fastest_runs: List[ActivityHighlight]
    fastest_rides: List[ActivityHighlight]
    activity_type: str = "All"


class FactsResponse(BaseModel):
    facts: List[str]
