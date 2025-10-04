const { exec } = require('child_process');
const path = require('path');

console.log('🚀 Running expense test with dynamic database data...\n');

// Run the test-expenses.js script
exec('node test-expenses.js', { cwd: __dirname }, (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Error running test:', error);
    return;
  }
  
  if (stderr) {
    console.error('⚠️  Warning:', stderr);
  }
  
  console.log('✅ Test completed successfully!');
  console.log('\n📊 Output:');
  console.log(stdout);
  
  console.log('\n🎯 Next steps:');
  console.log('1. Start your backend server: npm start');
  console.log('2. Start your frontend: cd ../Frontend && npm run dev');
  console.log('3. Open http://localhost:5173 in your browser');
  console.log('4. Login and navigate to Expense Management to see the dynamic data!');
});
