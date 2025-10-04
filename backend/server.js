// Import required packages
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config(); // Load environment variables

// Initialize the app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Allow the server to accept JSON in the request body

// --- MongoDB Connection ---
const uri = process.env.MONGO_URI;
mongoose.connect(uri, {
  dbName: 'ExpenseDB' // Explicitly use your existing ExpenseDB database
});

const connection = mongoose.connection;
connection.once('open', () => {
  console.log("MongoDB ExpenseDB database connection established successfully");
});

connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

// Import routes
const authRoutes = require('./routes/auth');

// Basic route
app.get('/', (req, res) => {
  res.send('Hello from Express Backend!');
});

app.get('/api/data', (req, res) => {
    res.json({ message: "Hello from the backend!", users: ['John', 'Jane', 'Jim'] });
});

// Use routes
app.use('/api/auth', authRoutes);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
});