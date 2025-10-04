const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const User = require('../models/User');
const ApprovalRequest = require('../models/ApprovalRequest');
const ApprovalWorkflowService = require('../services/ApprovalWorkflowService');

// Get pending approvals for a manager
router.get('/manager/:managerId/pending', async (req, res) => {
  try {
    const { managerId } = req.params;
    
    console.log('Fetching pending approvals for manager:', managerId);
    
    // First, get the manager's details and company
    const manager = await User.findById(managerId).populate('companyId');
    if (!manager) {
      return res.status(404).json({
        success: false,
        message: 'Manager not found'
      });
    }

    const managerCompanyId = manager.companyId?._id || manager.companyId;
    console.log('Manager company ID:', managerCompanyId);

    // Check if user is a manager or approver
    const isManager = manager.role === 'Manager' || manager.role === 'Admin';
    const isApprover = manager.isApprover === true;
    
    if (!isManager && !isApprover) {
      return res.status(403).json({
        success: false,
        message: 'User is not authorized to view manager dashboard'
      });
    }

    // Get all employees under this manager (same company)
    const companyUsers = await User.find({ 
      companyId: managerCompanyId,
      _id: { $ne: managerId } // Exclude the manager themselves
    }).select('_id name email role managerId');

    console.log('Company users:', companyUsers.length);

    // Get all expenses from company users that are pending
    const expenses = await Expense.find({
      userId: { $in: companyUsers.map(user => user._id) },
      status: 'pending'
    }).populate('userId', 'name email role')
      .populate('companyId', 'name country currency')
      .sort({ createdAt: -1 });

    console.log('Found company expenses:', expenses.length);

    // Get approval requests where this manager is the approver
    const approvalRequests = await ApprovalRequest.find({
      approverId: managerId,
      status: 'pending'
    }).populate('expenseId')
      .populate('workflowId');

    console.log('Found approval requests for manager:', approvalRequests.length);

    // Create a map of expense IDs to approval requests for quick lookup
    const approvalRequestMap = new Map();
    approvalRequests.forEach(req => {
      if (req.expenseId) {
        approvalRequestMap.set(req.expenseId._id.toString(), req);
      }
    });

    // Format expenses for display
    const formattedExpenses = expenses.map(expense => {
      const approvalRequest = approvalRequestMap.get(expense._id.toString());
      
      if (approvalRequest) {
        // This expense has a workflow-based approval request for this manager
        return {
          _id: expense._id,
          description: expense.description,
          amount: expense.amount,
          currency: expense.currency,
          convertedAmount: expense.convertedAmount,
          category: expense.category,
          date: expense.date,
          status: expense.status,
          userId: expense.userId,
          companyId: expense.companyId,
          approvalRequestId: approvalRequest._id,
          sequence: approvalRequest.sequence,
          isRequired: approvalRequest.isRequired,
          workflowId: approvalRequest.workflowId?._id,
          workflowType: approvalRequest.workflowId?.approversSequence ? 'Sequential' : 'Parallel',
          minimumApprovalPercentage: approvalRequest.workflowId?.minimumApprovalPercentage,
          isDirectCompanyExpense: false
        };
      } else {
        // This expense doesn't have a workflow, show as direct company expense
        return {
          _id: expense._id,
          description: expense.description,
          amount: expense.amount,
          currency: expense.currency,
          convertedAmount: expense.convertedAmount,
          category: expense.category,
          date: expense.date,
          status: expense.status,
          userId: expense.userId,
          companyId: expense.companyId,
          approvalRequestId: null,
          sequence: 0,
          isRequired: false,
          workflowId: null,
          workflowType: 'Direct Company',
          minimumApprovalPercentage: null,
          isDirectCompanyExpense: true
        };
      }
    });

    console.log('Formatted expenses for manager:', formattedExpenses.length);

    res.json({
      success: true,
      expenses: formattedExpenses,
      totalWorkflows: approvalRequests.length,
      totalExpenses: expenses.length,
      pendingForManager: formattedExpenses.length,
      managerCompany: managerCompanyId,
      message: `Showing ${formattedExpenses.length} expenses for manager review`
    });
  } catch (error) {
    console.error('Get pending approvals error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching pending approvals: ' + error.message
    });
  }
});

