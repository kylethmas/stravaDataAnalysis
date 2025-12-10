import React from 'react'
import { NavLink } from 'react-router-dom'
import { useStravaData } from '../context/StravaDataContext'

const NavBar: React.FC = () => {
  const { summary } = useStravaData()
  const year = new Date().getFullYear()
  return (
    <div className="navbar">
      <div className="navbar-content">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontWeight: 800, fontSize: 18 }}>Strava Year in Review</div>
          <div className="badge">{year}</div>
        </div>
        <div className="nav-links">
          <NavLink to="/dashboard">Dashboard</NavLink>
          <NavLink to="/calendar">Calendar</NavLink>
          <NavLink to="/trends">Trends</NavLink>
          <NavLink to="/highlights">Highlights</NavLink>
          {summary && <span className="subtle-text">{summary.total_distance_km} km</span>}
        </div>
      </div>
    </div>
  )
}

export default NavBar
