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


class WrappedKeyStat(BaseModel):
    label: str
    value: float | int
    unit: str
    formatted: str


class WrappedActivity(BaseModel):
    id: int
    name: str
    date: str
    type: str
    distance_km: float
    elevation_m: float
    moving_time_minutes: float
    kudos_count: Optional[int] = None
    strava_url: str


class HeatmapPoint(BaseModel):
    lat: float
    lng: float
    count: int


class WrappedResponse(BaseModel):
    year: int
    key_stats: List[WrappedKeyStat]

    total_distance_km: float
    total_time_hours: float
    total_elevation_m: float
    activities_count: int
    active_days: int
    longest_streak_days: int
    most_active_month: Optional[str]
    most_active_weekday: Optional[str]

    biggest_day: Optional[WrappedActivity]
    longest_activity: Optional[WrappedActivity]
    biggest_climb: Optional[WrappedActivity]
    most_kudos_activity: Optional[WrappedActivity]

    top_kudos_givers: List[Dict[str, Any]]
    favourite_partners: List[Dict[str, Any]]

    cumulative_distance: List[Dict[str, Any]]
    monthly_distance: List[Dict[str, Any]]
    time_of_day_distribution: List[Dict[str, Any]]

    heatmap_points: List[HeatmapPoint]

    fun_lines: List[str]
