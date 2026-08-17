const Message = require('../models/message.model');
const User = require('../models/user.model');
const { AppError } = require('../middlewares/error.middleware');

/**
 * Send a direct message
 * POST /api/v1/messages/send
 */
exports.sendMessage = async (req, res, next) => {
  try {
    const { recipientId, recipientUsername, content, attachments } = req.body;

    if (!content) {
      return next(new AppError('Message content is required.', 400));
    }

    let recipient;
    if (recipientId) {
      recipient = await User.findById(recipientId);
    } else if (recipientUsername) {
      recipient = await User.findOne({ username: recipientUsername });
    }

    if (!recipient) {
      return next(new AppError('Recipient user not found.', 404));
    }

    if (recipient._id.toString() === req.user._id.toString()) {
      return next(new AppError('You cannot send a message to yourself.', 400));
    }

    const message = await Message.create({
      sender: req.user._id,
      recipient: recipient._id,
      content,
      attachments: attachments || [],
    });

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'username avatarUrl')
      .populate('recipient', 'username avatarUrl');

    res.status(201).json({
      status: 'success',
      data: {
        message: populatedMessage,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Conversation History with another User
 * GET /api/v1/messages/conversation/:userId
 */
exports.getConversation = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const messages = await Message.find({
      $or: [
        { sender: req.user._id, recipient: userId },
        { sender: userId, recipient: req.user._id },
      ],
    })
      .sort('createdAt')
      .populate('sender', 'username avatarUrl')
      .populate('recipient', 'username avatarUrl');

    res.status(200).json({
      status: 'success',
      results: messages.length,
      data: {
        messages,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark message as read
 * PUT /api/v1/messages/read/:messageId
 */
exports.markAsRead = async (req, res, next) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findOne({
      _id: messageId,
      recipient: req.user._id,
    });

    if (!message) {
      return next(new AppError('Message not found or unauthorized.', 404));
    }

    message.isRead = true;
    message.readAt = new Date();
    await message.save();

    res.status(200).json({
      status: 'success',
      data: {
        message,
      },
    });
  } catch (error) {
    next(error);
  }
};
