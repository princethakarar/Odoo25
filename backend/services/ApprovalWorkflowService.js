const ApprovalWorkflow = require('../models/ApprovalWorkflow');
const ApprovalRequest = require('../models/ApprovalRequest');
const Expense = require('../models/Expense');
const User = require('../models/User');

class ApprovalWorkflowService {
  
  // Initialize approval workflow for an expense
  static async initializeApprovalWorkflow(expenseId) {
    try {
      const expense = await Expense.findById(expenseId)
        .populate('userId', 'name email role managerId')
        .populate('companyId', 'name country currency');

      if (!expense) {
        throw new Error('Expense not found');
      }

      // Find the approval workflow for this user
      const workflow = await ApprovalWorkflow.findOne({ 
        userId: expense.userId._id 
      }).populate('approvers.userId', 'name email role');

      if (!workflow) {
        // No workflow found, auto-approve
        expense.status = 'approved';
        expense.approvedBy = expense.userId._id;
        expense.approvedAt = new Date();
        await expense.save();
        return { success: true, message: 'No approval workflow found, expense auto-approved' };
      }

      // Create approval requests based on workflow
      const approvalRequests = [];

      // Add manager as first approver if enabled
      if (workflow.isManagerApprover && workflow.managerId) {
        const managerRequest = new ApprovalRequest({
          expenseId: expense._id,
          approverId: workflow.managerId,
          workflowId: workflow._id,
          sequence: 0,
          isRequired: true,
          status: 'pending'
        });
        approvalRequests.push(managerRequest);
      }

      // Add other approvers
      workflow.approvers.forEach((approver, index) => {
        const request = new ApprovalRequest({
          expenseId: expense._id,
          approverId: approver.userId._id,
          workflowId: workflow._id,
          sequence: workflow.isManagerApprover ? index + 1 : index,
          isRequired: approver.required,
          status: 'pending'
        });
        approvalRequests.push(request);
      });

      // Save all approval requests
      await ApprovalRequest.insertMany(approvalRequests);

      // If sequential workflow, only send to first approver
      if (workflow.approversSequence) {
        const firstRequest = approvalRequests[0];
        console.log(`Sequential workflow: Sending request to ${firstRequest.approverId}`);
        // In a real app, you would send notification/email here
      } else {
        // Parallel workflow, send to all approvers
        console.log(`Parallel workflow: Sending requests to ${approvalRequests.length} approvers`);
        // In a real app, you would send notifications/emails here
      }

      return { 
        success: true, 
        message: 'Approval workflow initialized',
        approvalRequests: approvalRequests.length,
        isSequential: workflow.approversSequence
      };

    } catch (error) {
      console.error('Error initializing approval workflow:', error);
      throw error;
    }
  }

  // Process an approval/rejection
  static async processApproval(approvalRequestId, action, comment = '') {
    try {
      const approvalRequest = await ApprovalRequest.findById(approvalRequestId)
        .populate('expenseId')
        .populate('workflowId');

      if (!approvalRequest) {
        throw new Error('Approval request not found');
      }

      if (approvalRequest.status !== 'pending') {
        throw new Error('Approval request already processed');
      }

      // Update the approval request
      approvalRequest.status = action;
      approvalRequest.comment = comment;
      
      if (action === 'approved') {
        approvalRequest.approvedAt = new Date();
      } else {
        approvalRequest.rejectedAt = new Date();
      }

      await approvalRequest.save();

      // Check if this was a rejection of a required approver
      if (action === 'rejected' && approvalRequest.isRequired) {
        // Reject the entire expense
        const expense = approvalRequest.expenseId;
        expense.status = 'rejected';
        expense.rejectedBy = approvalRequest.approverId;
        expense.rejectedAt = new Date();
        await expense.save();

        // Cancel all pending approval requests
        await ApprovalRequest.updateMany(
          { expenseId: expense._id, status: 'pending' },
          { status: 'cancelled' }
        );

        return { 
          success: true, 
          message: 'Expense rejected due to required approver rejection',
          expenseStatus: 'rejected'
        };
      }

      // Check if approval workflow is complete
      const result = await this.checkApprovalCompletion(approvalRequest.expenseId._id);
      
      return {
        success: true,
        message: `Approval ${action} successfully`,
        ...result
      };

    } catch (error) {
      console.error('Error processing approval:', error);
      throw error;
    }
  }

