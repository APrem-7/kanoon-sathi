import React from 'react';
import { Calendar } from 'lucide-react';

export default function TimelineView({ timeline }) {
  if (!timeline || timeline.length === 0) {
    return (
      <div className="timeline-card animate-fadeIn">
        <div className="timeline-card-header">
          <Calendar size={18} />
          <h3>Event Timeline</h3>
        </div>
        <div style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: 'var(--space-lg) 0' }}>
          No timeline events detected in this legal document.
        </div>
      </div>
    );
  }

  return (
    <div className="timeline-card animate-fadeIn">
      <div className="timeline-card-header">
        <Calendar size={20} />
        <h3>Event Timeline</h3>
      </div>
      
      <div className="timeline-pipeline">
        {timeline.map((event, idx) => (
          <div key={idx} className="timeline-item">
            {/* Glowing checkpoint node */}
            <div className="timeline-node" />
            
            {/* Highlighted Event Date */}
            <div className="timeline-date">
              {event.date || 'Execution Date'}
            </div>
            
            {/* Event Description */}
            <div className="timeline-description">
              {event.event || event.description || 'Legal Event / Transaction Transaction'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
