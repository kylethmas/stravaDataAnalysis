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
    return datetime.fromisoformat(activity.get("start_date").replace("Z", "+00:00"))


def _meters_to_km(meters: float) -> float:
    return round(meters / 1000, 2)


def _seconds_to_hours(seconds: float) -> float:
    return round(seconds / 3600, 2)


def _seconds_to_minutes(seconds: float) -> float:
    return round(seconds / 60, 2)


def compute_summary(activities: List[Dict[str, Any]]) -> SummaryResponse:
    if not activities:
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
        )

    total_distance = sum(a.get("distance", 0) for a in activities)
    total_elevation = sum(a.get("total_elevation_gain", 0) for a in activities)
    total_time = sum(a.get("moving_time", 0) for a in activities)

    dates = [_parse_activity_date(a).date() for a in activities]
    unique_days = set(dates)

    today = datetime.utcnow().date()
    start_year = datetime.utcnow().replace(month=1, day=1).date()
    days_elapsed = (today - start_year).days + 1

    monthly_distance: Dict[str, float] = defaultdict(float)
    day_distance: Dict[datetime.date, float] = defaultdict(float)
    for a, d in zip(activities, dates):
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


def compute_trends(activities: List[Dict[str, Any]]) -> TrendsResponse:
    weekly: Dict[str, Dict[str, float]] = defaultdict(lambda: defaultdict(float))
    monthly: Dict[str, Dict[str, float]] = defaultdict(lambda: defaultdict(float))
    daily: Dict[str, Dict[str, float]] = defaultdict(lambda: defaultdict(float))

    for a in activities:
        date = _parse_activity_date(a)
        distance = a.get("distance", 0)
        moving_time = a.get("moving_time", 0)
        elevation = a.get("total_elevation_gain", 0)

        week_label = f"{date.isocalendar().year}-W{date.isocalendar().week:02d}"
        month_label = date.strftime("%Y-%m")
        day_label = date.strftime("%Y-%m-%d")

        for group, label in ((weekly, week_label), (monthly, month_label), (daily, day_label)):
            group[label]["distance"] += distance
            group[label]["moving_time"] += moving_time
            group[label]["elevation"] += elevation
            group[label]["count"] += 1

    weekly_points = [
        TrendPoint(
            label=k,
            distance_km=_meters_to_km(v.get("distance", 0)),
            moving_time_hours=_seconds_to_hours(v.get("moving_time", 0)),
            elevation_m=round(v.get("elevation", 0), 2),
            activities_count=int(v.get("count", 0)),
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
        )
        for k, v in sorted(monthly.items())
    ]
    daily_points = [
        DailyPoint(
            date=k,
            distance_km=_meters_to_km(v.get("distance", 0)),
            moving_time_minutes=_seconds_to_minutes(v.get("moving_time", 0)),
            activities_count=int(v.get("count", 0)),
        )
        for k, v in sorted(daily.items())
    ]

    return TrendsResponse(weekly=weekly_points, monthly=monthly_points, daily=daily_points)


def compute_highlights(activities: List[Dict[str, Any]], top_n: int = 5) -> HighlightsResponse:
    def map_highlight(a: Dict[str, Any]) -> ActivityHighlight:
        return ActivityHighlight(
            id=a.get("id", 0),
            name=a.get("name", "Activity"),
            date=_parse_activity_date(a).date().isoformat(),
            distance_km=_meters_to_km(a.get("distance", 0)),
            elevation_m=round(a.get("total_elevation_gain", 0), 2),
            moving_time_minutes=_seconds_to_minutes(a.get("moving_time", 0)),
            type=a.get("type", "Ride"),
        )

    longest = sorted(activities, key=lambda a: a.get("distance", 0), reverse=True)[:top_n]
    climbs = sorted(activities, key=lambda a: a.get("total_elevation_gain", 0), reverse=True)[:top_n]

    runs = [a for a in activities if a.get("type") == "Run" and a.get("distance", 0) > 3000]
    runs_sorted = sorted(
        runs,
        key=lambda a: a.get("moving_time", 1) / max(a.get("distance", 1), 1),
    )[:top_n]

    rides = [a for a in activities if a.get("type") == "Ride" and a.get("distance", 0) > 5000]
    rides_sorted = sorted(
        rides,
        key=lambda a: (a.get("distance", 1) / 1000) / max(a.get("moving_time", 1) / 3600, 0.1),
        reverse=True,
    )[:top_n]

    return HighlightsResponse(
        longest_activities=[map_highlight(a) for a in longest],
        biggest_climbs=[map_highlight(a) for a in climbs],
        fastest_runs=[map_highlight(a) for a in runs_sorted],
        fastest_rides=[map_highlight(a) for a in rides_sorted],
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
