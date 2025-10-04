import React, { useState, useEffect } from 'react';
import './ManagerView.css';

const ManagerView = ({ currentUser }) => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [processingExpense, setProcessingExpense] = useState(null);
  const [message, setMessage] = useState('');
  const [creatingSample, setCreatingSample] = useState(false);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      // Fetch pending approvals for the current manager
      const response = await fetch(`http://localhost:5000/api/expenses/manager/${currentUser.id}/pending`);
      const data = await response.json();
      if (data.success) {
        setExpenses(data.expenses);
        console.log('Fetched pending approvals:', data.expenses);
        console.log('Workflow stats:', {
          totalWorkflows: data.totalWorkflows,
          totalExpenses: data.totalExpenses,
          pendingForManager: data.pendingForManager
        });
        if (data.message) {
          setMessage(data.message);
        }
      } else {
        setMessage('Error fetching expenses: ' + data.message);
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
      setMessage('Error fetching expenses: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (approvalRequestId, expenseId) => {
    setProcessingExpense(approvalRequestId || expenseId);
    try {
      let response;
      
      if (approvalRequestId) {
        // Workflow-based approval
        response = await fetch(`http://localhost:5000/api/expenses/approve/${approvalRequestId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            comment: 'Approved by manager'
          })
        });
      } else {
        // Direct company expense approval
        response = await fetch(`http://localhost:5000/api/expenses/approve-direct/${expenseId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            managerId: currentUser.id,
            comment: 'Approved by manager'
          })
        });
      }

      const data = await response.json();
      if (data.success) {
        setMessage(`Expense approved! ${data.message}`);
        // Refresh the expenses list
        fetchExpenses();
      } else {
        setMessage('Error approving expense: ' + data.message);
      }
    } catch (error) {
      setMessage('Error approving expense: ' + error.message);
    } finally {
      setProcessingExpense(null);
    }
  };

  const handleReject = async (approvalRequestId, expenseId) => {
    setProcessingExpense(approvalRequestId || expenseId);
    try {
      let response;
      
      if (approvalRequestId) {
        // Workflow-based rejection
        response = await fetch(`http://localhost:5000/api/expenses/reject/${approvalRequestId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            comment: 'Rejected by manager'
          })
        });
      } else {
        // Direct company expense rejection
        response = await fetch(`http://localhost:5000/api/expenses/reject-direct/${expenseId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            managerId: currentUser.id,
            comment: 'Rejected by manager'
          })
        });
      }

      const data = await response.json();
      if (data.success) {
        setMessage(`Expense rejected! ${data.message}`);
        // Refresh the expenses list
        fetchExpenses();
      } else {
        setMessage('Error rejecting expense: ' + data.message);
      }
    } catch (error) {
      setMessage('Error rejecting expense: ' + error.message);
    } finally {
      setProcessingExpense(null);
    }
  };

  const createSampleExpenses = async () => {
    setCreatingSample(true);
    try {
      const response = await fetch('http://localhost:5000/api/expenses/create-sample', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUser.id,
          companyId: currentUser.companyId?._id || currentUser.companyId
        })
      });

      const data = await response.json();
      if (data.success) {
        setMessage('Sample expenses created successfully!');
        // Refresh the expenses list
        fetchExpenses();
      } else {
        setMessage('Error creating sample expenses: ' + data.message);
      }
    } catch (error) {
      setMessage('Error creating sample expenses: ' + error.message);
    } finally {
      setCreatingSample(false);
    }
  };

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.userId.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || expense.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const formatAmount = (expense) => {
    const companyCurrency = expense.companyId?.currency || 'USD';
    return `${expense.amount} ${expense.currency} (in ${companyCurrency}) = ${expense.convertedAmount}`;
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'approved': return 'status-approved';
      case 'rejected': return 'status-rejected';
      case 'pending': return 'status-pending';
      default: return 'status-pending';
    }
  };

  return (
    <div className="manager-view">
      <div className="manager-container">
        <h2>Manager's View</h2>
        
        <div className="approvals-panel">
          <h3>Approvals to review</h3>
          
          {/* Search and Filter Controls */}
          <div className="controls">
            <input
              type="text"
              placeholder="Search expenses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="status-filter"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <button
              onClick={createSampleExpenses}
              disabled={creatingSample}
              className="create-sample-btn"
            >
              {creatingSample ? 'Creating...' : 'Create Sample Expenses'}
            </button>
          </div>


          {/* Approvals Table */}
          <div className="table-container">
            <table className="approvals-table">
              <thead>
                <tr>
                  <th>Approval Subject</th>
                  <th>Request Owner</th>
                  <th>Category</th>
                  <th>Request Status</th>
                  <th>Total amount (in company's currency)</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" className="loading-cell">
                      Loading expenses...
                    </td>
                  </tr>
                ) : filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="empty-cell">
                      No expenses found
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map(expense => (
                    <tr key={expense._id} className={expense.status !== 'pending' ? 'readonly-row' : ''}>
                      <td className="subject-cell">
                        {expense.description || 'none'}
                      </td>
                      <td className="owner-cell">
                        {expense.userId?.name || 'Unknown'}
                      </td>
                      <td className="category-cell">
                        {expense.category}
                      </td>
                      <td className="status-cell">
                        <span className={`status-badge ${getStatusBadgeClass(expense.status)}`}>
                          {expense.status.charAt(0).toUpperCase() + expense.status.slice(1)}
                        </span>
                      </td>
                      <td className="amount-cell">
                        {formatAmount(expense)}
                      </td>
                      <td className="date-cell">
                        {new Date(expense.date).toLocaleDateString()}
                      </td>
                      <td className="actions-cell">
                        {expense.status === 'pending' ? (
                          <div className="action-buttons">
                            <button
                              className="approve-btn"
                              onClick={() => handleApprove(expense.approvalRequestId, expense._id)}
                              disabled={processingExpense === (expense.approvalRequestId || expense._id)}
                            >
                              {processingExpense === (expense.approvalRequestId || expense._id) ? 'Processing...' : 'Approve'}
                            </button>
                            <button
                              className="reject-btn"
                              onClick={() => handleReject(expense.approvalRequestId, expense._id)}
                              disabled={processingExpense === (expense.approvalRequestId || expense._id)}
                            >
                              {processingExpense === (expense.approvalRequestId || expense._id) ? 'Processing...' : 'Reject'}
                            </button>
                            {expense.isRequired && (
                              <span className="required-badge">Required</span>
                            )}
                            {expense.isDirectCompanyExpense && (
                              <span className="company-badge">Company</span>
                            )}
                            <div className="workflow-info">
                              <small>Seq: {expense.sequence} | {expense.workflowType}</small>
                              {expense.minimumApprovalPercentage && (
                                <small>Min: {expense.minimumApprovalPercentage}%</small>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="no-actions">No actions available</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerView;
