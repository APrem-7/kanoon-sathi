import React from 'react';
import { Clock, Star, FileText, Calendar, Plus, Briefcase, AlertTriangle, CheckCircle } from 'lucide-react';
import './MyCases.css';

export default function MyCases({ userName }) {
  const MOCK_CASES = [
    { id: 'C-2023-01', name: 'Land Dispute - Sy No. 120', client: 'Ramesh Reddy', status: 'In Progress', deadline: '10/12/2023', priority: 'High' },
    { id: 'C-2023-02', name: 'Property Registration - JP Nagar', client: 'Suresh Kumar', status: 'On Hold', deadline: '05/12/2023', priority: 'Medium' },
    { id: 'C-2023-03', name: 'Tenant Eviction - Indiranagar', client: 'Anita Sharma', status: 'In Progress', deadline: '08/12/2023', priority: 'Low' },
    { id: 'C-2023-04', name: 'Title Search - Whitefield Plot', client: 'Builders Inc', status: 'Completed', deadline: '12/10/2023', priority: 'Low' },
    { id: 'C-2023-05', name: 'Khata Transfer Appeal', client: 'Govind Rao', status: 'In Progress', deadline: '05/05/2023', priority: 'High' },
  ];

  return (
    <div className="my-cases-container animate-fadeIn">
      <div className="cases-header">
        <div>
          <h2 className="cases-title">My Cases</h2>
          <p className="cases-greeting">Hi, {userName || 'User'}</p>
        </div>
        <button className="add-case-btn">
          <Plus size={16} /> Add Cases
        </button>
      </div>

      <div className="cases-grid">
        {/* Left Column: Stats */}
        <div className="cases-stats-column">
          <div className="stat-card stat-blue">
            <span className="stat-label">Total Active Cases</span>
            <div className="stat-value-row">
              <span className="stat-value">45</span>
              <Briefcase size={20} className="stat-icon" />
            </div>
          </div>
          <div className="stat-card stat-amber">
            <span className="stat-label">Due This Week</span>
            <div className="stat-value-row">
              <span className="stat-value">12</span>
              <Calendar size={20} className="stat-icon" />
            </div>
          </div>
          <div className="stat-card stat-peach">
            <span className="stat-label">Overdue</span>
            <div className="stat-value-row">
              <span className="stat-value">3</span>
              <AlertTriangle size={20} className="stat-icon" />
            </div>
          </div>
          <div className="stat-card stat-green">
            <span className="stat-label">Completed (Last 30 Days)</span>
            <div className="stat-value-row">
              <span className="stat-value">8</span>
              <CheckCircle size={20} className="stat-icon" />
            </div>
          </div>
        </div>

        {/* Middle Column: Table */}
        <div className="cases-table-column">
          <div className="cases-table-card">
            <div className="table-header-row">
              <h3 className="table-card-title">Current Cases</h3>
              <select className="table-filter-select">
                <option>All Deadline</option>
              </select>
            </div>
            
            <div className="table-responsive">
              <table className="cases-table">
                <thead>
                  <tr>
                    <th>Case ID</th>
                    <th>Case Name/Title</th>
                    <th>Client</th>
                    <th>Status</th>
                    <th>Next Deadline</th>
                    <th>Priority</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_CASES.map((c) => (
                    <tr key={c.id}>
                      <td className="col-id">{c.id}</td>
                      <td className="col-name">{c.name}</td>
                      <td className="col-client">{c.client}</td>
                      <td className="col-status">
                        <span className={`status-pill status-${c.status.replace(' ', '').toLowerCase()}`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="col-deadline">
                        <Clock size={12} className="deadline-icon"/> {c.deadline}
                      </td>
                      <td className="col-priority">
                        <Star size={12} className={`priority-icon p-${c.priority.toLowerCase()}`}/> {c.priority}
                      </td>
                      <td className="col-actions">
                        <button className="action-link">Edit</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Widgets */}
        <div className="cases-widgets-column">
          <div className="widget-card calendar-widget">
            <div className="calendar-header">
              <h3 className="widget-title">Current 2026</h3>
              <div className="cal-nav">
                <span className="cal-arrow">&lt;</span>
                <span className="cal-arrow">&gt;</span>
              </div>
            </div>
            <div className="calendar-grid">
              {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => <div key={d} className="cal-day-header">{d}</div>)}
              {/* Dummy calendar dates */}
              <div className="cal-date empty">27</div><div className="cal-date empty">28</div><div className="cal-date empty">29</div><div className="cal-date empty">30</div><div className="cal-date empty">31</div>
              {[...Array(25)].map((_, i) => (
                <div key={i} className={`cal-date ${i+1 === 5 ? 'active-date' : ''} ${i+1 === 10 || i+1 === 12 || i+1 === 13 || i+1 === 22 ? 'highlight-date' : ''}`}>{i+1}</div>
              ))}
            </div>
          </div>

          <div className="widget-card activity-widget">
            <h3 className="widget-title">Recent Activity Feed</h3>
            <div className="activity-feed">
              <div className="feed-item">
                <div className="feed-icon blue"><FileText size={12} /></div>
                <div className="feed-content">
                  <p className="feed-text">New document added to Case C-2023-01</p>
                  <span className="feed-time">7 months ago</span>
                </div>
              </div>
              <div className="feed-item">
                <div className="feed-icon amber"><Calendar size={12} /></div>
                <div className="feed-content">
                  <p className="feed-text">Meeting scheduled for Case C-2023-03</p>
                  <span className="feed-time">1 month ago</span>
                </div>
              </div>
              <div className="feed-item">
                <div className="feed-icon blue"><FileText size={12} /></div>
                <div className="feed-content">
                  <p className="feed-text">New document added to Case C-2023-01</p>
                  <span className="feed-time">1 month ago</span>
                </div>
              </div>
              <div className="feed-item">
                <div className="feed-icon blue"><Calendar size={12} /></div>
                <div className="feed-content">
                  <p className="feed-text">Meeting scheduled for Case C-2023-03</p>
                  <span className="feed-time">1 month ago</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
