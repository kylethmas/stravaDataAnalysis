import React from 'react'

const ChartCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="card">
    <div className="section-title">
      <h3 style={{ margin: 0 }}>{title}</h3>
    </div>
    {children}
  </div>
)

export default ChartCard
