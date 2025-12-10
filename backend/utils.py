from collections import defaultdict
from datetime import datetime, timedelta
from typing import Any, Dict, List, Tuple

from schemas import (
    ActivityHighlight,
    FactsResponse,
    HighlightsResponse,
    SummaryResponse,
    TrendPoint,
    TrendsResponse,
    DailyPoint,
)


def _parse_activity_date(activity: Dict[str, Any]) -> datetime:
    date_str = activity.get("start_date_local") or activity.get("start_date")
    if not date_str:
        return datetime.utcnow()
    return datetime.fromisoformat(date_str.replace("Z", "+00:00"))


def _meters_to_km(meters: float) -> float:
    return round(meters / 1000, 2)


def _seconds_to_hours(seconds: float) -> float:
    return round(seconds / 3600, 2)


def _seconds_to_minutes(seconds: float) -> float:
    return round(seconds / 60, 2)


def _filter_by_type(activities: List[Dict[str, Any]], activity_type: str) -> List[Dict[str, Any]]:
    if not activity_type or activity_type == "All":
        return activities
    return [a for a in activities if a.get("type") == activity_type]


def build_activity_highlight(activity: Dict[str, Any]) -> ActivityHighlight:
    avg_speed_ms = activity.get("average_speed")
    avg_speed_kmh = round(avg_speed_ms * 3.6, 2) if avg_speed_ms else None
    pace_min_per_km = None
    if avg_speed_ms and avg_speed_ms > 0:
        pace_min_per_km = round((1000 / avg_speed_ms) / 60, 2)

    return ActivityHighlight(
        id=activity.get("id", 0),
        name=activity.get("name", "Activity"),
        date=_parse_activity_date(activity).date().isoformat(),
        distance_km=_meters_to_km(activity.get("distance", 0)),
        elevation_m=round(activity.get("total_elevation_gain", 0), 2),
        moving_time_minutes=_seconds_to_minutes(activity.get("moving_time", 0)),
        type=activity.get("type", "Ride"),
        strava_url=f"https://www.strava.com/activities/{activity.get('id')}",
        average_speed_kmh=avg_speed_kmh,
        pace_min_per_km=pace_min_per_km,
    )


def compute_summary(activities: List[Dict[str, Any]], activity_type: str = "All") -> SummaryResponse:
    filtered = _filter_by_type(activities, activity_type)

    if not filtered:
        return SummaryResponse(
            total_distance_km=0.0,
            total_elevation_m=0.0,
            total_time_hours=0.0,
            activities_count=0,
            active_days=0,
            active_days_percent=0.0,
            best_month=None,
            best_month_distance_km=None,
            longest_streak_days=0,
            most_epic_day_date=None,
            most_epic_day_distance_km=None,
            activity_type=activity_type,
        )

    total_distance = sum(a.get("distance", 0) for a in filtered)
    total_elevation = sum(a.get("total_elevation_gain", 0) for a in filtered)
    total_time = sum(a.get("moving_time", 0) for a in filtered)

    dates = [_parse_activity_date(a).date() for a in filtered]
    unique_days = set(dates)

    today = datetime.utcnow().date()
    start_year = datetime.utcnow().replace(month=1, day=1).date()
    days_elapsed = (today - start_year).days + 1

    monthly_distance: Dict[str, float] = defaultdict(float)
    day_distance: Dict[datetime.date, float] = defaultdict(float)
    for a, d in zip(filtered, dates):
        label = d.strftime("%Y-%m")
        monthly_distance[label] += a.get("distance", 0)
        day_distance[d] += a.get("distance", 0)

    best_month_label, best_month_distance = _max_item(monthly_distance)

    longest_streak = _longest_streak(sorted(unique_days))

    most_epic_date, most_epic_distance = _max_item({d: dist for d, dist in day_distance.items()})

    return SummaryResponse(
        total_distance_km=_meters_to_km(total_distance),
        total_elevation_m=round(total_elevation, 2),
        total_time_hours=_seconds_to_hours(total_time),
        activities_count=len(activities),
        active_days=len(unique_days),
        active_days_percent=round((len(unique_days) / days_elapsed) * 100, 2),
        best_month=best_month_label,
        best_month_distance_km=_meters_to_km(best_month_distance) if best_month_distance else None,
        longest_streak_days=longest_streak,
        most_epic_day_date=most_epic_date.isoformat() if most_epic_date else None,
        most_epic_day_distance_km=_meters_to_km(most_epic_distance) if most_epic_distance else None,
        activity_type=activity_type,
    )


def _max_item(data: Dict[Any, float]) -> Tuple[Any, float]:
    if not data:
        return None, 0.0
    key = max(data, key=data.get)
    return key, data[key]


def _longest_streak(days: List[datetime.date]) -> int:
    if not days:
        return 0
    longest = 1
    current = 1
    for i in range(1, len(days)):
        if days[i] == days[i - 1] + timedelta(days=1):
            current += 1
        else:
            longest = max(longest, current)
            current = 1
    longest = max(longest, current)
    return longest


