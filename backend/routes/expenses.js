const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const Expense = require('../models/Expense');
const User = require('../models/User');
const Approval = require('../models/Approval');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/receipts/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Accept only images and PDFs
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only image and PDF files are allowed'), false);
    }
  }
});

// Get all expenses with user details
router.get('/', async (req, res) => {
  try {
    console.log('Fetching all expenses...');
    const expenses = await Expense.find({})
      .populate('userId', 'name email role')
      .populate('companyId', 'name country currency')
      .sort({ createdAt: -1 });

    console.log(`Found ${expenses.length} expenses`);
    expenses.forEach(exp => {
      console.log(`  - ${exp.description}: ₹${exp.convertedAmount.toLocaleString()} (${exp.status})`);
    });

    res.json({
      success: true,
      expenses: expenses
    });

  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching expenses' 
    });
  }
});

// Get expenses for a specific user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`Fetching expenses for user: ${userId}`);
    
    const expenses = await Expense.find({ userId: userId })
      .populate('userId', 'name email role')
      .populate('companyId', 'name country currency')
      .sort({ createdAt: -1 });

    console.log(`Found ${expenses.length} expenses for user ${userId}`);
    expenses.forEach(exp => {
      console.log(`  - ${exp.description}: ₹${exp.convertedAmount.toLocaleString()} (${exp.status})`);
    });

    res.json({
      success: true,
      expenses: expenses
    });

  } catch (error) {
    console.error('Get user expenses error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching user expenses' 
    });
  }
});

// Get expense summary data (for cards)
router.get('/summary', async (req, res) => {
  try {
    console.log('Fetching expense summary...');
    
    // Get expenses by status (check both cases)
    const toSubmit = await Expense.find({ 
      $or: [
        { status: 'pending' },
        { status: 'Pending' }
      ]
    });
    const waitingApproval = await Expense.find({ 
      $or: [
        { status: 'submitted' },
        { status: 'Submitted' }
      ]
    });
    const approved = await Expense.find({ 
      $or: [
        { status: 'approved' },
        { status: 'Approved' }
      ]
    });

    console.log('Found expenses:', {
      toSubmit: toSubmit.length,
      waitingApproval: waitingApproval.length,
      approved: approved.length
    });

    // Calculate totals
    const toSubmitTotal = toSubmit.reduce((sum, expense) => sum + expense.convertedAmount, 0);
    const waitingApprovalTotal = waitingApproval.reduce((sum, expense) => sum + expense.convertedAmount, 0);
    const approvedTotal = approved.reduce((sum, expense) => sum + expense.convertedAmount, 0);

    const summaryData = {
      toSubmit: {
        count: toSubmit.length,
        total: toSubmitTotal
      },
      waitingApproval: {
        count: waitingApproval.length,
        total: waitingApprovalTotal
      },
      approved: {
        count: approved.length,
        total: approvedTotal
      }
    };

    console.log('Summary data:', summaryData);

    res.json({
      success: true,
      summary: summaryData
    });

  } catch (error) {
    console.error('Get expense summary error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching expense summary' 
    });
  }
});

// Get expense summary data for a specific user
router.get('/summary/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`Fetching expense summary for user: ${userId}`);
    
    // Get expenses by status for specific user
    const toSubmit = await Expense.find({ 
      userId: userId,
      $or: [
        { status: 'pending' },
        { status: 'Pending' }
      ]
    });
    const waitingApproval = await Expense.find({ 
      userId: userId,
      $or: [
        { status: 'submitted' },
        { status: 'Submitted' }
      ]
    });
    const approved = await Expense.find({ 
      userId: userId,
      $or: [
        { status: 'approved' },
        { status: 'Approved' }
      ]
    });

    console.log(`Found expenses for user ${userId}:`, {
      toSubmit: toSubmit.length,
      waitingApproval: waitingApproval.length,
      approved: approved.length
    });

    // Calculate totals
    const toSubmitTotal = toSubmit.reduce((sum, expense) => sum + expense.convertedAmount, 0);
    const waitingApprovalTotal = waitingApproval.reduce((sum, expense) => sum + expense.convertedAmount, 0);
    const approvedTotal = approved.reduce((sum, expense) => sum + expense.convertedAmount, 0);

    const summaryData = {
      toSubmit: {
        count: toSubmit.length,
        total: toSubmitTotal
      },
      waitingApproval: {
        count: waitingApproval.length,
        total: waitingApprovalTotal
      },
      approved: {
        count: approved.length,
        total: approvedTotal
      }
    };

    console.log(`Summary data for user ${userId}:`, summaryData);

    res.json({
      success: true,
      summary: summaryData
    });

  } catch (error) {
    console.error('Get user expense summary error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching user expense summary' 
    });
  }
});

// Create new expense with file upload
router.post('/', upload.single('receipt'), async (req, res) => {
  try {
    const { userId, companyId, amount, currency, convertedAmount, category, description, date, remarks } = req.body;
    
    // Handle file upload
    let receiptUrl = '';
    if (req.file) {
      receiptUrl = `/uploads/receipts/${req.file.filename}`;
    }

    const newExpense = new Expense({
      userId,
      companyId,
      amount: parseFloat(amount),
      currency,
      convertedAmount: parseFloat(convertedAmount),
      category,
      description,
      date: date || new Date(),
      remarks: remarks || '',
      receiptUrl,
      status: 'pending'
    });

    await newExpense.save();

    // Populate the saved expense
    const savedExpense = await Expense.findById(newExpense._id)
      .populate('userId', 'name email role')
      .populate('companyId', 'name country currency');

    res.status(201).json({
      success: true,
      message: 'Expense created successfully',
      expense: savedExpense
    });

  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while creating expense' 
    });
  }
});

// Update expense status
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const expense = await Expense.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate('userId', 'name email role')
     .populate('companyId', 'name country currency');

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    // Update expense status
    expense.status = 'approved';
    expense.approvedBy = managerId;
    expense.approvedAt = new Date();
    if (comment) {
      expense.approvalComment = comment;
    }
    
    await expense.save();

    res.json({
      success: true,
      message: 'Expense approved successfully',
      expenseStatus: 'approved'
    });
  } catch (error) {
    console.error('Approve direct expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while approving expense'
    });
  }
});

// Reject direct company expense (not workflow-based)
router.post('/reject-direct/:expenseId', async (req, res) => {
  try {
    const { expenseId } = req.params;
    const { managerId, comment } = req.body;
    
    const expense = await Expense.findById(expenseId);
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    res.json({
      success: true,
      message: 'Expense deleted successfully'
    });

  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while deleting expense' 
    });
  }
});

module.exports = router;
