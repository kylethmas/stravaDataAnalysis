import React from 'react'

const FactsList: React.FC<{ facts?: string[] }> = ({ facts }) => {
  if (!facts || facts.length === 0) return null
  return (
    <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
      {facts.map((fact, idx) => (
        <div key={idx} className="card" style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <div className="badge">Fun</div>
          <div>{fact}</div>
        </div>
      ))}
    </div>
  )
}

export default FactsList
