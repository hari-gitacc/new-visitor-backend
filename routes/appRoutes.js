// visitors/backend/routes/appRoutes.js

const express = require('express');
const router = express.Router();
const visitorController = require('../controllers/visitorController');
const authController = require('../controllers/authController');
const adminController = require('../controllers/adminController');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// Visitor related routes
router.post('/visitors/upload', upload.single('visitingCard'), visitorController.uploadCard);

// Admin related routes
router.post('/admin/login', authController.adminLogin);
router.get('/admin/visitors', authController.verifyAdminApiKey, adminController.getAllVisitors);
router.put('/admin/visitors/:id', authController.verifyAdminApiKey, adminController.updateVisitor);
// NEW: Route for deleting visitor by ID
router.delete('/admin/visitors/:id', authController.verifyAdminApiKey, adminController.deleteVisitor); // Add this line

module.exports = router;