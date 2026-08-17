const express = require('express');
const fileController = require('../controllers/file.controller');
const upload = require('../middlewares/upload.middleware');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();

router.post('/upload', protect, upload.single('file'), fileController.uploadFile);

module.exports = router;
