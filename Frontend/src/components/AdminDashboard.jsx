import { useState, useEffect } from 'react';
import './AdminDashboard.css';
import AdminApprovalRules from './AdminApprovalRules';
import ManagerView from './ManagerView';

const AdminDashboard = ({ onLogout, currentUser }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('users'); // 'users', 'approval-rules', or 'manager-view'
  const [canAccessManagerView, setCanAccessManagerView] = useState(false);

  const [showNewUserForm, setShowNewUserForm] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    role: '',
    manager: '',
    email: '',
    isApprover: false
  });
  const [errors, setErrors] = useState({});
  const [sendingPassword, setSendingPassword] = useState(null);

  const roles = ['Admin', 'Manager', 'Employee'];
  const managers = users.filter(user => user.role === 'Manager' || user.role === 'Admin');

  // Check if user can access manager view
  const checkManagerAccess = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/expenses/manager/${currentUser.id}/can-access`);
      const data = await response.json();
      
      if (data.success) {
        setCanAccessManagerView(data.canAccess);
      } else {
        console.error('Failed to check manager access:', data.message);
        setCanAccessManagerView(false);
      }
    } catch (error) {
      console.error('Error checking manager access:', error);
      setCanAccessManagerView(false);
    }
  };

  // Fetch users from database
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/auth/users');
        const data = await response.json();
        
        if (data.success) {
          setUsers(data.users);
        } else {
          console.error('Failed to fetch users:', data.message);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
    checkManagerAccess();
  }, [currentUser]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUser(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!newUser.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (users.some(user => user.name.toLowerCase() === newUser.name.toLowerCase())) {
      newErrors.name = 'User with this name already exists';
    }

    if (!newUser.role) {
      newErrors.role = 'Role is required';
    }

    if (!newUser.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(newUser.email)) {
      newErrors.email = 'Email is invalid';
    } else if (users.some(user => user.email.toLowerCase() === newUser.email.toLowerCase())) {
      newErrors.email = 'User with this email already exists';
    }

    if (newUser.role === 'Employee' && !newUser.manager) {
      newErrors.manager = 'Manager is required for employees';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      try {
        const response = await fetch('http://localhost:5000/api/auth/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        body: JSON.stringify({
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          managerId: newUser.manager || null,
          companyId: currentUser?.companyId?._id || currentUser?.companyId,
          isApprover: newUser.isApprover
        })
        });

        const data = await response.json();

        if (data.success) {
          setUsers(prev => [...prev, data.user]);
          setNewUser({ name: '', role: '', manager: '', email: '', isApprover: false });
          setShowNewUserForm(false);
          setErrors({});
          alert('User added successfully!');
        } else {
          alert(data.message || 'Failed to add user');
        }
      } catch (error) {
        console.error('Error adding user:', error);
        alert('Network error. Please try again.');
      }
    }
  };

  const handleSendPassword = async (userId) => {
    setSendingPassword(userId);
    
    try {
      const response = await fetch(`http://localhost:5000/api/auth/send-password/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();

      if (data.success) {
        alert('Password sent successfully to user email!');
      } else {
        alert(data.message || 'Failed to send password');
      }
    } catch (error) {
      console.error('Error sending password:', error);
      alert('Network error. Please try again.');
    } finally {
      setSendingPassword(null);
    }
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      onLogout();
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <div className="header-actions">
          <div className="nav-tabs">
            <button 
              className={`nav-tab ${currentView === 'users' ? 'active' : ''}`}
              onClick={() => setCurrentView('users')}
            >
              User Management
            </button>
            <button 
              className={`nav-tab ${currentView === 'approval-rules' ? 'active' : ''}`}
              onClick={() => setCurrentView('approval-rules')}
            >
              Approval Rules
            </button>
            {canAccessManagerView && (
              <button 
                className={`nav-tab ${currentView === 'manager-view' ? 'active' : ''}`}
                onClick={() => setCurrentView('manager-view')}
              >
                Manager's View
              </button>
            )}
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      <div className="dashboard-content">
        {currentView === 'users' && (
          <>
            <div className="table-header">
              <button 
                className="new-user-btn"
                onClick={() => setShowNewUserForm(true)}
              >
                New
              </button>
            </div>

        <div className="table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Manager</th>
                <th>Email</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>
                    Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>
                    No users found
                  </td>
                </tr>
              ) : (
                users.map(user => (
                  <tr key={user._id}>
                    <td>
                      <div className="user-cell">
                        <span className="user-name">{user.name}</span>
                        <span className="dropdown-arrow">▼</span>
                      </div>
                    </td>
                    <td>
                      <div className="role-cell">
                        <span className="role-name">{user.role}</span>
                        <span className="dropdown-arrow">▼</span>
                      </div>
                    </td>
                    <td>
                      <div className="manager-cell">
                        <span className="manager-name">
                          {user.managerId ? user.managerId.name : '-'}
                        </span>
                        {user.managerId && <span className="dropdown-arrow">▼</span>}
                      </div>
                    </td>
                    <td className="email-cell">{user.email}</td>
                    <td>
                      <span className={`status-badge ${user.status || 'active'}`}>
                        {user.status || 'active'}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="send-password-btn"
                        onClick={() => handleSendPassword(user._id)}
                        disabled={sendingPassword === user._id}
                      >
                        {sendingPassword === user._id ? 'Sending...' : 'Send password'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
          </>
        )}
        
        {currentView === 'approval-rules' && (
          <AdminApprovalRules />
        )}
        
        {currentView === 'manager-view' && (
          <ManagerView currentUser={currentUser} />
        )}
      </div>

      {/* New User Modal */}
      {showNewUserForm && (
        <div className="modal-overlay" onClick={() => setShowNewUserForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New User</h2>
              <button 
                className="close-btn"
                onClick={() => setShowNewUserForm(false)}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleAddUser} className="new-user-form">
              <div className="form-group">
                <label htmlFor="name">Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={newUser.name}
                  onChange={handleInputChange}
                  className={errors.name ? 'error' : ''}
                  placeholder="Enter user name"
                />
                {errors.name && <span className="error-message">{errors.name}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="role">Role</label>
                <select
                  id="role"
                  name="role"
                  value={newUser.role}
                  onChange={handleInputChange}
                  className={errors.role ? 'error' : ''}
                >
                  <option value="">Select Role</option>
                  {roles.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
                {errors.role && <span className="error-message">{errors.role}</span>}
              </div>

              {newUser.role === 'Employee' && (
                <div className="form-group">
                  <label htmlFor="manager">Manager</label>
                  <select
                    id="manager"
                    name="manager"
                    value={newUser.manager}
                    onChange={handleInputChange}
                    className={errors.manager ? 'error' : ''}
                  >
                    <option value="">Select Manager</option>
                    {managers.map(manager => (
                      <option key={manager._id} value={manager._id}>
                        {manager.name}
                      </option>
                    ))}
                  </select>
                  {errors.manager && <span className="error-message">{errors.manager}</span>}
                </div>
              )}

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={newUser.email}
                  onChange={handleInputChange}
                  className={errors.email ? 'error' : ''}
                  placeholder="Enter email address"
                />
                {errors.email && <span className="error-message">{errors.email}</span>}
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="isApprover"
                    checked={newUser.isApprover}
                    onChange={(e) => setNewUser(prev => ({
                      ...prev,
                      isApprover: e.target.checked
                    }))}
                  />
                  <span className="checkbox-text">Set as Approver</span>
                </label>
                <small className="checkbox-help">
                  Approvers can review and approve expenses in the Manager's View
                </small>
              </div>

              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowNewUserForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="add-user-btn">
                  Add User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
