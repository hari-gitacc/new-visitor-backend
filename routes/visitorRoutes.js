const express = require('express');
const multer = require('multer');
const visitorController = require('../controllers/visitorController');

const router = express.Router();

// Use multer for in-memory storage, so the file buffer is available
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post('/upload', upload.single('visitingCard'), visitorController.uploadCard);

module.exports = router;