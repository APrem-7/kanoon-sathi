import React from 'react';
import './SaleDeedChart.css';

export default function SaleDeedChart({ parsedData }) {
  if (!parsedData || parsedData.confidence < 20) {
    return (
      <div className="chart-empty">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <p>Could not extract sufficient structured data to generate a flowchart.</p>
      </div>
    );
  }

  const { seller, buyer, property, saleAmount, registration, date } = parsedData;

  return (
    <div className="chart-container" id="sale-deed-chart">
      <div className="chart-wrapper">
        
        {/* Parties & Transaction */}
        <div className="chart-parties">
          
          {/* SELLER */}
          <div className="chart-party-card seller">
            <div className="chart-party-header">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <line x1="20" y1="8" x2="20" y2="14" />
                <line x1="23" y1="11" x2="17" y2="11" />
              </svg>
              Seller / Vendor
            </div>
            <div className="chart-party-name">{seller?.name || 'Unknown Seller'}</div>
            {seller?.relation && <div className="chart-party-detail">{seller.relation}</div>}
            {seller?.address && <div className="chart-party-detail" style={{ marginTop: '8px' }}>{seller.address}</div>}
          </div>

          {/* TRANSACTION ARROW */}
          <div className="chart-transaction">
            <div className="chart-amount-badge">
              {saleAmount?.amount || 'Amount Not Found'}
            </div>
            <div className="chart-arrow-horizontal"></div>
            {date && <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '8px' }}>Date: {date}</div>}
          </div>

          {/* BUYER */}
          <div className="chart-party-card buyer">
            <div className="chart-party-header">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <polyline points="17 11 19 13 23 9" />
              </svg>
              Buyer / Purchaser
            </div>
            <div className="chart-party-name">{buyer?.name || 'Unknown Buyer'}</div>
            {buyer?.relation && <div className="chart-party-detail">{buyer.relation}</div>}
            {buyer?.address && <div className="chart-party-detail" style={{ marginTop: '8px' }}>{buyer.address}</div>}
          </div>
        </div>

        {/* PROPERTY DETAILS */}
        <div className="chart-node property">
          <div className="chart-connection-vertical"></div>
          <div className="chart-node-header">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            Property Transferred
          </div>
          
          {property?.fullAddress ? (
            <div className="chart-field" style={{ marginBottom: '16px' }}>
              <div className="chart-label">Address</div>
              <div className="chart-value">{property.fullAddress}</div>
            </div>
          ) : (
            <div className="chart-grid full" style={{ marginBottom: '16px' }}>
              <div className="chart-field">
                <div className="chart-label">Location</div>
                <div className="chart-value">
                  {property?.flatNo && `Flat/Plot: ${property.flatNo}`}
                  {property?.society && `, ${property.society}`}
                  {property?.district && `, ${property.district}`}
                  {!property?.flatNo && !property?.society && !property?.district && 'Not explicitly found'}
                </div>
              </div>
            </div>
          )}

          <div className="chart-grid">
            <div className="chart-field">
              <div className="chart-label">Built-up Area</div>
              <div className="chart-value">{property?.builtUpArea || property?.area || '—'}</div>
            </div>
            <div className="chart-field">
              <div className="chart-label">Carpet Area</div>
              <div className="chart-value">{property?.carpetArea || '—'}</div>
            </div>
          </div>
        </div>

        {/* REGISTRATION */}
        <div className="chart-node registration">
          <div className="chart-connection-vertical"></div>
          <div className="chart-node-header">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <path d="M16 13H8" />
              <path d="M16 17H8" />
              <path d="M10 9H8" />
            </svg>
            Registration Details
          </div>

          <div className="chart-grid">
            <div className="chart-field">
              <div className="chart-label">Registration No</div>
              <div className="chart-value">{registration?.registrationNo || '—'}</div>
            </div>
            <div className="chart-field">
              <div className="chart-label">Date</div>
              <div className="chart-value">{registration?.registrationDate || date || '—'}</div>
            </div>
            <div className="chart-field" style={{ gridColumn: '1 / -1', marginTop: '8px' }}>
              <div className="chart-label">Sub-Registrar Office</div>
              <div className="chart-value">{registration?.subRegistrar || '—'}</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