  // Check if approval workflow is complete
  static async checkApprovalCompletion(expenseId) {
    try {
      const expense = await Expense.findById(expenseId);
      const workflow = await ApprovalWorkflow.findOne({ userId: expense.userId });
      
      if (!workflow) {
        return { expenseStatus: 'approved', message: 'No workflow found' };
      }

      const approvalRequests = await ApprovalRequest.find({ 
        expenseId: expenseId 
      }).populate('approverId', 'name email');

      const totalApprovers = approvalRequests.length;
      const approvedCount = approvalRequests.filter(req => req.status === 'approved').length;
      const rejectedCount = approvalRequests.filter(req => req.status === 'rejected').length;
      const pendingCount = approvalRequests.filter(req => req.status === 'pending').length;

      // Check if any required approver rejected
      const requiredRejected = approvalRequests.some(req => 
        req.isRequired && req.status === 'rejected'
      );

      if (requiredRejected) {
        expense.status = 'rejected';
        await expense.save();
        return { expenseStatus: 'rejected', message: 'Required approver rejected' };
      }

      // Check minimum approval percentage
      const approvalPercentage = (approvedCount / totalApprovers) * 100;
      const minimumRequired = workflow.minimumApprovalPercentage || 0;

      if (approvalPercentage >= minimumRequired) {
        expense.status = 'approved';
        expense.approvedAt = new Date();
        await expense.save();

        // Cancel remaining pending requests
        await ApprovalRequest.updateMany(
          { expenseId: expenseId, status: 'pending' },
          { status: 'cancelled' }
        );

        return { 
          expenseStatus: 'approved', 
          message: `Approval threshold met (${approvalPercentage.toFixed(1)}% >= ${minimumRequired}%)`,
          approvalPercentage: approvalPercentage,
          approvedCount: approvedCount,
          totalApprovers: totalApprovers
        };
      }

      // Check if sequential workflow needs to proceed to next approver
      if (workflow.approversSequence && pendingCount > 0) {
        const nextApprover = await this.getNextSequentialApprover(expenseId);
        if (nextApprover) {
          console.log(`Sequential workflow: Moving to next approver ${nextApprover.approverId}`);
          // In a real app, you would send notification here
        }
      }

      return { 
        expenseStatus: 'pending', 
        message: `Approval in progress (${approvalPercentage.toFixed(1)}% of ${minimumRequired}% required)`,
        approvalPercentage: approvalPercentage,
        approvedCount: approvedCount,
        totalApprovers: totalApprovers,
        pendingCount: pendingCount
      };

    } catch (error) {
      console.error('Error checking approval completion:', error);
      throw error;
    }
  }

  // Get next sequential approver
  static async getNextSequentialApprover(expenseId) {
    try {
      const workflow = await ApprovalWorkflow.findOne({ 
        userId: (await Expense.findById(expenseId)).userId 
      });

      if (!workflow || !workflow.approversSequence) {
        return null;
      }

      // Find the highest sequence that has been approved
      const approvedRequests = await ApprovalRequest.find({
        expenseId: expenseId,
        status: 'approved'
      }).sort({ sequence: -1 });

      if (approvedRequests.length === 0) {
        return null;
      }

      const highestApprovedSequence = approvedRequests[0].sequence;

      // Find the next pending request
      const nextRequest = await ApprovalRequest.findOne({
        expenseId: expenseId,
        status: 'pending',
        sequence: highestApprovedSequence + 1
      });

      return nextRequest;

    } catch (error) {
      console.error('Error getting next sequential approver:', error);
      return null;
    }
  }

  // Get approval requests for an expense
  static async getApprovalRequests(expenseId) {
    try {
      const requests = await ApprovalRequest.find({ expenseId })
        .populate('approverId', 'name email role')
        .populate('workflowId')
        .sort({ sequence: 1 });

      return requests;
    } catch (error) {
      console.error('Error getting approval requests:', error);
      throw error;
    }
  }

  // Get pending approvals for a manager
  static async getPendingApprovalsForManager(managerId) {
    try {
      const requests = await ApprovalRequest.find({
        approverId: managerId,
        status: 'pending'
      })
      .populate('expenseId')
      .populate('workflowId')
      .sort({ createdAt: -1 });

      return requests;
    } catch (error) {
      console.error('Error getting pending approvals for manager:', error);
      throw error;
    }
  }
}

module.exports = ApprovalWorkflowService;
