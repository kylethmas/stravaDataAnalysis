import React, { useEffect, useMemo, useState } from 'react'
import { Area, AreaChart, CartesianGrid, Pie, PieChart, Tooltip, XAxis } from 'recharts'
import { useNavigate } from 'react-router-dom'
import { useStravaData } from '../context/StravaDataContext'
import { WrappedResponse, WrappedActivity } from '../types/api'

interface SlideConfig {
  id: string
  title: string
  description?: string
  background: string
  content: React.ReactNode
}

const WrappedCard: React.FC<{ title: string; highlight?: string; children?: React.ReactNode; onClick?: () => void }>
  = ({ title, highlight, children, onClick }) => (
    <div className="wrapped-card" onClick={onClick} role={onClick ? 'button' : undefined}>
      <div className="wrapped-card-header">
        <div className="pill">{title}</div>
        {highlight && <div className="wrapped-highlight">{highlight}</div>}
      </div>
      <div className="wrapped-card-body">{children}</div>
    </div>
  )

const ActivityPill: React.FC<{ activity?: WrappedActivity | null; label: string }> = ({ activity, label }) => {
  if (!activity) return <div className="muted">No data yet</div>
  return (
    <div className="activity-pill">
      <div className="pill">{label}</div>
      <div className="activity-pill-title">{activity.name}</div>
      <div className="activity-pill-meta">
        <span>{activity.date}</span>
        <span>{activity.distance_km.toFixed(1)} km · {activity.elevation_m.toFixed(0)} m</span>
      </div>
      <a className="pill-link" href={activity.strava_url} target="_blank" rel="noreferrer">
        View on Strava ↗
      </a>
    </div>
  )
}

