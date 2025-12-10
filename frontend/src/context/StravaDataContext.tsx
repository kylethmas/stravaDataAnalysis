import React, { createContext, useContext, useEffect, useState } from 'react'
import { ActivityHighlight, FactsResponse, HighlightsResponse, SummaryResponse, TrendsResponse } from '../types/api'

interface StravaDataContextType {
  summary?: SummaryResponse
  trends?: TrendsResponse
  highlights?: HighlightsResponse
  facts?: string[]
  loading: boolean
  error?: string
  activityType: string
  setActivityType: (value: string) => void
  refresh: () => Promise<void>
  fetchDayActivities: (date: string) => Promise<ActivityHighlight[]>
  fetchPeriodActivities: (start: string, end: string) => Promise<ActivityHighlight[]>
}

const StravaDataContext = createContext<StravaDataContextType | undefined>(undefined)

async function fetchJson<T>(url: string): Promise<T> {
  const resp = await fetch(url, { credentials: 'include' })
  if (!resp.ok) {
    const detail = await resp.json().catch(() => ({}))
    throw new Error(detail?.detail || resp.statusText)
  }
  return resp.json()
}

export const StravaDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [summary, setSummary] = useState<SummaryResponse>()
  const [trends, setTrends] = useState<TrendsResponse>()
  const [highlights, setHighlights] = useState<HighlightsResponse>()
  const [facts, setFacts] = useState<string[]>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()
  const [activityType, setActivityType] = useState<string>('All')

  const load = async () => {
    setLoading(true)
    setError(undefined)
    try {
      const [s, t, h, f] = await Promise.all([
        fetchJson<SummaryResponse>(`http://localhost:8000/api/summary?activity_type=${activityType}`),
        fetchJson<TrendsResponse>(`http://localhost:8000/api/trends?activity_type=${activityType}`),
        fetchJson<HighlightsResponse>(`http://localhost:8000/api/highlights?activity_type=${activityType}`),
        fetchJson<FactsResponse>(`http://localhost:8000/api/facts?activity_type=${activityType}`),
      ])
      setSummary(s)
      setTrends(t)
      setHighlights(h)
      setFacts(f.facts)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [activityType])

  const fetchDayActivities = (date: string) =>
    fetchJson<ActivityHighlight[]>(`http://localhost:8000/api/day/${date}?activity_type=${activityType}`)

  const fetchPeriodActivities = (start: string, end: string) =>
    fetchJson<ActivityHighlight[]>(`http://localhost:8000/api/period?start=${start}&end=${end}&activity_type=${activityType}`)

  return (
    <StravaDataContext.Provider
      value={{
        summary,
        trends,
        highlights,
        facts,
        loading,
        error,
        refresh: load,
        activityType,
        setActivityType,
        fetchDayActivities,
        fetchPeriodActivities,
      }}
    >
      {children}
    </StravaDataContext.Provider>
  )
}

export function useStravaData() {
  const ctx = useContext(StravaDataContext)
  if (!ctx) throw new Error('useStravaData must be used within provider')
  return ctx
}
