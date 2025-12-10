import React from 'react'
import CalendarHeatmap from '../components/CalendarHeatmap'
import LoadingSpinner from '../components/LoadingSpinner'
import { useStravaData } from '../context/StravaDataContext'

const CalendarPage: React.FC = () => {
  const { trends, loading } = useStravaData()

  if (loading && !trends) return <LoadingSpinner />
  if (!trends) return <div className="container">Connect Strava to see your calendar.</div>

  return (
    <div className="container">
      <h1>Calendar</h1>
      <CalendarHeatmap data={trends.daily} />
    </div>
  )
}

export default CalendarPage
