const Visitor = require('../models/Visitor');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Logic to upload the file to Cloudinary
const uploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream((error, result) => {
      if (result) {
        resolve(result);
      } else {
        reject(error);
      }
    });
    streamifier.createReadStream(fileBuffer).pipe(stream);
  });
};

// Main controller function
exports.uploadCard = async (req, res) => {
  try {
    const { mobileNumber } = req.body;
    if (!req.file || !mobileNumber) {
      return res.status(400).json({ message: 'Mobile number and image file are required.' });
    }

    // Upload image to Cloudinary
    const uploadResult = await uploadToCloudinary(req.file.buffer);
    
    // Create new visitor record in MongoDB
    const newVisitor = new Visitor({
      mobileNumber,
      visitingCardImageUrl: uploadResult.secure_url,
    });

    await newVisitor.save();

    res.status(201).json({ 
      message: 'Visitor details uploaded successfully!', 
      data: newVisitor 
    });

  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ message: 'Server error during upload.' });
  }
};