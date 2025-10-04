const mongoose = require('mongoose');
const Expense = require('./models/Expense');
const User = require('./models/User');
const Company = require('./models/Company');
const Approval = require('./models/Approval');
const ApprovalRule = require('./models/ApprovalRule');
require('dotenv').config();

// Connect to MongoDB
const uri = process.env.MONGO_URI;
mongoose.connect(uri, { dbName: 'ExpenseDB' });

const connection = mongoose.connection;
connection.once('open', async () => {
  console.log("MongoDB ExpenseDB database connection established successfully");
  
  try {
    // Get the first user and company
    const user = await User.findOne();
    const company = await Company.findOne();
    
    if (!user || !company) {
      console.log('No users or companies found. Please create them first.');
      process.exit(1);
    }
    
    // Clear existing expenses
    await Expense.deleteMany({});
    
    // Get all users and companies from database
    const allUsers = await User.find({});
    const allCompanies = await Company.find({});
    
    if (allUsers.length === 0 || allCompanies.length === 0) {
      console.log('No users or companies found in database. Please create them first.');
      process.exit(1);
    }
    
    console.log(`Found ${allUsers.length} users and ${allCompanies.length} companies in database`);
    
    // Create dynamic expenses based on actual database data
    const sampleExpenses = [
      {
        userId: allUsers[0]._id, // Harsh Jethava (Admin)
        companyId: allCompanies[0]._id, // TechCorp Pvt Ltd
        amount: 5000,
        currency: allCompanies[0].currency, // INR from company data
        convertedAmount: 415000, // Based on your actual data
        category: 'Travel',
        description: 'Flight ticket for client meeting',
        date: new Date('2025-10-04T10:00:00.000Z'),
        status: 'pending',
        receiptUrl: 'https://storage-link.com/receipt123.jpg'
      },
      {
        userId: allUsers[0]._id,
        companyId: allCompanies[0]._id,
        amount: 1500,
        currency: allCompanies[0].currency,
        convertedAmount: 1500,
        category: 'Transport',
        description: 'Taxi fare to airport',
        date: new Date('2025-10-03'),
        status: 'submitted'
      },
      {
        userId: allUsers[0]._id,
        companyId: allCompanies[0]._id,
        amount: 800,
        currency: allCompanies[0].currency,
        convertedAmount: 800,
        category: 'Office Supplies',
        description: 'Stationery and office materials',
        date: new Date('2025-10-02'),
        status: 'approved'
      },
      {
        userId: allUsers[0]._id,
        companyId: allCompanies[0]._id,
        amount: 2500,
        currency: allCompanies[0].currency,
        convertedAmount: 2500,
        category: 'Food',
        description: 'Team lunch meeting',
        date: new Date('2025-10-01'),
        status: 'pending'
      },
      {
        userId: allUsers[0]._id,
        companyId: allCompanies[0]._id,
        amount: 3000,
        currency: allCompanies[0].currency,
        convertedAmount: 3000,
        category: 'Travel',
        description: 'Hotel accommodation',
        date: new Date('2025-09-30'),
        status: 'submitted'
      }
    ];
    
    // Add more expenses if there are multiple users
    if (allUsers.length > 1) {
      // Add expenses for the second user (employee)
      const employeeExpenses = [
        {
          userId: allUsers[1]._id,
          companyId: allCompanies[0]._id,
          amount: 1200,
          currency: allCompanies[0].currency,
          convertedAmount: 1200,
          category: 'Food',
          description: 'Client dinner',
          date: new Date('2025-10-05'),
          status: 'pending'
        },
        {
          userId: allUsers[1]._id,
          companyId: allCompanies[0]._id,
          amount: 800,
          currency: allCompanies[0].currency,
          convertedAmount: 800,
          category: 'Transport',
          description: 'Uber ride',
          date: new Date('2025-10-06'),
          status: 'submitted'
        },
        {
          userId: allUsers[1]._id,
          companyId: allCompanies[0]._id,
          amount: 2000,
          currency: allCompanies[0].currency,
          convertedAmount: 2000,
          category: 'Office Supplies',
          description: 'Laptop accessories',
          date: new Date('2025-10-07'),
          status: 'approved'
        }
      ];
      
      sampleExpenses.push(...employeeExpenses);
    }
    
    // Insert sample expenses
    const createdExpenses = await Expense.insertMany(sampleExpenses);
    console.log(`Created ${createdExpenses.length} sample expenses`);
    
    // Create approval records for submitted expenses
    const submittedExpenses = createdExpenses.filter(expense => expense.status === 'submitted');
    const approvalRecords = [];
    
    for (const expense of submittedExpenses) {
      const approvalRecord = {
        expenseId: expense._id,
        approverId: allUsers[0]._id, // Harsh Jethava as approver
        status: 'Pending',
        comments: '',
        sequenceOrder: 1
      };
      approvalRecords.push(approvalRecord);
    }
    
    if (approvalRecords.length > 0) {
      await Approval.insertMany(approvalRecords);
      console.log(`Created ${approvalRecords.length} approval records`);
    }
    
    // Display detailed summary with user and company information
    const summary = await Expense.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $lookup: {
          from: 'companies',
          localField: 'companyId',
          foreignField: '_id',
          as: 'company'
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          total: { $sum: '$convertedAmount' },
          expenses: { $push: {
            description: '$description',
            amount: '$convertedAmount',
            currency: '$currency',
            user: { $arrayElemAt: ['$user.name', 0] },
            company: { $arrayElemAt: ['$company.name', 0] }
          }}
        }
      }
    ]);
    
    console.log('\n=== EXPENSE SUMMARY ===');
    summary.forEach(item => {
      console.log(`\n${item._id.toUpperCase()}: ${item.count} expenses, Total: ₹${item.total.toLocaleString()}`);
      item.expenses.forEach(expense => {
        console.log(`  - ${expense.description} (${expense.user}) - ₹${expense.amount.toLocaleString()} ${expense.currency}`);
      });
    });
    
    // Display user and company information
    console.log('\n=== DATABASE INFO ===');
    console.log('Users in database:');
    allUsers.forEach(user => {
      console.log(`  - ${user.name} (${user.email}) - Role: ${user.role}`);
    });
    
    console.log('\nCompanies in database:');
    allCompanies.forEach(company => {
      console.log(`  - ${company.name} (${company.country}) - Currency: ${company.currency}`);
    });
    
    // Show user-specific expense counts
    console.log('\n=== USER-SPECIFIC EXPENSE COUNTS ===');
    for (const user of allUsers) {
      const userExpenses = createdExpenses.filter(exp => exp.userId.toString() === user._id.toString());
      const userSummary = userExpenses.reduce((acc, exp) => {
        const status = exp.status.toLowerCase();
        if (!acc[status]) acc[status] = { count: 0, total: 0 };
        acc[status].count++;
        acc[status].total += exp.convertedAmount;
        return acc;
      }, {});
      
      console.log(`\n${user.name} (${user.role}):`);
      Object.keys(userSummary).forEach(status => {
        console.log(`  ${status}: ${userSummary[status].count} expenses, ₹${userSummary[status].total.toLocaleString()}`);
      });
    }
    
  } catch (error) {
    console.error('Error creating sample expenses:', error);
  } finally {
    mongoose.connection.close();
  }
});

connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});
