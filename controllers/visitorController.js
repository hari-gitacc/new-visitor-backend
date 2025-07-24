const Visitor = require('../models/Visitor');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const sharp = require('sharp'); // Add this for image optimization

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Optimize image before upload
const optimizeImage = async (fileBuffer) => {
  try {
    // Resize and compress image
    const optimizedBuffer = await sharp(fileBuffer)
      .resize(1200, 800, { 
        fit: 'inside', 
        withoutEnlargement: true 
      })
      .jpeg({ 
        quality: 85, 
        progressive: true 
      })
      .toBuffer();
    
    console.log(`Image optimized: ${fileBuffer.length} bytes -> ${optimizedBuffer.length} bytes`);
    return optimizedBuffer;
  } catch (error) {
    console.error('Image optimization failed:', error);
    // Return original buffer if optimization fails
    return fileBuffer;
  }
};

// Upload to Cloudinary with better optimization settings
const uploadToCloudinary = (fileBuffer, filename) => {
  return new Promise((resolve, reject) => {
    const options = {
      folder: 'visitor-cards',
      public_id: filename,
      resource_type: 'image',
      quality: 'auto:good',        // Automatic quality optimization
      fetch_format: 'auto',       // Automatic format optimization
      flags: 'progressive',       // Progressive JPEG loading
      transformation: [
        {
          width: 1200,
          height: 800,
          crop: 'limit',           // Don't upscale images
          quality: 'auto:good'
        }
      ]
    };

    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (result) {
        resolve(result);
      } else {
        console.error('Cloudinary upload error:', error);
        reject(error);
      }
    });

    streamifier.createReadStream(fileBuffer).pipe(stream);
  });
};

// Main controller function with optimizations
exports.uploadCard = async (req, res) => {
  try {
    console.log('Upload request received');
    console.log('Body:', req.body);
    console.log('File size:', req.file ? `${(req.file.size / 1024 / 1024).toFixed(2)}MB` : 'No file');

    const { 
      personalPhoneNumber, 
      email,                    // New field
      companyName,             // New field
      companyPhoneNumber, 
      smsVerified,             // Updated from otpVerified
      captureMethod 
    } = req.body;

    // Enhanced validation
    if (!personalPhoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Personal mobile number is required.'
      });
    }

    // if (!name || !name.trim()) {
    //   return res.status(400).json({
    //     success: false,
    //     message: 'Name is required.'
    //   });
    // }

    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Email is required.'
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format.'
      });
    }

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

    // Increased size limit but we'll optimize the image
    if (req.file.size > 10 * 1024 * 1024) { // 10MB limit
      return res.status(400).json({
        success: false,
        message: 'File size must be less than 10MB.'
      });
    }

    console.log('Starting image optimization...');
    const startTime = Date.now();

    // Optimize image before upload
    const optimizedBuffer = await optimizeImage(req.file.buffer);
    console.log(`Image optimization completed in ${Date.now() - startTime}ms`);

    // Prepare database operations while uploading
    const filename = `visitor_${personalPhoneNumber}_${Date.now()}`;
    
    console.log('Starting Cloudinary upload...');
    const uploadStartTime = Date.now();

    // Parallel operations: Start upload and prepare database query
    const [uploadResult, existingVisitor] = await Promise.all([
      uploadToCloudinary(optimizedBuffer, filename),
      Visitor.findOne({ personalPhoneNumber })
    ]);

    console.log(`Cloudinary upload completed in ${Date.now() - uploadStartTime}ms`);
    console.log('Upload successful:', uploadResult.secure_url);

    // Database operations
    let visitor;
    const visitorData = {
      personalPhoneNumber,
      email: email.trim().toLowerCase(),     // New field
      companyName: companyName?.trim() || '', // New field
      companyPhoneNumber: companyPhoneNumber || '',
      visitingCardImageUrl: uploadResult.secure_url,
      smsVerified: smsVerified === 'true',   // Updated from otpVerified
      captureMethod: captureMethod || 'upload',
      emailSent: true,                       // New field
      updatedAt: new Date()
    };

    if (existingVisitor) {
      // Update existing visitor
      Object.assign(existingVisitor, visitorData);
      visitor = await existingVisitor.save();
      console.log('Existing visitor updated:', visitor._id);
    } else {
      // Create new visitor
      visitor = new Visitor({
        ...visitorData,
        createdAt: new Date()
      });
      visitor = await visitor.save();
      console.log('New visitor created:', visitor._id);
    }

    const totalTime = Date.now() - startTime;
    console.log(`Total processing time: ${totalTime}ms`);

    res.status(201).json({
      success: true,
      message: existingVisitor
        ? 'Visitor details updated successfully!'
        : 'Visitor details uploaded successfully!',
      data: {
        id: visitor._id,
        personalPhoneNumber: visitor.personalPhoneNumber,
        email: visitor.email,                    // New field
        companyName: visitor.companyName,        // New field
        companyPhoneNumber: visitor.companyPhoneNumber,
        smsVerified: visitor.smsVerified,        // Updated from otpVerified
        captureMethod: visitor.captureMethod,
        emailSent: visitor.emailSent,            // New field
        createdAt: visitor.createdAt,
        updatedAt: visitor.updatedAt,
        processingTime: `${totalTime}ms`         // Performance metric
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

    // Handle specific Cloudinary errors
    if (error.message && error.message.includes('Invalid image file')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid image file. Please upload a valid image.'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error during upload. Please try again.'
    });
  }
};