const WrappedPage: React.FC = () => {
  const { activityType } = useStravaData()
  const [data, setData] = useState<WrappedResponse>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()
  const [current, setCurrent] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    let isMounted = true
    const load = async () => {
      setLoading(true)
      setError(undefined)
      try {
        const resp = await fetch(`http://localhost:8000/api/wrapped?activity_type=${activityType}`, { credentials: 'include' })
        if (!resp.ok) {
          const body = await resp.json().catch(() => ({}))
          throw new Error(body?.detail || resp.statusText)
        }
        const json = (await resp.json()) as WrappedResponse
        if (isMounted) setData(json)
      } catch (err: any) {
        if (isMounted) setError(err.message)
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    load()
    return () => {
      isMounted = false
    }
  }, [activityType])

  const slides: SlideConfig[] = useMemo(() => {
    if (!data) return []

    return [
      {
        id: 'intro',
        title: `Your Strava Wrapped ${data.year}`,
        description: 'A bold look at your epic year on Strava.',
        background: 'linear-gradient(135deg, #7c3aed, #f97316)',
        content: (
          <div className="grid-2">
            <div>
              <div className="hero-number">{Math.round(data.total_distance_km).toLocaleString()} km</div>
              <p className="muted">Total distance across {data.activities_count} activities.</p>
              <div className="chip-row">
                {data.key_stats.map((stat) => (
                  <div key={stat.label} className="chip-chip">
                    <div className="chip-title">{stat.label}</div>
                    <div className="chip-value">{stat.formatted}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="glow-card">
              <p className="muted">This year you kept moving for</p>
              <div className="hero-number">{data.total_time_hours.toFixed(1)} h</div>
              <p className="muted">and climbed {data.total_elevation_m.toLocaleString()} m</p>
            </div>
          </div>
        ),
      },
      {
        id: 'consistency',
        title: 'Consistency champion',
        description: 'Your rhythm, your streaks, your favourite weekday.',
        background: 'linear-gradient(135deg, #2563eb, #22c55e)',
        content: (
          <div className="grid-3">
            <WrappedCard title="Active days" highlight={`${data.active_days} days`}>
              <div className="pill-explainer">That is {(data.active_days / 365 * 100).toFixed(1)}% of the year.</div>
            </WrappedCard>
            <WrappedCard title="Longest streak" highlight={`${data.longest_streak_days} days`}>
              <div className="pill-explainer">No breaks, just flow.</div>
            </WrappedCard>
            <WrappedCard title="Most active weekday" highlight={data.most_active_weekday || '—'}>
              <div className="pill-explainer">Your go-to training day.</div>
            </WrappedCard>
          </div>
        ),
      },
      {
        id: 'volume',
        title: 'Volume over time',
        description: 'Watch your kilometres stack up.',
        background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
        content: (
          <div className="chart-card">
            <AreaChart width={800} height={340} data={data.cumulative_distance}>
              <defs>
                <linearGradient id="colorDistance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.9} />
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="date" hide />
              <Tooltip />
              <Area type="monotone" dataKey="cumulative_distance_km" stroke="#a855f7" fillOpacity={1} fill="url(#colorDistance)" />
            </AreaChart>
          </div>
        ),
      },
      {
        id: 'moments',
        title: 'Big moments',
        description: 'Celebrate the days that mattered most.',
        background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
        content: (
          <div className="grid-2">
            <WrappedCard
              title="Biggest day"
              highlight={data.biggest_day ? `${data.biggest_day.distance_km.toFixed(1)} km` : '—'}
              onClick={() => data.biggest_day && window.open(data.biggest_day.strava_url, '_blank')}
            >
              <ActivityPill activity={data.biggest_day} label="Distance monster" />
            </WrappedCard>
            <WrappedCard
              title="Biggest climb"
              highlight={data.biggest_climb ? `${data.biggest_climb.elevation_m.toFixed(0)} m` : '—'}
              onClick={() => data.biggest_climb && window.open(data.biggest_climb.strava_url, '_blank')}
            >
              <ActivityPill activity={data.biggest_climb} label="Climbing hero" />
            </WrappedCard>
          </div>
        ),
      },
      {
        id: 'fastest',
        title: 'Longest adventure',
        description: 'The session that just kept going.',
        background: 'linear-gradient(135deg, #14b8a6, #1d4ed8)',
        content: (
          <div className="grid-2">
            <WrappedCard
              title="Longest activity"
              highlight={data.longest_activity ? `${data.longest_activity.distance_km.toFixed(1)} km` : '—'}
              onClick={() => data.longest_activity && window.open(data.longest_activity.strava_url, '_blank')}
            >
              <ActivityPill activity={data.longest_activity} label="Endurance mode" />
            </WrappedCard>
            <WrappedCard
              title="Most kudos"
              highlight={data.most_kudos_activity ? `${data.most_kudos_activity.kudos_count || 0} kudos` : '—'}
              onClick={() => data.most_kudos_activity && window.open(data.most_kudos_activity.strava_url, '_blank')}
            >
              <ActivityPill activity={data.most_kudos_activity} label="Crowd favourite" />
            </WrappedCard>
          </div>
        ),
      },
      {
        id: 'social',
        title: 'Crew love',
        description: 'Kudos that kept you going.',
        background: 'linear-gradient(135deg, #ec4899, #a855f7)',
        content: (
          <div className="grid-2">
            <WrappedCard title="Top kudos givers">
              <div className="bubble-row">
                {data.top_kudos_givers.length === 0 && <div className="muted">No kudos data yet</div>}
                {data.top_kudos_givers.map((giver) => (
                  <div key={giver.name} className="bubble" title={`${giver.count} kudos`}>
                    <span>{giver.name}</span>
                    <small>{giver.count} kudos</small>
                  </div>
                ))}
              </div>
            </WrappedCard>
            <WrappedCard title="Favourite partners">
              <div className="bubble-row">
                {data.favourite_partners.length === 0 && <div className="muted">No group rides logged</div>}
                {data.favourite_partners.map((partner) => (
                  <div key={partner.name} className="bubble alt">
                    <span>{partner.name}</span>
                    <small>{partner.activity_count || partner.count || 0} times</small>
                  </div>
                ))}
              </div>
            </WrappedCard>
          </div>
        ),
      },
      {
        id: 'heatmap',
        title: 'Where you started',
        description: 'Hotspots from your start lines.',
        background: 'linear-gradient(135deg, #1e293b, #0f172a)',
        content: (
          <div className="heatmap-grid">
            {data.heatmap_points.length === 0 && <div className="muted">No locations found</div>}
            {data.heatmap_points.map((point) => (
              <div key={`${point.lat}-${point.lng}`} className="heat-dot" style={{ boxShadow: `0 0 ${4 + point.count}px rgba(250, 204, 21, 0.7)` }}>
                <div className="heat-dot-inner" style={{ width: 10 + point.count * 2, height: 10 + point.count * 2 }} />
                <span>
                  {point.lat}, {point.lng} · {point.count}
                </span>
              </div>
            ))}
          </div>
        ),
      },
      {
        id: 'time-of-day',
        title: 'Your time of day',
        description: 'Morning grinder or sunset cruiser?',
        background: 'linear-gradient(135deg, #34d399, #06b6d4)',
        content: (
          <div className="chart-card">
            <PieChart width={520} height={320}>
              <Pie
                data={data.time_of_day_distribution}
                dataKey="count"
                nameKey="label"
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={120}
                fill="#8884d8"
                label
              />
              <Tooltip />
            </PieChart>
            <p className="muted">You gravitate towards {data.time_of_day_distribution.sort((a, b) => b.count - a.count)[0]?.label || 'the road'}.</p>
          </div>
        ),
      },
      {
        id: 'wrap-up',
        title: 'Until next year',
        description: 'Favourite highlights from your season',
        background: 'linear-gradient(135deg, #0ea5e9, #f97316)',
        content: (
          <div className="grid-2">
            <div className="fun-lines">
              {data.fun_lines.map((line) => (
                <div key={line} className="fun-line">{line}</div>
              ))}
            </div>
            <div className="glow-card">
              <div className="hero-number">{data.activities_count}</div>
              <p className="muted">activities logged this year.</p>
              <button className="btn" onClick={() => navigate('/dashboard')}>Explore full stats</button>
            </div>
          </div>
        ),
      },
    ]
  }, [data, navigate])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setCurrent((prev) => Math.min(prev + 1, slides.length - 1))
      if (e.key === 'ArrowLeft') setCurrent((prev) => Math.max(prev - 1, 0))
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [slides.length])

  const goNext = () => setCurrent((c) => Math.min(c + 1, Math.max(slides.length - 1, 0)))
  const goPrev = () => setCurrent((c) => Math.max(c - 1, 0))

  if (loading) {
    return (
      <div className="wrapped-shell">
        <div className="wrapped-loading">Loading your Wrapped...</div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="wrapped-shell">
        <div className="wrapped-error">{error || 'No data found. Connect Strava to get started.'}</div>
      </div>
    )
  }

  const activeSlide = slides[current]

  return (
    <div className="wrapped-shell">
      <div className="progress-dots">
        {slides.map((s, idx) => (
          <div key={s.id} className={`dot ${idx === current ? 'active' : ''}`} />
        ))}
      </div>
      {activeSlide && (
        <div className="wrapped-slide" style={{ background: activeSlide.background }}>
          <div className="wrapped-header">
            <div>
              <div className="eyebrow">Wrapped</div>
              <h1>{activeSlide.title}</h1>
              {activeSlide.description && <p className="muted">{activeSlide.description}</p>}
            </div>
            <div className="nav-buttons">
              <button className="pill-button" onClick={goPrev} disabled={current === 0}>
                ← Prev
              </button>
              <button className="pill-button" onClick={goNext} disabled={current === slides.length - 1}>
                Next →
              </button>
            </div>
          </div>
          <div className="wrapped-content">{activeSlide.content}</div>
        </div>
      )}
    </div>
  )
}

export default WrappedPage
