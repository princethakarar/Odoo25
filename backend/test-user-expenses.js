const fetch = require('node-fetch');
const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

// Connect to MongoDB
const uri = process.env.MONGO_URI;
mongoose.connect(uri, { dbName: 'ExpenseDB' });

const connection = mongoose.connection;
connection.once('open', async () => {
  console.log("MongoDB ExpenseDB database connection established successfully");
  
  try {
    // Get all users
    const users = await User.find({});
    console.log(`Found ${users.length} users in database\n`);
    
    // Test API endpoints for each user
    for (const user of users) {
      console.log(`🧪 Testing API for ${user.name} (${user.role}):`);
      console.log(`   User ID: ${user._id}`);
      
      // Test user expenses endpoint
      try {
        const expensesResponse = await fetch(`http://localhost:5000/api/expenses/user/${user._id}`);
        const expensesData = await expensesResponse.json();
        
        if (expensesData.success) {
          console.log(`   ✅ Expenses: ${expensesData.expenses.length} found`);
          expensesData.expenses.forEach(exp => {
            console.log(`      - ${exp.description}: ₹${exp.convertedAmount.toLocaleString()} (${exp.status})`);
          });
        } else {
          console.log(`   ❌ Expenses: ${expensesData.message}`);
        }
      } catch (error) {
        console.log(`   ❌ Expenses: Error - ${error.message}`);
      }
      
      // Test user summary endpoint
      try {
        const summaryResponse = await fetch(`http://localhost:5000/api/expenses/summary/user/${user._id}`);
        const summaryData = await summaryResponse.json();
        
        if (summaryData.success) {
          console.log(`   ✅ Summary:`);
          console.log(`      To Submit: ${summaryData.summary.toSubmit.count} expenses, ₹${summaryData.summary.toSubmit.total.toLocaleString()}`);
          console.log(`      Waiting Approval: ${summaryData.summary.waitingApproval.count} expenses, ₹${summaryData.summary.waitingApproval.total.toLocaleString()}`);
          console.log(`      Approved: ${summaryData.summary.approved.count} expenses, ₹${summaryData.summary.approved.total.toLocaleString()}`);
        } else {
          console.log(`   ❌ Summary: ${summaryData.message}`);
        }
      } catch (error) {
        console.log(`   ❌ Summary: Error - ${error.message}`);
      }
      
      console.log(''); // Empty line for readability
    }
    
  } catch (error) {
    console.error('Error testing user expenses:', error);
  } finally {
    mongoose.connection.close();
  }
});

connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});
