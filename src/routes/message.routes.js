const express = require('express');
const messageController = require('../controllers/message.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(protect);

router.post('/send', messageController.sendMessage);
router.get('/conversation/:userId', messageController.getConversation);
router.put('/read/:messageId', messageController.markAsRead);

module.exports = router;
