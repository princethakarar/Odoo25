import { useState, useEffect } from 'react';
import './App.css';

function App() {
  // State to store the message from the backend
  const [data, setData] = useState({ message: '', users: [] });
  // State to handle loading state
  const [loading, setLoading] = useState(true);
  // State to handle errors
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch data from the backend API
    fetch('http://localhost:5000/api/data')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then((data) => {
        setData(data); // Set the data from the backend
        setLoading(false); // Set loading to false
      })
      .catch((error) => {
        setError(error.message); // Set error message
        setLoading(false); // Set loading to false
      });
  }, []); // The empty dependency array means this effect runs once when the component mounts

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="App">
      <header className="App-header">
        <h1>{data.message}</h1>
        <h2>Users:</h2>
        <ul>
          {data.users.map((user, index) => (
            <li key={index}>{user}</li>
          ))}
        </ul>
      </header>
    </div>
  );
}

export default App;
