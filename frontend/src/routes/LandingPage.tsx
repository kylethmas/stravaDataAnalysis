import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import LoadingSpinner from '../components/LoadingSpinner'
import { useStravaData } from '../context/StravaDataContext'

const LandingPage: React.FC = () => {
  const { summary, loading, error, refresh } = useStravaData()
  const [authUrl, setAuthUrl] = useState<string>()
  const navigate = useNavigate()

  useEffect(() => {
    fetch('http://localhost:8000/api/session', { credentials: 'include' })
  }, [])

  useEffect(() => {
    if (!loading && summary) {
      navigate('/dashboard')
    }
  }, [loading, summary, navigate])

  const handleConnect = async () => {
    const resp = await fetch('http://localhost:8000/api/auth/strava/url', { credentials: 'include' })
    const data = await resp.json()
    setAuthUrl(data.url)
    window.location.href = data.url
  }

  if (loading && !summary) return <LoadingSpinner />

  if (summary) return null

  return (
    <div className="container" style={{ paddingTop: 80 }}>
      <div className="card" style={{ textAlign: 'center', padding: 48 }}>
        <h1>Your Strava Year in Motion</h1>
        <p className="subtle-text">
          Connect your Strava and explore your year of training: trends, highlights, and fun facts.
        </p>
        <button className="btn" onClick={handleConnect} style={{ marginTop: 16 }}>
          Connect with Strava
        </button>
        {error && <div className="subtle-text" style={{ marginTop: 12 }}>{error}</div>}
        {authUrl && <div className="subtle-text" style={{ marginTop: 8 }}>Redirecting...</div>}
        <div className="subtle-text" style={{ marginTop: 16 }}>
          Already connected? <button className="btn" onClick={refresh}>Refresh data</button>
        </div>
      </div>
    </div>
  )
}

export default LandingPage
