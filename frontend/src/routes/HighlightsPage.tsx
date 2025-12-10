import React from 'react'
import LoadingSpinner from '../components/LoadingSpinner'
import { useStravaData } from '../context/StravaDataContext'

const Section: React.FC<{ title: string; items: any[] }> = ({ title, items }) => (
  <div>
    <h3>{title}</h3>
    <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
      {items.map((item) => (
        <div key={item.id + item.name} className="card">
          <div className="flex-between">
            <div style={{ fontWeight: 700 }}>{item.name}</div>
            <div className="badge">{item.type}</div>
          </div>
          <div className="subtle-text">{item.date}</div>
          <div style={{ marginTop: 8 }}>
            {item.distance_km} km · {item.elevation_m} m · {item.moving_time_minutes} min
          </div>
        </div>
      ))}
    </div>
  </div>
)

const HighlightsPage: React.FC = () => {
  const { highlights, loading } = useStravaData()

  if (loading && !highlights) return <LoadingSpinner />
  if (!highlights) return <div className="container">Connect Strava to see highlights.</div>

  return (
    <div className="container">
      <h1>Highlights</h1>
      <Section title="Longest Activities" items={highlights.longest_activities} />
      <Section title="Biggest Climbs" items={highlights.biggest_climbs} />
      <Section title="Fastest Runs" items={highlights.fastest_runs} />
      <Section title="Fastest Rides" items={highlights.fastest_rides} />
    </div>
  )
}

export default HighlightsPage
