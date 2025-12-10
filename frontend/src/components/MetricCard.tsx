import React from 'react'

interface MetricCardProps {
  label: string
  value: string | number
  sublabel?: string
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, sublabel }) => {
  return (
    <div className="card">
      <div className="subtle-text" style={{ marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700 }}>{value}</div>
      {sublabel && <div className="subtle-text" style={{ marginTop: 6 }}>{sublabel}</div>}
    </div>
  )
}

export default MetricCard
