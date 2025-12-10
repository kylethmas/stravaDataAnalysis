import React, { useMemo } from 'react'
import ChartCard from '../components/ChartCard'
import LoadingSpinner from '../components/LoadingSpinner'
import { useStravaData } from '../context/StravaDataContext'
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

const TrendsPage: React.FC = () => {
  const { trends, loading } = useStravaData()

  const weekdayData = useMemo(() => {
    if (!trends) return []
    const counts: Record<string, number> = { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 }
    trends.daily.forEach((d) => {
      const day = new Date(d.date).getDay()
      const keys = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      counts[keys[day]] += d.activities_count
    })
    return Object.entries(counts).map(([name, count]) => ({ name, count }))
  }, [trends])

  if (loading && !trends) return <LoadingSpinner />
  if (!trends) return <div className="container">Connect Strava to see trends.</div>

  return (
    <div className="container">
      <h1>Trends</h1>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
        <ChartCard title="Weekly distance">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={trends.weekly}>
              <XAxis dataKey="label" hide />
              <YAxis hide />
              <Tooltip />
              <Line dataKey="distance_km" stroke="#fc5200" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Monthly distance">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={trends.monthly}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="distance_km" fill="#60a5fa" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Activity count by weekday">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={weekdayData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#34d399" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  )
}

export default TrendsPage
