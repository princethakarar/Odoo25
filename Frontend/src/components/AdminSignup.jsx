import { useState, useEffect } from 'react';
import './Auth.css';

const AdminSignup = ({ onSwitchToSignin }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    country: ''
  });
  const [errors, setErrors] = useState({});
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch countries from REST Countries API
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await fetch('https://restcountries.com/v3.1/all?fields=name,currencies');
        if (!response.ok) {
          throw new Error('Failed to fetch countries');
        }
        const data = await response.json();
        
        // Sort countries alphabetically by name
        const sortedCountries = data
          .map(country => ({
            name: country.name.common,
            currencies: country.currencies
          }))
          .sort((a, b) => a.name.localeCompare(b.name));
        
        setCountries(sortedCountries);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching countries:', error);
        // Fallback to a few common countries if API fails
        setCountries([
          { name: 'United States', currencies: { USD: { name: 'US Dollar' } } },
          { name: 'Canada', currencies: { CAD: { name: 'Canadian Dollar' } } },
          { name: 'United Kingdom', currencies: { GBP: { name: 'British Pound' } } },
          { name: 'Germany', currencies: { EUR: { name: 'Euro' } } },
          { name: 'France', currencies: { EUR: { name: 'Euro' } } },
          { name: 'Australia', currencies: { AUD: { name: 'Australian Dollar' } } },
          { name: 'Japan', currencies: { JPY: { name: 'Japanese Yen' } } },
          { name: 'India', currencies: { INR: { name: 'Indian Rupee' } } }
        ]);
        setLoading(false);
      }
    };

    fetchCountries();
  }, []);

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

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.country) {
      newErrors.country = 'Please select a country';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      // Handle signup logic here
      const selectedCountry = countries.find(country => country.name === formData.country);
      const currencyInfo = selectedCountry ? Object.values(selectedCountry.currencies)[0] : null;
      
      console.log('Signup data:', {
        ...formData,
        currency: currencyInfo ? currencyInfo.name : 'N/A'
      });
      alert('Admin signup successful!');
    }
  };

  // Get selected country info for display
  const selectedCountry = countries.find(country => country.name === formData.country);
  const currencyInfo = selectedCountry ? Object.values(selectedCountry.currencies)[0] : null;

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">SignUp Page</h1>
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={errors.name ? 'error' : ''}
              placeholder="Enter your name"
            />
            {errors.name && <span className="error-message">{errors.name}</span>}
          </div>

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

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={errors.confirmPassword ? 'error' : ''}
              placeholder="Confirm your password"
            />
            {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="country">Country selection</label>
            <div className="select-wrapper">
              <select
                id="country"
                name="country"
                value={formData.country}
                onChange={handleChange}
                className={errors.country ? 'error' : ''}
                disabled={loading}
              >
                <option value="">Select Country</option>
                {countries.map((country, index) => (
                  <option key={index} value={country.name}>
                    {country.name}
                  </option>
                ))}
              </select>
              {loading && <div className="select-loading">Loading countries...</div>}
            </div>
            {errors.country && <span className="error-message">{errors.country}</span>}
            {formData.country && currencyInfo && (
              <div className="country-info">
                <small>Currency: {currencyInfo.name}</small>
              </div>
            )}
          </div>

          <button type="submit" className="auth-button">
            Signup
          </button>
        </form>

        <div className="auth-switch">
          <p>Already have an account? <span className="link" onClick={onSwitchToSignin}>Signin</span></p>
        </div>
      </div>
    </div>
  );
};

export default AdminSignup;
