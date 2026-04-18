const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const ocrController = require('../controllers/ocr.controller');

router.post('/save', authMiddleware, ocrController.saveOCR);
router.get('/results', authMiddleware, ocrController.getOCR);

module.exports = router;
