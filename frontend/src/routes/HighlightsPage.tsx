import React, { useMemo, useState } from 'react'
import LoadingSpinner from '../components/LoadingSpinner'
import { useStravaData } from '../context/StravaDataContext'
import { ActivityHighlight } from '../types/api'

const Section: React.FC<{ title: string; items: ActivityHighlight[] }> = ({ title, items }) => (
  <div>
    <h3>{title}</h3>
    <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
      {items.map((item) => (
        <a key={item.id + item.name} className="card highlight-card" href={item.strava_url} target="_blank" rel="noreferrer">
          <div className="flex-between">
            <div style={{ fontWeight: 700 }}>{item.name}</div>
            <div className="badge">{item.type}</div>
          </div>
          <div className="subtle-text">{item.date}</div>
          <div style={{ marginTop: 8 }}>
            {item.distance_km} km · {item.elevation_m} m · {item.moving_time_minutes} min
          </div>
          {item.average_speed_kmh && <div className="subtle-text">Avg speed {item.average_speed_kmh} km/h</div>}
        </a>
      ))}
    </div>
  </div>
)

const HighlightsPage: React.FC = () => {
  const { highlights, loading } = useStravaData()
  const [sortKey, setSortKey] = useState<'distance' | 'elevation' | 'date'>('distance')

  const sortItems = (items: ActivityHighlight[]) => {
    const copy = [...items]
    if (sortKey === 'distance') copy.sort((a, b) => b.distance_km - a.distance_km)
    if (sortKey === 'elevation') copy.sort((a, b) => b.elevation_m - a.elevation_m)
    if (sortKey === 'date') copy.sort((a, b) => b.date.localeCompare(a.date))
    return copy
  }

  const sorted = useMemo(() => {
    if (!highlights) return highlights
    return {
      longest_activities: sortItems(highlights.longest_activities),
      biggest_climbs: sortItems(highlights.biggest_climbs),
      fastest_runs: sortItems(highlights.fastest_runs),
      fastest_rides: sortItems(highlights.fastest_rides),
    }
  }, [highlights, sortKey])

  if (loading && !highlights) return <LoadingSpinner />
  if (!highlights) return <div className="container">Connect Strava to see highlights.</div>

  return (
    <div className="container">
      <div className="section-title">
        <h1>Highlights</h1>
        <div className="chip-row">
          <span className="subtle-text">Sort by</span>
          <select className="pill-select" value={sortKey} onChange={(e) => setSortKey(e.target.value as any)}>
            <option value="distance">Distance</option>
            <option value="elevation">Elevation</option>
            <option value="date">Date</option>
          </select>
        </div>
      </div>
      <Section title="Longest Activities" items={sorted?.longest_activities || highlights.longest_activities} />
      <Section title="Biggest Climbs" items={sorted?.biggest_climbs || highlights.biggest_climbs} />
      <Section title="Fastest Runs" items={sorted?.fastest_runs || highlights.fastest_runs} />
      <Section title="Fastest Rides" items={sorted?.fastest_rides || highlights.fastest_rides} />
    </div>
  )
}

export default HighlightsPage
