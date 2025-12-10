import React, { useMemo, useState } from 'react'
import ChartCard from '../components/ChartCard'
import LoadingSpinner from '../components/LoadingSpinner'
import { useStravaData } from '../context/StravaDataContext'
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import ActivityModal from '../components/ActivityModal'
import { ActivityHighlight } from '../types/api'

const TrendsPage: React.FC = () => {
  const { trends, loading, fetchPeriodActivities } = useStravaData()
  const [modalData, setModalData] = useState<{ title: string; activities: ActivityHighlight[] }>()

  const weekdayData = useMemo(() => trends?.weekday_stats || [], [trends])

  const handleWeekClick = async (label: string) => {
    const [year, weekPart] = label.split('-W')
    const weekNumber = Number(weekPart)
    const simple = new Date(Date.UTC(Number(year), 0, 1 + (weekNumber - 1) * 7))
    const dow = simple.getUTCDay()
    const isoWeekStart = new Date(simple)
    isoWeekStart.setUTCDate(simple.getUTCDate() - ((dow + 6) % 7))
    const isoWeekEnd = new Date(isoWeekStart)
    isoWeekEnd.setUTCDate(isoWeekStart.getUTCDate() + 6)
    const startStr = isoWeekStart.toISOString().slice(0, 10)
    const endStr = isoWeekEnd.toISOString().slice(0, 10)
    const activities = await fetchPeriodActivities(startStr, endStr)
    setModalData({ title: `Week ${label}`, activities })
  }

  const handleMonthClick = async (label: string) => {
    const [year, month] = label.split('-')
    const start = `${label}-01`
    const endDate = new Date(Number(year), Number(month), 0).toISOString().slice(0, 10)
    const activities = await fetchPeriodActivities(start, endDate)
    setModalData({ title: `Month ${label}`, activities })
  }

  if (loading && !trends) return <LoadingSpinner />
  if (!trends) return <div className="container">Connect Strava to see trends.</div>

  return (
    <div className="container">
      <h1>Trends</h1>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
        <ChartCard title="Weekly distance">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={trends.weekly} onClick={(e) => e.activeLabel && handleWeekClick(String(e.activeLabel))}>
              <XAxis dataKey="label" hide />
              <YAxis hide />
              <Tooltip />
              <Line dataKey="distance_km" stroke="#fc5200" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Monthly distance">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={trends.monthly} onClick={(e) => e.activeLabel && handleMonthClick(String(e.activeLabel))}>
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
              <XAxis dataKey="weekday" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="distance_km" fill="#34d399" />
            </BarChart>
          </ResponsiveContainer>
          {trends.most_active_weekday && (
            <div className="chip-row" style={{ marginTop: 8 }}>
              <span className="badge">Most active: {trends.most_active_weekday}</span>
            </div>
          )}
        </ChartCard>
      </div>
      {modalData && (
        <ActivityModal
          title={modalData.title}
          activities={modalData.activities}
          onClose={() => setModalData(undefined)}
        />
      )}
    </div>
  )
}

export default TrendsPage
