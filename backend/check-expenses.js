const mongoose = require('mongoose');
const Expense = require('./models/Expense');
require('dotenv').config();

// Connect to MongoDB
const uri = process.env.MONGO_URI;
mongoose.connect(uri, { dbName: 'ExpenseDB' });

const connection = mongoose.connection;
connection.once('open', async () => {
  console.log("MongoDB ExpenseDB database connection established successfully");
  
  try {
    // Get all expenses
    const allExpenses = await Expense.find({});
    console.log(`\nTotal expenses in database: ${allExpenses.length}`);
    
    if (allExpenses.length === 0) {
      console.log('❌ No expenses found in database!');
      console.log('Please run: node test-expenses.js to create sample data');
      process.exit(1);
    }
    
    // Group by status
    const statusGroups = allExpenses.reduce((acc, expense) => {
      const status = expense.status || 'unknown';
      if (!acc[status]) {
        acc[status] = [];
      }
      acc[status].push(expense);
      return acc;
    }, {});
    
    console.log('\n📊 Expenses by status:');
    Object.keys(statusGroups).forEach(status => {
      const expenses = statusGroups[status];
      const total = expenses.reduce((sum, exp) => sum + exp.convertedAmount, 0);
      console.log(`  ${status}: ${expenses.length} expenses, Total: ₹${total.toLocaleString()}`);
      
      expenses.forEach(exp => {
        console.log(`    - ${exp.description}: ₹${exp.convertedAmount.toLocaleString()} (${exp.status})`);
      });
    });
    
    // Test the summary calculation
    console.log('\n🧮 Summary calculation test:');
    const toSubmit = allExpenses.filter(e => e.status === 'pending');
    const waitingApproval = allExpenses.filter(e => e.status === 'submitted');
    const approved = allExpenses.filter(e => e.status === 'approved');
    
    const toSubmitTotal = toSubmit.reduce((sum, e) => sum + e.convertedAmount, 0);
    const waitingApprovalTotal = waitingApproval.reduce((sum, e) => sum + e.convertedAmount, 0);
    const approvedTotal = approved.reduce((sum, e) => sum + e.convertedAmount, 0);
    
    console.log(`To Submit: ${toSubmit.length} expenses, ₹${toSubmitTotal.toLocaleString()}`);
    console.log(`Waiting Approval: ${waitingApproval.length} expenses, ₹${waitingApprovalTotal.toLocaleString()}`);
    console.log(`Approved: ${approved.length} expenses, ₹${approvedTotal.toLocaleString()}`);
    
  } catch (error) {
    console.error('Error checking expenses:', error);
  } finally {
    mongoose.connection.close();
  }
});

connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});
