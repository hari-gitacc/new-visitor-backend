const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema({
  mobileNumber: {
    type: String,
    required: [true, 'Mobile number is required'],
    unique: false, // Allow multiple entries for same number (updates)
    match: [/^[6-9]\d{9}$/, 'Invalid mobile number format'],
    index: true
  },
  visitingCardImageUrl: {
    type: String,
    required: [true, 'Visiting card image is required'],
  },
  otpVerified: {
    type: Boolean,
    default: false
  },
  captureMethod: {
    type: String,
    enum: ['camera', 'upload'],
    default: 'upload'
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  }
});

// Update the updatedAt field before saving
visitorSchema.pre('save', function(next) {
  if (!this.isNew) {
    this.updatedAt = Date.now();
  }
  next();
});

module.exports = mongoose.model('Visitor', visitorSchema);