import React, { useState } from 'react';
import { User, Mail, Briefcase, Building, Gavel, CheckCircle2 } from 'lucide-react';
import './MyProfile.css';

export default function MyProfile({ profileData, setProfileData }) {
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="my-profile-container">
      <h2 className="my-profile-title">My Profile</h2>

      <div className="my-profile-main-card">
        <div className="my-profile-left">
          <div className="my-profile-avatar">
            <div className="avatar-placeholder"></div>
          </div>
          <h3 className="my-profile-name">{profileData.fullName}</h3>
        </div>

        <div className="my-profile-right">
          {isEditing ? (
            <div className="edit-actions">
              <button className="edit-profile-btn" onClick={() => setIsEditing(false)}>Save Changes</button>
            </div>
          ) : (
            <button className="edit-profile-btn" onClick={() => setIsEditing(true)}>Edit Profile</button>
          )}
          
          <div className="profile-details-list">
            <div className="profile-detail-item">
              <div className="detail-icon"><User size={18} /></div>
              <div className="detail-text">
                <span className="detail-label">Full Name</span>
                {isEditing ? (
                  <input 
                    type="text" 
                    name="fullName" 
                    value={profileData.fullName} 
                    onChange={handleChange} 
                    className="profile-input"
                  />
                ) : (
                  <span className="detail-value">{profileData.fullName}</span>
                )}
              </div>
            </div>

            <div className="profile-detail-item">
              <div className="detail-icon"><Mail size={18} /></div>
              <div className="detail-text">
                <span className="detail-label">Professional Email</span>
                {isEditing ? (
                  <input 
                    type="email" 
                    name="email" 
                    value={profileData.email} 
                    onChange={handleChange} 
                    className="profile-input"
                  />
                ) : (
                  <span className="detail-value">{profileData.email}</span>
                )}
              </div>
            </div>

            <div className="profile-detail-item">
              <div className="detail-icon"><Briefcase size={18} /></div>
              <div className="detail-text">
                <span className="detail-label">Professional Role</span>
                {isEditing ? (
                  <select 
                    name="role" 
                    value={profileData.role} 
                    onChange={handleChange} 
                    className="profile-input"
                  >
                    <option value="" disabled>Select Professional Role</option>
                    <option value="Lawyer">Lawyer</option>
                    <option value="Paralegal">Paralegal</option>
                    <option value="Firm Administrator">Firm Administrator</option>
                    <option value="Other Legal Professional">Other Legal Professional</option>
                  </select>
                ) : (
                  <span className="detail-value">{profileData.role}</span>
                )}
              </div>
            </div>

            <div className="profile-detail-item">
              <div className="detail-icon"><Building size={18} /></div>
              <div className="detail-text">
                <span className="detail-label">Company / Firm Name</span>
                {isEditing ? (
                  <input 
                    type="text" 
                    name="company" 
                    value={profileData.company} 
                    onChange={handleChange} 
                    className="profile-input"
                  />
                ) : (
                  <span className="detail-value">{profileData.company}</span>
                )}
              </div>
            </div>

            <div className="profile-detail-item">
              <div className="detail-icon"><Gavel size={18} /></div>
              <div className="detail-text">
                <span className="detail-label">Area of Practice</span>
                {isEditing ? (
                  <select 
                    name="practiceArea" 
                    value={profileData.practiceArea} 
                    onChange={handleChange} 
                    className="profile-input"
                  >
                    <option value="" disabled>Select Area of Practice</option>
                    <option value="Property & Real Estate Law">Property & Real Estate Law</option>
                    <option value="Corporate & Commercial Law">Corporate & Commercial Law</option>
                    <option value="Criminal Law">Criminal Law</option>
                    <option value="Family Law">Family Law</option>
                    <option value="Constitutional Law">Constitutional Law</option>
                    <option value="Labour & Employment Law">Labour & Employment Law</option>
                    <option value="Intellectual Property">Intellectual Property</option>
                    <option value="Taxation Law">Taxation Law</option>
                    <option value="Civil Litigation">Civil Litigation</option>
                    <option value="Other">Other</option>
                  </select>
                ) : (
                  <span className="detail-value">{profileData.practiceArea}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="my-profile-bottom-cards">
        <div className="profile-bottom-card">
          <h4 className="bottom-card-title">Account Status</h4>
          <div className="account-status-content">
            <CheckCircle2 size={24} className="status-icon" />
            <span className="status-text">Active - Standard Tier<br/>(since it's a new account)</span>
          </div>
        </div>

        <div className="profile-bottom-card">
          <h4 className="bottom-card-title">Security &amp; Login</h4>
          <button className="change-password-btn">Change Password</button>
          <div className="two-factor-toggle">
            <span className="toggle-label">Enable 2-Factor Authentication</span>
            <div 
              className={`toggle-track ${is2FAEnabled ? 'active' : ''}`}
              onClick={() => setIs2FAEnabled(!is2FAEnabled)}
            >
              <div className="toggle-knob"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
