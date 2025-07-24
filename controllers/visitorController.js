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
      folder: 'visitor-cards',
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

    const { personalPhoneNumber, name, companyPhoneNumber, address, otpVerified, captureMethod } = req.body;

    // Validation
    if (!personalPhoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Personal mobile number is required.'
      });
    }
    // REMOVED: Name is no longer required here
    // if (!name) {
    //   return res.status(400).json({
    //     success: false,
    //     message: 'Name is required.'
    //   });
    // }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Image file is required.'
      });
    }

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(personalPhoneNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid personal mobile number format.'
      });
    }

    if (companyPhoneNumber && !/^[0-9]{10,15}$/.test(companyPhoneNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid company phone number format. Must be 10-15 digits.'
      });
    }

    if (!req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({
        success: false,
        message: 'Only image files are allowed.'
      });
    }

    if (req.file.size > 5 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: 'File size must be less than 5MB.'
      });
    }

    console.log('Uploading to Cloudinary...');

    const filename = `visitor_${personalPhoneNumber}_${Date.now()}`;

    const uploadResult = await uploadToCloudinary(req.file.buffer, filename);

    console.log('Cloudinary upload successful:', uploadResult.secure_url);

    const existingVisitor = await Visitor.findOne({ personalPhoneNumber });

    let visitor;
    if (existingVisitor) {
      existingVisitor.visitingCardImageUrl = uploadResult.secure_url;
      existingVisitor.otpVerified = otpVerified === 'true';
      existingVisitor.captureMethod = captureMethod || 'upload';
      existingVisitor.name = name || ''; // Set to empty string if not provided
      existingVisitor.companyPhoneNumber = companyPhoneNumber || '';
      existingVisitor.address = address || '';
      existingVisitor.updatedAt = new Date();

      visitor = await existingVisitor.save();
      console.log('Existing visitor updated:', visitor._id);
    } else {
      visitor = new Visitor({
        personalPhoneNumber,
        name: name || '', // Set to empty string if not provided
        companyPhoneNumber: companyPhoneNumber || '',
        address: address || '',
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
        personalPhoneNumber: visitor.personalPhoneNumber,
        name: visitor.name,
        companyPhoneNumber: visitor.companyPhoneNumber,
        address: visitor.address,
        otpVerified: visitor.otpVerified,
        captureMethod: visitor.captureMethod,
        createdAt: visitor.createdAt,
        updatedAt: visitor.updatedAt
      }
    });

  } catch (error) {
    console.error('Upload Error:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error: ' + error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error during upload. Please try again.'
    });
  }
};