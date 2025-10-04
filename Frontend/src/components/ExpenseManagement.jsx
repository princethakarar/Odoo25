import React, { useState, useEffect } from 'react';
import './ExpenseManagement.css';

const ExpenseManagement = ({ currentUser }) => {
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState({
    toSubmit: { count: 0, total: 0 },
    waitingApproval: { count: 0, total: 0 },
    approved: { count: 0, total: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch expenses and summary data
  useEffect(() => {
    if (currentUser && currentUser.id) {
      fetchExpenses();
      fetchSummary();
    }
  }, [currentUser]);

  const fetchExpenses = async () => {
    try {
      if (!currentUser || !currentUser.id) {
        setError('User not authenticated');
        return;
      }
      
      const response = await fetch(`http://localhost:5000/api/expenses/user/${currentUser.id}`);
      const data = await response.json();
      
      if (data.success) {
        setExpenses(data.expenses);
      } else {
        setError('Failed to fetch expenses');
      }
    } catch (err) {
      setError('Error fetching expenses: ' + err.message);
    }
  };

  const fetchSummary = async () => {
    try {
      if (!currentUser || !currentUser.id) {
        setLoading(false);
        return;
      }
      
      console.log('Fetching summary data for user:', currentUser.id);
      const response = await fetch(`http://localhost:5000/api/expenses/summary/user/${currentUser.id}`);
      const data = await response.json();
      
      console.log('Summary API response:', data);
      
      if (data.success) {
        setSummary(data.summary);
        console.log('Summary data set:', data.summary);
      } else {
        console.error('Summary API error:', data.message);
      }
    } catch (err) {
      console.error('Error fetching summary:', err);
    } finally {
      setLoading(false);
    }
  };


  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'pending': { text: 'PENDING', class: 'status-draft' },
      'submitted': { text: 'SUBMITTED', class: 'status-submitted' },
      'approved': { text: 'APPROVED', class: 'status-approved' },
      'rejected': { text: 'REJECTED', class: 'status-rejected' }
    };
    
    const statusInfo = statusMap[status] || { text: status.toUpperCase(), class: 'status-default' };
    return <span className={`status-badge ${statusInfo.class}`}>{statusInfo.text}</span>;
  };

  if (loading) {
    return <div className="loading">Loading expenses...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  return (
    <div className="expense-management">
      {/* Instructions */}
      <div className="instructions-section">
        <div className="instructions-text">
          User should be able to upload a receipt from his computer Or take a photo of the receipt, 
          using OCR a new expense should get created with total amount and other necessary details.
        </div>
      </div>

      {/* Expense Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card to-submit">
          <div className="card-amount">{formatCurrency(summary.toSubmit.total)}</div>
          <div className="card-label">To submit</div>
          <div className="card-description">
            The expenses which are still in draft state and not submitted by employee are in to submit stage.
          </div>
        </div>
        
        <div className="summary-card waiting-approval">
          <div className="card-amount">{formatCurrency(summary.waitingApproval.total)}</div>
          <div className="card-label">Waiting approval</div>
          <div className="card-description">
            Expenses which are submitted by employee but not finally approved by matching approval rules.
          </div>
        </div>
        
        <div className="summary-card approved">
          <div className="card-amount">{formatCurrency(summary.approved.total)}</div>
          <div className="card-label">Approved</div>
          <div className="card-description">
            Approved according to approval rule.
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="expenses-table-container">
        <table className="expenses-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Description</th>
              <th>Date</th>
              <th>Category</th>
              <th>Paid By</th>
              <th>Remarks</th>
              <th>Amount</th>
              <th>Receipt</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {expenses.length === 0 ? (
              <tr>
                <td colSpan="9" className="no-data">No expenses found</td>
              </tr>
            ) : (
              expenses.map((expense) => (
                <tr key={expense._id}>
                  <td>{expense.userId?.name || 'N/A'}</td>
                  <td>{expense.description}</td>
                  <td>{formatDate(expense.date)}</td>
                  <td>{expense.category}</td>
                  <td>{expense.userId?.name || 'N/A'}</td>
                  <td>None</td>
                  <td>{formatCurrency(expense.convertedAmount)}</td>
                  <td>
                    {expense.receiptUrl ? (
                      <a 
                        href={`http://localhost:5000${expense.receiptUrl}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="receipt-link"
                        onClick={(e) => {
                          console.log('Opening receipt:', `http://localhost:5000${expense.receiptUrl}`);
                        }}
                      >
                        View Receipt
                      </a>
                    ) : (
                      'No Receipt'
                    )}
                  </td>
                  <td>{getStatusBadge(expense.status)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ExpenseManagement;
