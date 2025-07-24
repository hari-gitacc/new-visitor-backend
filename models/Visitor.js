const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema({
  personalPhoneNumber: String,
  name: String,
  email: String,                    // New field
  companyName: String,             // New field
  companyPhoneNumber: String,
  address: String,
  visitingCardImageUrl: String,
  otpVerified: Boolean,
  captureMethod: String,
  emailSent: { type: Boolean, default: false },  // Track if email was sent
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Visitor', visitorSchema);