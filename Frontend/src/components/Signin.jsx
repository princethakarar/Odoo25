import { useState } from 'react';
import './Auth.css';

const Signin = ({ onSwitchToSignup, onLogin }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
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

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      try {
        const response = await fetch('http://localhost:5000/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password
          })
        });

        const data = await response.json();

        if (data.success) {
          console.log('Login successful:', data.user);
          alert('Login successful!');
          onLogin(data.user); // Navigate to dashboard with user data
        } else {
          alert(data.message || 'Invalid email or password. Please try again.');
        }
      } catch (error) {
        console.error('Login error:', error);
        alert('Network error. Please check if the backend server is running.');
      }
    }
  };

  const handleForgotPassword = () => {
    // Handle forgot password logic here
    alert('Forgot password functionality will be implemented');
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">SignIn Page</h1>
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={errors.email ? 'error' : ''}
              placeholder="Enter your email"
            />
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={errors.password ? 'error' : ''}
              placeholder="Enter your password"
            />
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>

          <button type="submit" className="auth-button">
            Login
          </button>
        </form>

        <div className="auth-switch">
          <p>Don't have an account? <span className="link" onClick={onSwitchToSignup}>Signup</span></p>
          <p className="forgot-password">
            <span className="link" onClick={handleForgotPassword}>Forgot password?</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signin;
