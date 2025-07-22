const Visitor = require('../models/Visitor');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload to Cloudinary with better error handling
const uploadToCloudinary = (fileBuffer, filename) => {
  return new Promise((resolve, reject) => {
    const options = {
      folder: 'visitor-cards', // Organize uploads
      public_id: filename,
      resource_type: 'image',
      quality: 'auto',
      fetch_format: 'auto'
    };

    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (result) {
        resolve(result);
      } else {
        console.error('Cloudinary upload error:', error);
        reject(error);
      }
    })
    
    streamifier.createReadStream(fileBuffer).pipe(stream);
  });
};

// Main controller function
exports.uploadCard = async (req, res) => {
  try {
    console.log('Upload request received');
    console.log('Body:', req.body);
    console.log('File:', req.file ? 'File present' : 'No file');

    const { mobileNumber, otpVerified, captureMethod } = req.body;

    // Validation
    if (!mobileNumber) {
      return res.status(400).json({ 
        success: false,
        message: 'Mobile number is required.' 
      });
    }

    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        message: 'Image file is required.' 
      });
    }

    // Validate mobile number format
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(mobileNumber)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid mobile number format.' 
      });
    }

    // Validate file type
    if (!req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({ 
        success: false,
        message: 'Only image files are allowed.' 
      });
    }

    // Validate file size (5MB limit)
    if (req.file.size > 5 * 1024 * 1024) {
      return res.status(400).json({ 
        success: false,
        message: 'File size must be less than 5MB.' 
      });
    }

    console.log('Uploading to Cloudinary...');
    
    // Generate unique filename
    const filename = `visitor_${mobileNumber}_${Date.now()}`;
    
    // Upload image to Cloudinary
    const uploadResult = await uploadToCloudinary(req.file.buffer, filename);
    
    console.log('Cloudinary upload successful:', uploadResult.secure_url);

    // Check if visitor with this mobile number already exists
    const existingVisitor = await Visitor.findOne({ mobileNumber });
    
    let visitor;
    if (existingVisitor) {
      // Update existing visitor
      existingVisitor.visitingCardImageUrl = uploadResult.secure_url;
      existingVisitor.otpVerified = otpVerified === 'true';
      existingVisitor.captureMethod = captureMethod || 'upload';
      existingVisitor.updatedAt = new Date();
      
      visitor = await existingVisitor.save();
      console.log('Existing visitor updated:', visitor._id);
    } else {
      // Create new visitor record
      visitor = new Visitor({
        mobileNumber,
        visitingCardImageUrl: uploadResult.secure_url,
        otpVerified: otpVerified === 'true',
        captureMethod: captureMethod || 'upload',
      });

      visitor = await visitor.save();
      console.log('New visitor created:', visitor._id);
    }

    res.status(201).json({ 
      success: true,
      message: existingVisitor 
        ? 'Visitor details updated successfully!' 
        : 'Visitor details uploaded successfully!',
      data: {
        id: visitor._id,
        mobileNumber: visitor.mobileNumber,
        otpVerified: visitor.otpVerified,
        captureMethod: visitor.captureMethod,
        createdAt: visitor.createdAt,
        updatedAt: visitor.updatedAt
      }
    });

  } catch (error) {
    console.error('Upload Error:', error);
    
    // Handle specific errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        success: false,
        message: 'Validation error: ' + error.message 
      });
    }
    
    if (error.code === 11000) {
      return res.status(409).json({ 
        success: false,
        message: 'Visitor with this mobile number already exists.' 
      });
    }

    res.status(500).json({ 
      success: false,
      message: 'Server error during upload. Please try again.' 
    });
  }
};