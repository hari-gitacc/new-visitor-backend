const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema({
  personalPhoneNumber: String,
  name: String,
  companyPhoneNumber: String,
  address: String,
  visitingCardImageUrl: String,
  otpVerified: Boolean,
  captureMethod: String,
  createdAt: Date,
  updatedAt: Date
});

module.exports = mongoose.model('Visitor', visitorSchema);