const mongoose = require('mongoose');
const User = require('./models/User');
const Company = require('./models/Company');
require('dotenv').config();

// Connect to MongoDB
const uri = process.env.MONGO_URI;
mongoose.connect(uri, { dbName: 'ExpenseDB' });

const connection = mongoose.connection;
connection.once('open', async () => {
  console.log("MongoDB ExpenseDB database connection established successfully");
  
  try {
    // Get the first company
    const company = await Company.findOne();
    
    if (!company) {
      console.log('❌ No company found. Please create a company first.');
      process.exit(1);
    }
    
    // Get the first admin user to be the manager
    const adminUser = await User.findOne({ role: 'Admin' });
    
    if (!adminUser) {
      console.log('❌ No admin user found. Please create an admin first.');
      process.exit(1);
    }
    
    // Create an employee user
    const employeeData = {
      name: 'vraj patel',
      email: 'vraj@example.com',
      passwordHash: 'employee123',
      role: 'Employee',
      companyId: company._id,
      managerId: adminUser._id
    };
    
    // Check if employee already exists
    const existingEmployee = await User.findOne({ 
      $or: [
        { email: employeeData.email },
        { name: employeeData.name }
      ]
    });
    
    if (existingEmployee) {
      console.log('✅ Employee user already exists:');
      console.log(`   Name: ${existingEmployee.name}`);
      console.log(`   Email: ${existingEmployee.email}`);
      console.log(`   Role: ${existingEmployee.role}`);
      console.log(`   Manager: ${adminUser.name}`);
    } else {
      const newEmployee = new User(employeeData);
      await newEmployee.save();
      
      console.log('✅ Employee user created successfully:');
      console.log(`   Name: ${newEmployee.name}`);
      console.log(`   Email: ${newEmployee.email}`);
      console.log(`   Role: ${newEmployee.role}`);
      console.log(`   Manager: ${adminUser.name}`);
    }
    
    console.log('\n🎯 Test Credentials:');
    console.log('Admin Login:');
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Password: ${adminUser.passwordHash}`);
    console.log('\nEmployee Login:');
    console.log(`   Email: ${employeeData.email}`);
    console.log(`   Password: ${employeeData.passwordHash}`);
    
  } catch (error) {
    console.error('Error creating employee:', error);
  } finally {
    mongoose.connection.close();
  }
});

connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});
