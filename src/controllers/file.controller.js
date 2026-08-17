const path = require('path');
const User = require('../models/user.model');
const { AppError } = require('../middlewares/error.middleware');

/**
 * Upload single file
 * POST /api/v1/files/upload
 */
exports.uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new AppError('Please upload a file.', 400));
    }

    // Construct accessible static file URL
    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

    // Optionally set as avatar if isAvatar query param or body field is true
    if (req.body.isAvatar === 'true' || req.query.isAvatar === 'true') {
      await User.findByIdAndUpdate(req.user._id, { avatarUrl: fileUrl });
    }

    res.status(201).json({
      status: 'success',
      message: 'File uploaded successfully.',
      data: {
        fileName: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        fileUrl,
      },
    });
  } catch (error) {
    next(error);
  }
};
