import React from 'react'
import { ActivityHighlight } from '../types/api'

interface Props {
  title: string
  activities: ActivityHighlight[]
  onClose: () => void
}

const ActivityModal: React.FC<Props> = ({ title, activities, onClose }) => {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 style={{ margin: 0 }}>{title}</h3>
            <div className="subtle-text">{activities.length} activities</div>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="modal-body">
          {activities.map((a) => (
            <a
              key={a.id}
              href={a.strava_url}
              target="_blank"
              rel="noreferrer"
              className="activity-row"
            >
              <div>
                <div className="activity-title">{a.name}</div>
                <div className="subtle-text">
                  {a.date} · {a.type}
                </div>
              </div>
              <div className="subtle-text" style={{ textAlign: 'right' }}>
                <div>{a.distance_km} km</div>
                <div>{a.elevation_m} m elev</div>
              </div>
            </a>
          ))}
          {activities.length === 0 && <div className="subtle-text">No activities yet.</div>}
        </div>
      </div>
    </div>
  )
}

export default ActivityModal
