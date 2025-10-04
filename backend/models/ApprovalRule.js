const mongoose = require('mongoose');

const approvalRuleSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  ruleType: {
    type: String,
    required: true,
    enum: ['specific', 'threshold']
  },
  thresholdPercentage: {
    type: Number,
    default: null,
    min: 0,
    max: 100
  },
  specificApproverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true,
  collection: 'approvalRules'
});

module.exports = mongoose.model('ApprovalRule', approvalRuleSchema);
