const mongoose = require('mongoose');

const approverSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  required: {
    type: Boolean,
    default: false
  },
  sequence: {
    type: Number,
    default: 0
  }
});

const approvalWorkflowSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  managerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  isManagerApprover: {
    type: Boolean,
    default: true
  },
  approvers: [approverSchema],
  approversSequence: {
    type: Boolean,
    default: false
  },
  minimumApprovalPercentage: {
    type: Number,
    default: null,
    min: 0,
    max: 100
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  collection: 'approvalWorkflows'
});

module.exports = mongoose.model('ApprovalWorkflow', approvalWorkflowSchema);
