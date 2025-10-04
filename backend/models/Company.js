const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  country: {
    type: String,
    required: true,
    trim: true
  },
  currency: {
    type: String,
    required: true,
    trim: true
  }
}, {
  collection: 'companies' // Explicitly use the 'companies' collection
});

module.exports = mongoose.model('Company', companySchema);
