from typing import List, Optional
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


class TrendPoint(BaseModel):
    label: str
    distance_km: float
    moving_time_hours: float
    elevation_m: float
    activities_count: int


class DailyPoint(BaseModel):
    date: str
    distance_km: float
    moving_time_minutes: float
    activities_count: int


class TrendsResponse(BaseModel):
    weekly: List[TrendPoint]
    monthly: List[TrendPoint]
    daily: List[DailyPoint]


class ActivityHighlight(BaseModel):
    id: int
    name: str
    date: str
    distance_km: float
    elevation_m: float
    moving_time_minutes: float
    type: str


class HighlightsResponse(BaseModel):
    longest_activities: List[ActivityHighlight]
    biggest_climbs: List[ActivityHighlight]
    fastest_runs: List[ActivityHighlight]
    fastest_rides: List[ActivityHighlight]


class FactsResponse(BaseModel):
    facts: List[str]
