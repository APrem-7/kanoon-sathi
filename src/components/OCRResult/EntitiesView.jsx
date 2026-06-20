import React from 'react';
import { User, Home, FileSignature } from 'lucide-react';

export default function EntitiesView({ data }) {
  if (!data) return null;

  const renderEntityCard = (title, icon, details) => {
    if (!details || Object.keys(details).length === 0) return null;

    return (
      <div className="glass rounded-xl p-5 border border-white/5 shadow-sm hover:border-white/10 transition-colors">
        <div className="flex items-center gap-2 mb-4 text-indigo-400 border-b border-white/5 pb-3">
          {icon}
          <h3 className="font-semibold text-white tracking-wide uppercase text-sm">{title}</h3>
        </div>
        <div className="space-y-3">
          {Object.entries(details).map(([key, value]) => {
            if (!value) return null;
            // Format key nicely (e.g., "surveyNo" -> "Survey No")
            const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            return (
              <div key={key} className="flex flex-col">
                <span className="text-xs text-slate-400 uppercase tracking-wider mb-1">{formattedKey}</span>
                <span className="text-slate-200">{typeof value === 'object' ? JSON.stringify(value) : value}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {renderEntityCard('Seller / Vendor', <User size={18} />, data.seller)}
      {renderEntityCard('Buyer / Purchaser', <User size={18} />, data.buyer)}
      {renderEntityCard('Property Details', <Home size={18} />, data.property)}
      {renderEntityCard('Registration', <FileSignature size={18} />, data.registration)}
    </div>
  );
}
