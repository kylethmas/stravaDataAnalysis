import React, { createContext, useContext, useEffect, useState } from 'react'
import { FactsResponse, HighlightsResponse, SummaryResponse, TrendsResponse } from '../types/api'

interface StravaDataContextType {
  summary?: SummaryResponse
  trends?: TrendsResponse
  highlights?: HighlightsResponse
  facts?: string[]
  loading: boolean
  error?: string
  refresh: () => Promise<void>
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

  const load = async () => {
    setLoading(true)
    setError(undefined)
    try {
      const [s, t, h, f] = await Promise.all([
        fetchJson<SummaryResponse>('http://localhost:8000/api/summary'),
        fetchJson<TrendsResponse>('http://localhost:8000/api/trends'),
        fetchJson<HighlightsResponse>('http://localhost:8000/api/highlights'),
        fetchJson<FactsResponse>('http://localhost:8000/api/facts'),
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
  }, [])

  return (
    <StravaDataContext.Provider value={{ summary, trends, highlights, facts, loading, error, refresh: load }}>
      {children}
    </StravaDataContext.Provider>
  )
}

export function useStravaData() {
  const ctx = useContext(StravaDataContext)
  if (!ctx) throw new Error('useStravaData must be used within provider')
  return ctx
}
