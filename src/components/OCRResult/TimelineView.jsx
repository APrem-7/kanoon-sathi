import React from 'react';
import { Calendar, CircleDot } from 'lucide-react';

export default function TimelineView({ timeline }) {
  if (!timeline || timeline.length === 0) {
    return (
      <div className="glass rounded-xl p-8 text-center text-slate-400">
        No timeline events detected.
      </div>
    );
  }

  return (
    <div className="glass rounded-xl p-6 shadow-lg">
      <div className="flex items-center gap-2 mb-6 text-indigo-400">
        <Calendar size={20} />
        <h3 className="text-lg font-semibold text-white">Event Timeline</h3>
      </div>
      
      <div className="relative pl-4 border-l border-white/10 space-y-6">
        {timeline.map((event, idx) => (
          <div key={idx} className="relative">
            <div className="absolute -left-[21px] top-1 text-indigo-500 bg-slate-900 rounded-full">
              <CircleDot size={12} className="fill-indigo-500/20" />
            </div>
            
            <div className="mb-1 text-sm font-bold text-amber-400">
              {event.date || 'Unknown Date'}
            </div>
            <div className="text-slate-200">
              {event.event || event.description || 'Event Details'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