def compute_trends(activities: List[Dict[str, Any]], activity_type: str = "All") -> TrendsResponse:
    filtered = _filter_by_type(activities, activity_type)

    weekly: Dict[str, Dict[str, Any]] = defaultdict(lambda: defaultdict(float))
    monthly: Dict[str, Dict[str, Any]] = defaultdict(lambda: defaultdict(float))
    daily: Dict[str, Dict[str, Any]] = defaultdict(lambda: defaultdict(float))
    weekday_totals: Dict[int, Dict[str, float]] = defaultdict(lambda: {"count": 0, "distance": 0.0})

    for a in filtered:
        date = _parse_activity_date(a)
        distance = a.get("distance", 0)
        moving_time = a.get("moving_time", 0)
        elevation = a.get("total_elevation_gain", 0)
        activity_id = a.get("id")

        iso = date.isocalendar()
        iso_year, iso_week = (iso[0], iso[1]) if isinstance(iso, tuple) else (iso.year, iso.week)
        week_label = f"{iso_year}-W{iso_week:02d}"
        month_label = date.strftime("%Y-%m")
        day_label = date.strftime("%Y-%m-%d")

        for group, label in ((weekly, week_label), (monthly, month_label), (daily, day_label)):
            group[label]["distance"] += distance
            group[label]["moving_time"] += moving_time
            group[label]["elevation"] += elevation
            group[label]["count"] += 1
            if activity_id is not None:
                group[label].setdefault("activity_ids", []).append(activity_id)

        weekday_totals[date.weekday()]["count"] += 1
        weekday_totals[date.weekday()]["distance"] += distance

    weekly_points = [
        TrendPoint(
            label=k,
            distance_km=_meters_to_km(v.get("distance", 0)),
            moving_time_hours=_seconds_to_hours(v.get("moving_time", 0)),
            elevation_m=round(v.get("elevation", 0), 2),
            activities_count=int(v.get("count", 0)),
            activity_ids=[int(i) for i in v.get("activity_ids", [])],
        )
        for k, v in sorted(weekly.items())
    ]
    monthly_points = [
        TrendPoint(
            label=k,
            distance_km=_meters_to_km(v.get("distance", 0)),
            moving_time_hours=_seconds_to_hours(v.get("moving_time", 0)),
            elevation_m=round(v.get("elevation", 0), 2),
            activities_count=int(v.get("count", 0)),
            activity_ids=[int(i) for i in v.get("activity_ids", [])],
        )
        for k, v in sorted(monthly.items())
    ]
    daily_points = [
        DailyPoint(
            date=k,
            distance_km=_meters_to_km(v.get("distance", 0)),
            moving_time_minutes=_seconds_to_minutes(v.get("moving_time", 0)),
            activities_count=int(v.get("count", 0)),
            activity_ids=[int(i) for i in v.get("activity_ids", [])],
        )
        for k, v in sorted(daily.items())
    ]

    weekday_names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    weekday_stats = [
        {
            "weekday": weekday_names[idx],
            "count": int(vals.get("count", 0)),
            "distance_km": _meters_to_km(vals.get("distance", 0)),
        }
        for idx, vals in weekday_totals.items()
    ]
    most_active_weekday = None
    if weekday_stats:
        most_active_weekday = max(weekday_stats, key=lambda w: (w["distance_km"], w["count"]))["weekday"]

    return TrendsResponse(
        weekly=weekly_points,
        monthly=monthly_points,
        daily=daily_points,
        weekday_stats=weekday_stats,
        most_active_weekday=most_active_weekday,
        activity_type=activity_type,
    )


def compute_highlights(activities: List[Dict[str, Any]], top_n: int = 5, activity_type: str = "All") -> HighlightsResponse:
    filtered = _filter_by_type(activities, activity_type) if activity_type != "All" else activities

    longest = sorted(filtered, key=lambda a: a.get("distance", 0), reverse=True)[:top_n]
    climbs = sorted(filtered, key=lambda a: a.get("total_elevation_gain", 0), reverse=True)[:top_n]

    runs = [a for a in filtered if a.get("type") == "Run" and a.get("distance", 0) > 3000]
    runs_sorted = sorted(
        runs,
        key=lambda a: a.get("moving_time", 1) / max(a.get("distance", 1), 1),
    )[:top_n]

    rides = [a for a in filtered if a.get("type") == "Ride" and a.get("distance", 0) > 5000]
    rides_sorted = sorted(
        rides,
        key=lambda a: (a.get("distance", 1) / 1000) / max(a.get("moving_time", 1) / 3600, 0.1),
        reverse=True,
    )[:top_n]

    return HighlightsResponse(
        longest_activities=[build_activity_highlight(a) for a in longest],
        biggest_climbs=[build_activity_highlight(a) for a in climbs],
        fastest_runs=[build_activity_highlight(a) for a in runs_sorted],
        fastest_rides=[build_activity_highlight(a) for a in rides_sorted],
        activity_type=activity_type,
    )


def compute_facts(summary: SummaryResponse) -> FactsResponse:
    if summary.activities_count == 0:
        return FactsResponse(facts=[])

    facts = []
    facts.append(
        f"You travelled {summary.total_distance_km} km, roughly the distance from Paris to Berlin (878 km) {round(summary.total_distance_km/878, 1)} times."
    )
    facts.append(
        f"That's {round((summary.total_distance_km/40075)*100, 2)}% of Earth's circumference (≈40,075 km)."
    )
    facts.append(
        f"You climbed {summary.total_elevation_m} m, which is {round(summary.total_elevation_m/8848, 2)}× Mount Everest."
    )
    facts.append(
        f"Or {round(summary.total_elevation_m/1345, 2)}× Ben Nevis!"
    )
    facts.append(
        f"You spent {summary.total_time_hours} hours moving — that's {round(summary.total_time_hours/8, 1)} full workdays."
    )
    facts.append(
        f"Active on {summary.active_days_percent}% of days this year."
    )
    return FactsResponse(facts=facts)
