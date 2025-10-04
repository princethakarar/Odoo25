const mongoose = require('mongoose');

const approvalRequestSchema = new mongoose.Schema({
  expenseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Expense',
    required: true
  },
  approverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  workflowId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ApprovalWorkflow',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  sequence: {
    type: Number,
    default: 0
  },
  isRequired: {
    type: Boolean,
    default: false
  },
  comment: {
    type: String,
    default: null
  },
  approvedAt: {
    type: Date,
    default: null
  },
  rejectedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  collection: 'approvalRequests'
});

// Index for efficient queries
approvalRequestSchema.index({ expenseId: 1, approverId: 1 });
approvalRequestSchema.index({ expenseId: 1, status: 1 });

module.exports = mongoose.model('ApprovalRequest', approvalRequestSchema);
