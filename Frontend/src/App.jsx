import { useState } from 'react';
import './App.css';
import AdminSignup from './components/AdminSignup';
import Signin from './components/Signin';

function App() {
  // State to manage which page to show
  const [currentPage, setCurrentPage] = useState('signin'); // Default to signin page

  const switchToSignup = () => {
    setCurrentPage('signup');
  };

  const switchToSignin = () => {
    setCurrentPage('signin');
  };

  return (
    <div className="App">
      {currentPage === 'signup' ? (
        <AdminSignup onSwitchToSignin={switchToSignin} />
      ) : (
        <Signin onSwitchToSignup={switchToSignup} />
      )}
    </div>
  );
}

export default App;
