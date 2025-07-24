const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema({
  personalPhoneNumber: {
    type: String,
    required: [true, 'Personal mobile number is required'],
    unique: false,
    match: [/^[6-9]\d{9}$/, 'Invalid personal mobile number format'],
    index: true
  },
  name: {
    type: String,
    required: [false, 'Name is required'],
    trim: true,
    // REMOVED: minlength validation to allow empty string for name
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  companyPhoneNumber: {
    type: String,
    match: [/^[0-9]{10,15}$/, 'Invalid company phone number format'],
    sparse: true,
    default: ''
  },
  address: {
    type: String,
    trim: true,
    maxlength: [250, 'Address cannot exceed 250 characters'],
    default: ''
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

visitorSchema.pre('save', function(next) {
  if (!this.isNew) {
    this.updatedAt = Date.now();
  }
  next();
});

module.exports = mongoose.model('Visitor', visitorSchema);