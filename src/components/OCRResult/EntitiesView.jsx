import React from 'react';
import { User, Home, FileSignature, Landmark } from 'lucide-react';

export default function EntitiesView({ data }) {
  if (!data) return null;

  const renderEntityCard = (title, icon, details) => {
    // If the object is empty or all of its keys are empty, hide the card
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
            
            // Format camelCase key into human-readable label (e.g. "surveyNo" -> "Survey No")
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

  return (
    <div className="entities-grid animate-fadeIn">
      {renderEntityCard('Seller / Vendor', <User size={18} />, data.seller)}
      {renderEntityCard('Buyer / Purchaser', <User size={18} />, data.buyer)}
      {renderEntityCard('Property Details', <Home size={18} />, data.property)}
      {renderEntityCard('Registration Details', <FileSignature size={18} />, data.registration)}
    </div>
  );
}
