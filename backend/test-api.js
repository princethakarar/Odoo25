const fetch = require('node-fetch');

async function testAPI() {
  try {
    console.log('🧪 Testing API endpoints...\n');
    
    // Test expenses endpoint
    console.log('1. Testing /api/expenses...');
    const expensesResponse = await fetch('http://localhost:5000/api/expenses');
    const expensesData = await expensesResponse.json();
    
    if (expensesData.success) {
      console.log(`✅ Found ${expensesData.expenses.length} expenses`);
      expensesData.expenses.forEach(exp => {
        console.log(`   - ${exp.description}: ₹${exp.convertedAmount.toLocaleString()} (${exp.status})`);
      });
    } else {
      console.log('❌ Failed to fetch expenses:', expensesData.message);
    }
    
    console.log('\n2. Testing /api/expenses/summary...');
    const summaryResponse = await fetch('http://localhost:5000/api/expenses/summary');
    const summaryData = await summaryResponse.json();
    
    if (summaryData.success) {
      console.log('✅ Summary data received:');
      console.log(`   To Submit: ${summaryData.summary.toSubmit.count} expenses, ₹${summaryData.summary.toSubmit.total.toLocaleString()}`);
      console.log(`   Waiting Approval: ${summaryData.summary.waitingApproval.count} expenses, ₹${summaryData.summary.waitingApproval.total.toLocaleString()}`);
      console.log(`   Approved: ${summaryData.summary.approved.count} expenses, ₹${summaryData.summary.approved.total.toLocaleString()}`);
    } else {
      console.log('❌ Failed to fetch summary:', summaryData.message);
    }
    
  } catch (error) {
    console.error('❌ API test error:', error.message);
    console.log('\n💡 Make sure your backend server is running: npm start');
  }
}

testAPI();
