import { Navigate, Route, Routes } from 'react-router-dom'
import LandingPage from './routes/LandingPage'
import DashboardPage from './routes/DashboardPage'
import CalendarPage from './routes/CalendarPage'
import TrendsPage from './routes/TrendsPage'
import HighlightsPage from './routes/HighlightsPage'
import NavBar from './components/NavBar'
import { StravaDataProvider } from './context/StravaDataContext'

function App() {
  return (
    <StravaDataProvider>
      <NavBar />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/trends" element={<TrendsPage />} />
        <Route path="/highlights" element={<HighlightsPage />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </StravaDataProvider>
  )
}

export default App
