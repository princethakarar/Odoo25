const express = require('express');
const router = express.Router();
const ApprovalRule = require('../models/ApprovalRule');
const ApprovalWorkflow = require('../models/ApprovalWorkflow');
const User = require('../models/User');

// Get all approval workflows
router.get('/', async (req, res) => {
  try {
    const workflows = await ApprovalWorkflow.find({})
      .populate('userId', 'name email role')
      .populate('managerId', 'name email role')
      .populate('approvers.userId', 'name email role')
      .populate('companyId', 'name country currency');

    res.json({
      success: true,
      rules: workflows
    });
  } catch (error) {
    console.error('Get approval workflows error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching approval workflows'
    });
  }
});

// Get approval workflow by user ID
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const workflow = await ApprovalWorkflow.findOne({ userId })
      .populate('userId', 'name email role')
      .populate('managerId', 'name email role')
      .populate('approvers.userId', 'name email role')
      .populate('companyId', 'name country currency');

    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: 'Approval workflow not found for this user'
      });
    }

    res.json({
      success: true,
      rule: workflow
    });
  } catch (error) {
    console.error('Get approval workflow error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching approval workflow'
    });
  }
});

// Create or update approval workflow
router.post('/', async (req, res) => {
  try {
    console.log('Received approval workflow data:', req.body);
    
    const {
      userId,
      description,
      managerId,
      isManagerApprover,
      approvers,
      approversSequence,
      minimumApprovalPercentage,
      companyId
    } = req.body;

    // Validate required fields
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    if (!description) {
      return res.status(400).json({
        success: false,
        message: 'Description is required'
      });
    }

    // Check if workflow already exists for this user
    let existingWorkflow = await ApprovalWorkflow.findOne({ userId });

    if (existingWorkflow) {
      // Update existing workflow
      existingWorkflow.description = description;
      existingWorkflow.managerId = managerId || null;
      existingWorkflow.isManagerApprover = isManagerApprover;
      existingWorkflow.approvers = approvers || [];
      existingWorkflow.approversSequence = approversSequence || false;
      existingWorkflow.minimumApprovalPercentage = minimumApprovalPercentage || null;
      
      await existingWorkflow.save();

      const updatedWorkflow = await ApprovalWorkflow.findById(existingWorkflow._id)
        .populate('userId', 'name email role')
        .populate('managerId', 'name email role')
        .populate('approvers.userId', 'name email role')
        .populate('companyId', 'name country currency');

      res.json({
        success: true,
        message: 'Approval workflow updated successfully',
        rule: updatedWorkflow
      });
    } else {
      // Create new workflow
      const newWorkflow = new ApprovalWorkflow({
        userId,
        description,
        managerId: managerId || null,
        isManagerApprover: isManagerApprover || true,
        approvers: approvers || [],
        approversSequence: approversSequence || false,
        minimumApprovalPercentage: minimumApprovalPercentage || null,
        companyId: companyId || null
      });

      await newWorkflow.save();

      const savedWorkflow = await ApprovalWorkflow.findById(newWorkflow._id)
        .populate('userId', 'name email role')
        .populate('managerId', 'name email role')
        .populate('approvers.userId', 'name email role')
        .populate('companyId', 'name country currency');

      res.status(201).json({
        success: true,
        message: 'Approval workflow created successfully',
        rule: savedWorkflow
      });
    }
  } catch (error) {
    console.error('Create/Update approval workflow error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating/updating approval workflow: ' + error.message
    });
  }
});

// Delete approval workflow
router.delete('/:workflowId', async (req, res) => {
  try {
    const { workflowId } = req.params;
    
    const deletedWorkflow = await ApprovalWorkflow.findByIdAndDelete(workflowId);
    
    if (!deletedWorkflow) {
      return res.status(404).json({
        success: false,
        message: 'Approval workflow not found'
      });
    }

    res.json({
      success: true,
      message: 'Approval workflow deleted successfully'
    });
  } catch (error) {
    console.error('Delete approval workflow error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting approval workflow'
    });
  }
});

// Get all users for dropdowns
router.get('/users/all', async (req, res) => {
  try {
    const users = await User.find({})
      .populate('companyId', 'name country currency')
      .populate('managerId', 'name email role')
      .select('-passwordHash');

    res.json({
      success: true,
      users: users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching users'
    });
  }
});

module.exports = router;
