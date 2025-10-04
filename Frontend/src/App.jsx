import { useState } from 'react';
import './App.css';
import AdminSignup from './components/AdminSignup';
import Signin from './components/Signin';
import AdminDashboard from './components/AdminDashboard';

function App() {
  // State to manage which page to show
  const [currentPage, setCurrentPage] = useState('signin'); // Default to signin page
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const switchToSignup = () => {
    setCurrentPage('signup');
  };

  const switchToSignin = () => {
    setCurrentPage('signin');
  };

  const handleLogin = (userData) => {
    setIsAuthenticated(true);
    setCurrentUser(userData);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setCurrentPage('signin');
  };

  const handleSignup = (userData) => {
    setIsAuthenticated(true);
    setCurrentUser(userData);
    setCurrentPage('dashboard');
  };

  return (
    <div className="App">
      {isAuthenticated ? (
        <AdminDashboard onLogout={handleLogout} currentUser={currentUser} />
      ) : currentPage === 'signup' ? (
        <AdminSignup onSwitchToSignin={switchToSignin} onSignup={handleSignup} />
      ) : (
        <Signin onSwitchToSignup={switchToSignup} onLogin={handleLogin} />
      )}
    </div>
  );
}

export default App;