// Get all expenses (for admin view)
router.get('/', async (req, res) => {
  try {
    const expenses = await Expense.find({})
      .populate('userId', 'name email role')
      .populate('companyId', 'name country currency')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      expenses: expenses
    });
  } catch (error) {
    console.error('Get all expenses error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching expenses'
    });
  }
});

// Approve expense through workflow
router.post('/approve/:approvalRequestId', async (req, res) => {
  try {
    const { approvalRequestId } = req.params;
    const { comment } = req.body;
    
    const result = await ApprovalWorkflowService.processApproval(approvalRequestId, 'approved', comment);
    
    res.json({
      success: true,
      message: result.message,
      expenseStatus: result.expenseStatus,
      approvalPercentage: result.approvalPercentage,
      approvedCount: result.approvedCount,
      totalApprovers: result.totalApprovers
    });
  } catch (error) {
    console.error('Approve expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while approving expense'
    });
  }
});

// Reject expense through workflow
router.post('/reject/:approvalRequestId', async (req, res) => {
  try {
    const { approvalRequestId } = req.params;
    const { comment } = req.body;
    
    const result = await ApprovalWorkflowService.processApproval(approvalRequestId, 'rejected', comment);
    
    res.json({
      success: true,
      message: result.message,
      expenseStatus: result.expenseStatus
    });
  } catch (error) {
    console.error('Reject expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while rejecting expense'
    });
  }
});

// Create new expense and initialize approval workflow
router.post('/', async (req, res) => {
  try {
    const {
      userId,
      companyId,
      amount,
      currency,
      convertedAmount,
      category,
      description,
      date
    } = req.body;

    const newExpense = new Expense({
      userId,
      companyId,
      amount,
      currency,
      convertedAmount,
      category,
      description,
      date: date || new Date(),
      status: 'pending'
    });

    await newExpense.save();

    // Initialize approval workflow
    const workflowResult = await ApprovalWorkflowService.initializeApprovalWorkflow(newExpense._id);

    const savedExpense = await Expense.findById(newExpense._id)
      .populate('userId', 'name email role')
      .populate('companyId', 'name country currency');

    res.status(201).json({
      success: true,
      message: 'Expense created successfully',
      expense: savedExpense,
      workflowResult: workflowResult
    });
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating expense'
    });
  }
});

// Create sample expenses for testing
router.post('/create-sample', async (req, res) => {
  try {
    const sampleExpenses = [
      {
        userId: req.body.userId || '68e09a3db5560d0f13e222f1', // Default user ID
        companyId: req.body.companyId || '68e09cc7b5560d0f13e222f5', // Default company ID
        amount: 567,
        currency: 'USD',
        convertedAmount: 49896,
        category: 'Food',
        description: 'Flight ticket for client meeting',
        date: new Date('2025-10-04T10:00:00.000Z'),
        status: 'pending'
      },
      {
        userId: req.body.userId || '68e09a3db5560d0f13e222f1',
        companyId: req.body.companyId || '68e09cc7b5560d0f13e222f5',
        amount: 150,
        currency: 'USD',
        convertedAmount: 13200,
        category: 'Travel',
        description: 'Hotel accommodation for business trip',
        date: new Date('2025-10-05T14:00:00.000Z'),
        status: 'pending'
      },
      {
        userId: req.body.userId || '68e09a3db5560d0f13e222f1',
        companyId: req.body.companyId || '68e09cc7b5560d0f13e222f5',
        amount: 75,
        currency: 'USD',
        convertedAmount: 6600,
        category: 'Transportation',
        description: 'Taxi fare to client office',
        date: new Date('2025-10-06T09:00:00.000Z'),
        status: 'approved'
      }
    ];

    const createdExpenses = [];
    for (const expenseData of sampleExpenses) {
      const expense = new Expense(expenseData);
      await expense.save();
      const populatedExpense = await Expense.findById(expense._id)
        .populate('userId', 'name email role')
        .populate('companyId', 'name country currency');
      createdExpenses.push(populatedExpense);
    }

    res.status(201).json({
      success: true,
      message: 'Sample expenses created successfully',
      expenses: createdExpenses
    });
  } catch (error) {
    console.error('Create sample expenses error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating sample expenses'
    });
  }
});

