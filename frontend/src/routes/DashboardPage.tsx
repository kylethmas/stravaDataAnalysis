import React, { useMemo, useState } from 'react'
import MetricCard from '../components/MetricCard'
import ChartCard from '../components/ChartCard'
import FactsList from '../components/FactsList'
import LoadingSpinner from '../components/LoadingSpinner'
import { useStravaData } from '../context/StravaDataContext'
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import ActivityModal from '../components/ActivityModal'
import { ActivityHighlight } from '../types/api'

const DashboardPage: React.FC = () => {
  const { summary, trends, facts, loading, error, fetchPeriodActivities } = useStravaData()
  const [modalData, setModalData] = useState<{ title: string; activities: ActivityHighlight[] }>()

  if (loading && !summary) return <LoadingSpinner />
  if (error && !summary) return <div className="container">{error}</div>
  if (!summary) return <div className="container">Connect your Strava to see data.</div>

  const weeklyData = useMemo(() => trends?.weekly.slice(-8) || [], [trends])

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

  return (
    <div className="container">
      <h1>Dashboard</h1>
      <div className="metric-grid">
        <MetricCard label="Total distance" value={`${summary.total_distance_km} km`} />
        <MetricCard label="Total elevation" value={`${summary.total_elevation_m} m`} />
        <MetricCard label="Total time" value={`${summary.total_time_hours} h`} />
        <MetricCard label="Activities" value={summary.activities_count} />
        <MetricCard label="Best month" value={summary.best_month || 'N/A'} sublabel={`${summary.best_month_distance_km || 0} km`} />
        <MetricCard label="Active days" value={`${summary.active_days} days`} sublabel={`${summary.active_days_percent}% of year`} />
        <MetricCard label="Longest streak" value={`${summary.longest_streak_days} days`} />
        <MetricCard label="Most epic day" value={summary.most_epic_day_date || 'N/A'} sublabel={`${summary.most_epic_day_distance_km || 0} km`} />
      </div>

      <ChartCard title="Recent weekly distance">
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={weeklyData} onClick={(e) => e.activeLabel && handleWeekClick(String(e.activeLabel))}>
            <XAxis dataKey="label" hide />
            <YAxis hide />
            <Tooltip
              formatter={(value: any, _name, props: any) => [
                `${value} km`,
                `${props?.payload?.activities_count || 0} activities · ${props?.payload?.moving_time_hours} h`,
              ]}
            />
            <Area type="monotone" dataKey="distance_km" stroke="#fc5200" fill="#fed7aa" />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <h3 className="section-title" style={{ marginTop: 32 }}>
        <span>Fun facts</span>
      </h3>
      <FactsList facts={facts} />
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

export default DashboardPage
