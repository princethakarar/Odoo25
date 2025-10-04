import React, { useState, useEffect } from 'react';
import './NewExpense.css';

const NewExpense = ({ currentUser, onBackToDashboard }) => {
  const [formData, setFormData] = useState({
    description: '',
    category: '',
    amount: '',
    currency: 'USD',
    expenseDate: '',
    paidBy: '',
    remarks: '',
    receiptFile: null
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const categories = [
    'Travel', 'Food', 'Transport', 'Office Supplies', 'Accommodation', 
    'Entertainment', 'Training', 'Communication', 'Other'
  ];

  const currencies = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFormData(prev => ({
      ...prev,
      receiptFile: file
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    if (!formData.amount || isNaN(formData.amount) || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Valid amount is required';
    }

    if (!formData.expenseDate) {
      newErrors.expenseDate = 'Expense date is required';
    }

    if (!formData.paidBy.trim()) {
      newErrors.paidBy = 'Paid by field is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Create form data for file upload
      const submitData = new FormData();
      submitData.append('userId', currentUser.id);
      submitData.append('companyId', currentUser.companyId._id || currentUser.companyId);
      submitData.append('description', formData.description);
      submitData.append('category', formData.category);
      submitData.append('amount', parseFloat(formData.amount));
      submitData.append('currency', formData.currency);
      submitData.append('convertedAmount', parseFloat(formData.amount)); // Will be calculated on backend
      submitData.append('date', formData.expenseDate);
      submitData.append('remarks', formData.remarks);
      
      if (formData.receiptFile) {
        submitData.append('receipt', formData.receiptFile);
      }

      const response = await fetch('http://localhost:5000/api/expenses', {
        method: 'POST',
        body: submitData
      });

      const data = await response.json();

      if (data.success) {
        setIsSubmitted(true);
      } else {
        alert(data.message || 'Failed to submit expense');
      }
    } catch (error) {
      console.error('Error submitting expense:', error);
      alert('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount, currency) => {
    const currencyInfo = currencies.find(c => c.code === currency);
    return `${amount} ${currencyInfo?.symbol || '$'}`;
  };

  if (isSubmitted) {
    return (
      <div className="new-expense">
        <div className="expense-form-container">
          <div className="form-header">
            <button className="back-btn" onClick={onBackToDashboard}>
              ← Back to Employee Dashboard
            </button>
            <div className="status-indicator">
              <span className="status-text">Draft → Waiting approval → Approved</span>
            </div>
          </div>

          <div className="submission-success">
            <h2>✅ Expense Submitted Successfully!</h2>
            <p>Your expense has been submitted and is now pending approval.</p>
            
            <div className="submitted-details">
              <h3>Submitted Details:</h3>
              <p><strong>Description:</strong> {formData.description}</p>
              <p><strong>Amount:</strong> {formatCurrency(formData.amount, formData.currency)}</p>
              <p><strong>Category:</strong> {formData.category}</p>
              <p><strong>Date:</strong> {formData.expenseDate}</p>
            </div>

           
            <div className="post-submission-note">
              <p>
                <strong>Note:</strong> Once submitted, the record becomes readonly for employee and the submit button becomes invisible. 
                The state is now pending approval.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="new-expense">
      <div className="expense-form-container">
        <div className="form-header">
          <button className="back-btn" onClick={onBackToDashboard}>
            ← Back to Employee Dashboard
          </button>
          <div className="status-indicator">
            <span className="status-text">Draft → Waiting approval → Approved</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="expense-form">
          <div className="form-row">
            <div className="form-column">
              <div className="form-group">
                <label htmlFor="description">Description</label>
                <input
                  type="text"
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className={errors.description ? 'error' : ''}
                  placeholder="Enter expense description"
                />
                {errors.description && <span className="error-message">{errors.description}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="category">Category</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className={errors.category ? 'error' : ''}
                >
                  <option value="">Select Category</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                {errors.category && <span className="error-message">{errors.category}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="amount">Total amount in currency selection</label>
                <div className="amount-input-group">
                  <input
                    type="number"
                    id="amount"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    className={`amount-input ${errors.amount ? 'error' : ''}`}
                    placeholder="567"
                    step="0.01"
                    min="0"
                  />
                  <select
                    name="currency"
                    value={formData.currency}
                    onChange={handleInputChange}
                    className="currency-select"
                  >
                    {currencies.map(currency => (
                      <option key={currency.code} value={currency.code}>
                        {currency.symbol} {currency.code}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.amount && <span className="error-message">{errors.amount}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="description2">Description</label>
                <input
                  type="text"
                  id="description2"
                  name="description2"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Additional description"
                />
              </div>
            </div>

            <div className="form-column">
              <div className="form-group">
                <label htmlFor="expenseDate">Expense Date</label>
                <input
                  type="date"
                  id="expenseDate"
                  name="expenseDate"
                  value={formData.expenseDate}
                  onChange={handleInputChange}
                  className={errors.expenseDate ? 'error' : ''}
                />
                {errors.expenseDate && <span className="error-message">{errors.expenseDate}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="paidBy">Paid by:</label>
                <select
                  id="paidBy"
                  name="paidBy"
                  value={formData.paidBy}
                  onChange={handleInputChange}
                  className={errors.paidBy ? 'error' : ''}
                >
                  <option value="">Select who paid</option>
                  <option value={currentUser?.name || 'Employee'}>
                    {currentUser?.name || 'Employee'}
                  </option>
                  <option value="Company">Company</option>
                  <option value="Other">Other</option>
                </select>
                {errors.paidBy && <span className="error-message">{errors.paidBy}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="remarks">Remarks</label>
                <input
                  type="text"
                  id="remarks"
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleInputChange}
                  placeholder="Additional remarks"
                />
              </div>
            </div>
          </div>

          <div className="receipt-section">
            <label htmlFor="receipt" className="receipt-label">
              Attach Receipt
            </label>
            <div className="file-upload-area" onClick={() => document.getElementById('receipt').click()}>
              <input
                type="file"
                id="receipt"
                name="receipt"
                onChange={handleFileChange}
                accept="image/*,.pdf"
                className="receipt-input"
              />
              <div className="file-upload-content">
                <div className="file-upload-icon">📎</div>
                <div className="file-upload-text">
                  {formData.receiptFile ? formData.receiptFile.name : 'Click to attach receipt'}
                </div>
                <div className="file-upload-hint">Supports: JPG, PNG, PDF (Max 5MB)</div>
              </div>
            </div>
          </div>

          <div className="currency-info">
            <div className="info-note">
              <p>
                <strong>Employee can submit expense in any currency</strong> (currency in which he spent the money in receipt)
              </p>
            </div>
            <div className="info-note">
              <p>
                <strong>In manager's approval dashboard, the amount should get auto-converted to base currency of the company</strong> with real-time today's currency conversion rates.
              </p>
            </div>
          </div>


          <div className="form-actions">
            <button 
              type="submit" 
              className="submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>

          <div className="post-submission-info">
            <p>
              <strong>Once submitted</strong> the record should become readonly for employee and the submit button should be invisible and state should be pending approval.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewExpense;
