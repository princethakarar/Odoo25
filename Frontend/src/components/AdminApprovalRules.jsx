import React, { useState, useEffect } from 'react';
import './AdminApprovalRules.css';

const AdminApprovalRules = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [approvalRule, setApprovalRule] = useState({
    description: '',
    managerId: '',
    isManagerApprover: true,
    approvers: [],
    approversSequence: false,
    minimumApprovalPercentage: null
  });
  const [availableApprovers, setAvailableApprovers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Fetch all users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Fetch approval rule when user is selected
  useEffect(() => {
    if (selectedUser) {
      fetchApprovalRule(selectedUser);
      fetchAvailableApprovers();
    }
  }, [selectedUser]);

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/users');
      const data = await response.json();
      if (data.success) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchApprovalRule = async (userId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/approval-rules/user/${userId}`);
      const data = await response.json();
      if (data.success) {
        setApprovalRule({
          description: data.rule.description || '',
          managerId: data.rule.managerId?._id || '',
          isManagerApprover: data.rule.isManagerApprover,
          approvers: data.rule.approvers || [],
          approversSequence: data.rule.approversSequence,
          minimumApprovalPercentage: data.rule.minimumApprovalPercentage
        });
      } else {
        // Reset form if no rule exists
        setApprovalRule({
          description: '',
          managerId: '',
          isManagerApprover: true,
          approvers: [],
          approversSequence: false,
          minimumApprovalPercentage: null
        });
      }
    } catch (error) {
      console.error('Error fetching approval rule:', error);
    }
  };

  const fetchAvailableApprovers = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/approval-rules/users/all');
      const data = await response.json();
      if (data.success) {
        setAvailableApprovers(data.users);
      }
    } catch (error) {
      console.error('Error fetching available approvers:', error);
    }
  };

  const handleUserChange = (e) => {
    setSelectedUser(e.target.value);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setApprovalRule(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleManagerChange = (e) => {
    setApprovalRule(prev => ({
      ...prev,
      managerId: e.target.value
    }));
  };

  const addApprover = () => {
    const newApprover = {
      userId: '',
      required: false,
      sequence: approvalRule.approvers.length
    };
    setApprovalRule(prev => ({
      ...prev,
      approvers: [...prev.approvers, newApprover]
    }));
  };

  const removeApprover = (index) => {
    setApprovalRule(prev => ({
      ...prev,
      approvers: prev.approvers.filter((_, i) => i !== index)
    }));
  };

  const handleApproverChange = (index, field, value) => {
    setApprovalRule(prev => ({
      ...prev,
      approvers: prev.approvers.map((approver, i) => 
        i === index ? { ...approver, [field]: value } : approver
      )
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Validate required fields
      if (!selectedUser) {
        setMessage('Please select a user');
        return;
      }

      if (!approvalRule.description.trim()) {
        setMessage('Please enter a description');
        return;
      }

      const selectedUserData = users.find(user => user._id === selectedUser);
      
      // Clean up the approvers array - remove empty entries
      const cleanApprovers = approvalRule.approvers.filter(approver => 
        approver.userId && approver.userId.trim() !== ''
      );

      const payload = {
        userId: selectedUser,
        description: approvalRule.description.trim(),
        managerId: approvalRule.managerId || null,
        isManagerApprover: approvalRule.isManagerApprover,
        approvers: cleanApprovers,
        approversSequence: approvalRule.approversSequence,
        minimumApprovalPercentage: approvalRule.minimumApprovalPercentage || null,
        companyId: selectedUserData?.companyId?._id || selectedUserData?.companyId
      };

      console.log('Sending approval workflow data:', payload);

      const response = await fetch('http://localhost:5000/api/approval-rules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      console.log('Response from server:', data);
      
      if (data.success) {
        setMessage('Approval workflow saved successfully!');
      } else {
        setMessage('Error saving approval workflow: ' + data.message);
      }
    } catch (error) {
      console.error('Error saving approval workflow:', error);
      setMessage('Error saving approval workflow: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-approval-rules">
      <div className="approval-rules-container">
        <h2>Admin View (Approval Rules)</h2>
        
        <form onSubmit={handleSubmit} className="approval-form">
          {/* User Selection */}
          <div className="form-group">
            <label htmlFor="user">User:</label>
            <select
              id="user"
              value={selectedUser}
              onChange={handleUserChange}
              required
            >
              <option value="">Select a user</option>
              {users.map(user => (
                <option key={user._id} value={user._id}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div className="form-group">
            <label htmlFor="description">Description about rules:</label>
            <input
              type="text"
              id="description"
              name="description"
              value={approvalRule.description}
              onChange={handleInputChange}
              placeholder="Approval rule for miscellaneous expenses"
              required
            />
          </div>

          {/* Manager Selection */}
          <div className="form-group">
            <label htmlFor="manager">Manager:</label>
            <select
              id="manager"
              value={approvalRule.managerId}
              onChange={handleManagerChange}
            >
              <option value="">Select a manager</option>
              {availableApprovers
                .filter(user => user.role === 'Manager' || user.role === 'Admin')
                .map(user => (
                  <option key={user._id} value={user._id}>
                    {user.name} ({user.email})
                  </option>
                ))}
            </select>
            <div className="help-text">
              Dynamic dropdown: Initially the manager set on user record should be set, admin can change manager for approval if required.
            </div>
          </div>

          {/* Is Manager an Approver */}
          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                name="isManagerApprover"
                checked={approvalRule.isManagerApprover}
                onChange={handleInputChange}
              />
              Is manager an approver?
            </label>
            <div className="help-text">
              If this field is checked then by default the approve request would go to his/her manager first, before going to other approvers.
            </div>
          </div>

          {/* Approvers Section */}
          <div className="approvers-section">
            <h3>Approvers</h3>
            
            {approvalRule.approvers.map((approver, index) => (
              <div key={index} className="approver-item">
                <div className="approver-user">
                  <label>User:</label>
                  <select
                    value={approver.userId}
                    onChange={(e) => handleApproverChange(index, 'userId', e.target.value)}
                  >
                    <option value="">Select approver</option>
                    {availableApprovers.map(user => (
                      <option key={user._id} value={user._id}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="approver-required">
                  <label>
                    <input
                      type="checkbox"
                      checked={approver.required}
                      onChange={(e) => handleApproverChange(index, 'required', e.target.checked)}
                    />
                    Required
                  </label>
                  <div className="help-text">
                    If this field is ticked, then anyhow approval of this approver is required in any approval combination scenarios.
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={() => removeApprover(index)}
                  className="remove-btn"
                >
                  Remove
                </button>
              </div>
            ))}
            
            <button
              type="button"
              onClick={addApprover}
              className="add-approver-btn"
            >
              Add Approver
            </button>
          </div>

          {/* Approvers Sequence */}
          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                name="approversSequence"
                checked={approvalRule.approversSequence}
                onChange={handleInputChange}
              />
              Approvers Sequence:
            </label>
            <div className="help-text">
              If this field is ticked true then the above mentioned sequence of approvers matters, that is first the request goes to John, if he approves/rejects then only request goes to mitchell and so on. If the required approver rejects the request, then expense request is auto-rejected. If not ticked then send approver request to all approvers at the same time.
            </div>
          </div>

          {/* Minimum Approval Percentage */}
          <div className="form-group">
            <label htmlFor="minimumApprovalPercentage">Minimum Approval percentage:</label>
            <div className="percentage-input">
              <input
                type="number"
                id="minimumApprovalPercentage"
                name="minimumApprovalPercentage"
                value={approvalRule.minimumApprovalPercentage || ''}
                onChange={handleInputChange}
                min="0"
                max="100"
                placeholder="Enter percentage"
              />
              <span>%</span>
            </div>
            <div className="help-text">
              Specify the number of percentage approvers required in order to get the request approved.
            </div>
          </div>

          {/* Submit Button */}
          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? 'Saving...' : 'Save Approval Rule'}
          </button>

          {/* Message Display */}
          {message && (
            <div className={`message ${message.includes('successfully') ? 'success' : 'error'}`}>
              {message}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default AdminApprovalRules;
