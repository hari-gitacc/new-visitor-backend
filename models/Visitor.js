const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema({
  mobileNumber: {
    type: String,
    required: true
  },
  visitingCardImageUrl: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Visitor', visitorSchema);