// Create complete test setup (workflow + expense + approval requests)
router.post('/create-complete-test', async (req, res) => {
  try {
    const { userId, managerId, companyId } = req.body;
    
    console.log('Creating complete test setup...');
    
    // Step 1: Create approval workflow
    const sampleWorkflow = new ApprovalWorkflow({
      userId: userId,
      description: 'Test approval workflow',
      managerId: managerId,
      isManagerApprover: true,
      approvers: [
        {
          userId: managerId,
          required: true,
          sequence: 0
        }
      ],
      approversSequence: false, // Parallel workflow
      minimumApprovalPercentage: 50,
      companyId: companyId
    });

    await sampleWorkflow.save();
    console.log('Workflow created:', sampleWorkflow._id);

    // Step 2: Create expense
    const sampleExpense = new Expense({
      userId: userId,
      companyId: companyId,
      amount: 100,
      currency: 'USD',
      convertedAmount: 100,
      category: 'Test',
      description: 'Test expense for approval',
      date: new Date(),
      status: 'pending'
    });

    await sampleExpense.save();
    console.log('Expense created:', sampleExpense._id);

    // Step 3: Initialize approval workflow (creates approval requests)
    const workflowResult = await ApprovalWorkflowService.initializeApprovalWorkflow(sampleExpense._id);
    console.log('Workflow initialized:', workflowResult);

    // Step 4: Verify approval requests were created
    const approvalRequests = await ApprovalRequest.find({
      expenseId: sampleExpense._id
    }).populate('approverId', 'name email');

    console.log('Approval requests created:', approvalRequests.length);

    res.status(201).json({
      success: true,
      message: 'Complete test setup created successfully',
      workflow: sampleWorkflow,
      expense: sampleExpense,
      approvalRequests: approvalRequests,
      workflowResult: workflowResult
    });
  } catch (error) {
    console.error('Create complete test error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating complete test setup: ' + error.message
    });
  }
});

// Debug endpoint to check what's in the database
router.get('/debug/:managerId', async (req, res) => {
  try {
    const { managerId } = req.params;
    
    console.log('Debugging for manager:', managerId);
    
    // Check workflows
    const workflows = await ApprovalWorkflow.find({
      $or: [
        { managerId: managerId },
        { 'approvers.userId': managerId }
      ]
    }).populate('userId', 'name email')
      .populate('managerId', 'name email')
      .populate('approvers.userId', 'name email');

    console.log('Found workflows:', workflows.length);

    // Check expenses
    const userIds = workflows.map(w => w.userId._id);
    const expenses = await Expense.find({
      userId: { $in: userIds },
      status: 'pending'
    }).populate('userId', 'name email');

    console.log('Found expenses:', expenses.length);

    // Check approval requests
    const approvalRequests = await ApprovalRequest.find({
      approverId: managerId,
      status: 'pending'
    }).populate('expenseId')
      .populate('approverId', 'name email');

    console.log('Found approval requests:', approvalRequests.length);

    res.json({
      success: true,
      debug: {
        managerId: managerId,
        workflows: workflows,
        expenses: expenses,
        approvalRequests: approvalRequests,
        stats: {
          workflowsCount: workflows.length,
          expensesCount: expenses.length,
          approvalRequestsCount: approvalRequests.length
        }
      }
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({
      success: false,
      message: 'Debug error: ' + error.message
    });
  }
});

// Approve direct company expense (not workflow-based)
router.post('/approve-direct/:expenseId', async (req, res) => {
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

    // Update expense status
    expense.status = 'rejected';
    expense.rejectedBy = managerId;
    expense.rejectedAt = new Date();
    if (comment) {
      expense.rejectionComment = comment;
    }
    
    await expense.save();

    res.json({
      success: true,
      message: 'Expense rejected successfully',
      expenseStatus: 'rejected'
    });
  } catch (error) {
    console.error('Reject direct expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while rejecting expense'
    });
  }
});

// Check if user can access manager view
router.get('/manager/:userId/can-access', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId).select('role isApprover');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const canAccess = user.role === 'Manager' || user.role === 'Admin' || user.isApprover === true;
    
    res.json({
      success: true,
      canAccess: canAccess,
      role: user.role,
      isApprover: user.isApprover
    });
  } catch (error) {
    console.error('Check manager access error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while checking manager access: ' + error.message
    });
  }
});

module.exports = router;
