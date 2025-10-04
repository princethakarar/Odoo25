import { useState } from 'react';
import './EmployeeDashboard.css';

const EmployeeDashboard = ({ onLogout, currentUser, onNavigateToExpenseManagement, onNavigateToNewExpense }) => {
  const [showProfile, setShowProfile] = useState(false);

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      onLogout();
    }
  };

  const handleProfileToggle = () => {
    setShowProfile(!showProfile);
  };

  return (
    <div className="employee-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-left">
          <h1>Employee Dashboard</h1>
          <p className="welcome-text">Welcome back, {currentUser?.name || 'Employee'}!</p>
        </div>
        <div className="header-right">
          <button className="profile-btn" onClick={handleProfileToggle}>
            👤 Profile
          </button>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      {/* Profile Dropdown */}
      {showProfile && (
        <div className="profile-dropdown">
          <div className="profile-info">
            <h3>Profile Information</h3>
            <p><strong>Name:</strong> {currentUser?.name || 'N/A'}</p>
            <p><strong>Email:</strong> {currentUser?.email || 'N/A'}</p>
            <p><strong>Role:</strong> {currentUser?.role || 'N/A'}</p>
            <p><strong>Company:</strong> {currentUser?.companyId?.name || 'N/A'}</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="dashboard-content">
        {/* Quick Stats */}
        <div className="stats-section">
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <h3>My Expenses</h3>
              <p>Manage your expense reports</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📝</div>
            <div className="stat-content">
              <h3>Submit Expense</h3>
              <p>Create new expense reports</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📋</div>
            <div className="stat-content">
              <h3>Expense History</h3>
              <p>View past submissions</p>
            </div>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="navigation-section">
          <h2>Quick Actions</h2>
          <div className="action-buttons">
            <button 
              className="primary-action-btn"
              onClick={onNavigateToExpenseManagement}
            >
              📊 Expense Management
            </button>
            <button 
              className="secondary-action-btn"
              onClick={onNavigateToNewExpense}
            >
              📝 Submit New Expense
            </button>
            <button className="secondary-action-btn">
              📋 View My Reports
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="recent-activity">
          <h2>Recent Activity</h2>
          <div className="activity-list">
            <div className="activity-item">
              <div className="activity-icon">✅</div>
              <div className="activity-content">
                <p>Expense report approved</p>
                <span className="activity-time">2 hours ago</span>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-icon">📝</div>
              <div className="activity-content">
                <p>New expense submitted</p>
                <span className="activity-time">1 day ago</span>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-icon">⏳</div>
              <div className="activity-content">
                <p>Expense pending approval</p>
                <span className="activity-time">3 days ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
