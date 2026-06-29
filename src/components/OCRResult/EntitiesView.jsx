import React from 'react';
import { User, Home, FileSignature, Calendar } from 'lucide-react';

export default function EntitiesView({ data }) {
  if (!data) return null;

  const isMultiDeed = data.deeds && Array.isArray(data.deeds) && data.deeds.length > 1;

  const renderEntityCard = (title, icon, details) => {
    if (!details || Object.keys(details).length === 0) return null;
    const hasAnyContent = Object.values(details).some(val => val && val.toString().trim().length > 0);
    if (!hasAnyContent) return null;

    return (
      <div className="entity-card">
        <div className="entity-card-header">
          {icon}
          <h3>{title}</h3>
        </div>
        <div className="entity-card-body">
          {Object.entries(details).map(([key, value]) => {
            if (!value || value.toString().trim() === '') return null;
            
            const formattedKey = key
              .replace(/([A-Z])/g, ' $1')
              .replace(/^./, str => str.toUpperCase());
              
            return (
              <div key={key} className="entity-field">
                <span className="entity-field-label">{formattedKey}</span>
                <span className="entity-field-value">
                  {typeof value === 'object' ? JSON.stringify(value) : value}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (isMultiDeed) {
    return (
      <div className="entities-multi-container animate-fadeIn">
        {/* Unified Property Card */}
        <div style={{ marginBottom: 'var(--space-lg)' }}>
          {renderEntityCard('Property Details', <Home size={18} />, data.property)}
        </div>

        {/* deeds Title Chain History Header */}
        <h3 style={{ 
          fontSize: '1rem', 
          fontWeight: '600', 
          color: 'var(--color-text-primary)', 
          marginBottom: 'var(--space-md)',
          paddingLeft: 'var(--space-xs)',
          borderLeft: '3px solid var(--color-accent)'
        }}>
          Chronological Deeds History ({data.deeds.length} Deeds)
        </h3>

        {/* Deeds Chain Grid */}
        <div className="entities-grid">
          {data.deeds.map((deed, index) => {
            const hasReg = deed.registration && Object.values(deed.registration).some(v => v);
            const formattedReg = hasReg ? [
              deed.registration.regNo ? `No: ${deed.registration.regNo}` : '',
              deed.registration.year ? `Year: ${deed.registration.year}` : '',
              deed.registration.office ? `Office: ${deed.registration.office}` : ''
            ].filter(Boolean).join(' | ') : null;

            const deedDetails = {
              sellerName: deed.seller?.name || '',
              sellerAddress: deed.seller?.address || '',
              buyerName: deed.buyer?.name || '',
              buyerAddress: deed.buyer?.address || '',
              consideration: deed.saleAmount || '',
              registration: formattedReg || ''
            };

            return (
              <div key={index} className="entity-card" style={{ borderLeft: '3px solid var(--color-accent-light)' }}>
                <div className="entity-card-header">
                  <Calendar size={18} style={{ color: 'var(--color-accent-light)' }} />
                  <h3>Deed #{index + 1} ({deed.date || 'Historical'})</h3>
                </div>
                <div className="entity-card-body">
                  {Object.entries(deedDetails).map(([key, value]) => {
                    if (!value || value.toString().trim() === '') return null;
                    
                    const formattedKey = key
                      .replace(/([A-Z])/g, ' $1')
                      .replace(/^./, str => str.toUpperCase());
                      
                    return (
                      <div key={key} className="entity-field">
                        <span className="entity-field-label">{formattedKey}</span>
                        <span className="entity-field-value">{value}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Fallback to single deed layout
  return (
    <div className="entities-grid animate-fadeIn">
      {renderEntityCard('Seller / Vendor', <User size={18} />, data.seller)}
      {renderEntityCard('Buyer / Purchaser', <User size={18} />, data.buyer)}
      {renderEntityCard('Property Details', <Home size={18} />, data.property)}
      {renderEntityCard('Registration Details', <FileSignature size={18} />, data.registration)}
    </div>
  );
}
