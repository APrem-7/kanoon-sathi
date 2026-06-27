import React from 'react';
import { FileText, User, DollarSign, MapPin } from 'lucide-react';

export default function AISummary({ data }) {
  if (!data) return null;

  const { document_type, summary, saleAmount, seller, buyer, property } = data;

  return (
    <div className="summary-container animate-fadeIn">
      <div className="summary-main-card">
        {/* Header Block */}
        <div className="summary-header-row">
          <div className="summary-title-wrapper">
            <div className="summary-icon-box">
              <FileText size={22} />
            </div>
            <div>
              <h3>AI Executive Summary</h3>
            </div>
          </div>
          {document_type && (
            <span className="summary-badge summary-badge-type">
              {document_type}
            </span>
          )}
        </div>
        
        {/* Core Summary Narrative */}
        <div className="summary-text">
          {summary || 'No summary text available.'}
        </div>
        
        {/* Core Stats Overview */}
        <div className="summary-stats-grid">
          {seller?.name && (
            <div className="summary-stat-card">
              <span className="summary-stat-label">Seller / Vendor</span>
              <span className="summary-stat-value">{seller.name}</span>
            </div>
          )}

          {buyer?.name && (
            <div className="summary-stat-card">
              <span className="summary-stat-label">Buyer / Purchaser</span>
              <span className="summary-stat-value">{buyer.name}</span>
            </div>
          )}

          {saleAmount && (
            <div className="summary-stat-card">
              <span className="summary-stat-label">Consideration Value</span>
              <span className="summary-stat-value highlighted">{saleAmount}</span>
            </div>
          )}

          {property?.location && (
            <div className="summary-stat-card">
              <span className="summary-stat-label">Property Location</span>
              <span className="summary-stat-value" title={property.location}>{property.location}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
