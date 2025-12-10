import React, { useMemo, useState } from 'react'
import { ActivityHighlight, DailyPoint } from '../types/api'
import { useStravaData } from '../context/StravaDataContext'
import ActivityModal from './ActivityModal'

interface Props {
  data: DailyPoint[]
}

const colorScale = (distance: number) => {
  if (distance === 0) return '#e2e8f0'
  if (distance < 2) return '#c7d2fe'
  if (distance < 5) return '#a5b4fc'
  if (distance < 10) return '#818cf8'
  return '#6366f1'
}

const CalendarHeatmap: React.FC<Props> = ({ data }) => {
  const { fetchDayActivities } = useStravaData()
  const [selected, setSelected] = useState<{ date: string; activities: ActivityHighlight[] }>()
  const cells = useMemo(() => data.map((d) => ({ ...d, color: colorScale(d.distance_km) })), [data])

  const handleClick = async (date: string) => {
    const activities = await fetchDayActivities(date)
    setSelected({ date, activities })
  }

  return (
    <div className="card" style={{ overflowX: 'auto' }}>
      <div className="section-title">
        <h3 style={{ margin: 0 }}>Activity Heatmap</h3>
        <div className="subtle-text">Distance intensity</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(53, 14px)', gap: 4 }}>
        {cells.map((c) => (
          <div
            key={c.date}
            title={`${c.date}\n${c.distance_km} km | ${c.moving_time_minutes} min | ${c.activities_count} activities`}
            style={{ width: 14, height: 14, borderRadius: 4, background: c.color, cursor: 'pointer' }}
            onClick={() => handleClick(c.date)}
          ></div>
        ))}
      </div>
      <div className="subtle-text" style={{ marginTop: 12 }}>Low → High</div>
      {selected && (
        <ActivityModal
          title={`Activities on ${selected.date}`}
          activities={selected.activities}
          onClose={() => setSelected(undefined)}
        />
      )}
    </div>
  )
}

export default CalendarHeatmap
