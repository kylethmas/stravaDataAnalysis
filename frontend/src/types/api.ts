export interface SummaryResponse {
  total_distance_km: number
  total_elevation_m: number
  total_time_hours: number
  activities_count: number
  active_days: number
  active_days_percent: number
  best_month?: string | null
  best_month_distance_km?: number | null
  longest_streak_days: number
  most_epic_day_date?: string | null
  most_epic_day_distance_km?: number | null
  activity_type: string
}

export interface TrendPoint {
  label: string
  distance_km: number
  moving_time_hours: number
  elevation_m: number
  activities_count: number
  activity_ids: number[]
}

export interface DailyPoint {
  date: string
  distance_km: number
  moving_time_minutes: number
  activities_count: number
  activity_ids: number[]
}

export interface TrendsResponse {
  weekly: TrendPoint[]
  monthly: TrendPoint[]
  daily: DailyPoint[]
  weekday_stats: { weekday: string; count: number; distance_km: number }[]
  most_active_weekday?: string | null
  activity_type: string
}

export interface ActivityHighlight {
  id: number
  name: string
  date: string
  distance_km: number
  elevation_m: number
  moving_time_minutes: number
  type: string
  strava_url: string
  average_speed_kmh?: number | null
  pace_min_per_km?: number | null
}

export interface HighlightsResponse {
  longest_activities: ActivityHighlight[]
  biggest_climbs: ActivityHighlight[]
  fastest_runs: ActivityHighlight[]
  fastest_rides: ActivityHighlight[]
  activity_type: string
}

export interface FactsResponse {
  facts: string[]
}

export interface WrappedKeyStat {
  label: string
  value: number
  unit: string
  formatted: string
}

export interface WrappedActivity {
  id: number
  name: string
  date: string
  type: string
  distance_km: number
  elevation_m: number
  moving_time_minutes: number
  kudos_count?: number | null
  strava_url: string
}

export interface HeatmapPoint {
  lat: number
  lng: number
  count: number
}

export interface WrappedResponse {
  year: number
  key_stats: WrappedKeyStat[]
  total_distance_km: number
  total_time_hours: number
  total_elevation_m: number
  activities_count: number
  active_days: number
  longest_streak_days: number
  most_active_month?: string | null
  most_active_weekday?: string | null
  biggest_day?: WrappedActivity | null
  longest_activity?: WrappedActivity | null
  biggest_climb?: WrappedActivity | null
  most_kudos_activity?: WrappedActivity | null
  top_kudos_givers: { name: string; count: number }[]
  favourite_partners: { name: string; activity_count?: number; count?: number }[]
  cumulative_distance: { date: string; distance_km: number; cumulative_distance_km: number }[]
  monthly_distance: { month: string; distance_km: number }[]
  time_of_day_distribution: { label: string; count: number }[]
  heatmap_points: HeatmapPoint[]
  fun_lines: string[]
}
