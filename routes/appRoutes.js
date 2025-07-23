// visitors/backend/routes/appRoutes.js

const express = require('express');
const router = express.Router();
const visitorController = require('../controllers/visitorController');
const authController = require('../controllers/authController'); // New: Import auth controller
const adminController = require('../controllers/adminController'); // New: Import admin controller
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// Visitor related routes
router.post('/visitors/upload', upload.single('visitingCard'), visitorController.uploadCard);

// Admin related routes
router.post('/admin/login', authController.adminLogin); // New: Admin login route
router.get('/admin/visitors', authController.verifyAdminApiKey, adminController.getAllVisitors); // New: Protected route to get all visitors

module.exports = router;