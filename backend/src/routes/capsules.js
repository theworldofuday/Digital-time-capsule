const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Capsule = require('../models/Capsule');
const User = require('../models/User');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { upload, FileProcessor } = require('../utils/fileHandler');
const encryptionService = require('../utils/encryption');
const path = require('path');

const router = express.Router();

// Create new time capsule
router.post('/', authenticateToken, upload.array('files', 10), [
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 200 })
    .withMessage('Title cannot exceed 200 characters'),
  body('description')
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ max: 2000 })
    .withMessage('Description cannot exceed 2000 characters'),
  body('revealDate')
    .isISO8601()
    .withMessage('Invalid reveal date format'),
  body('message')
    .optional()
    .isLength({ max: 5000 })
    .withMessage('Message cannot exceed 5000 characters'),
  body('category')
    .optional()
    .isIn(['personal', 'family', 'friendship', 'achievement', 'memory', 'wish', 'prediction', 'other'])
    .withMessage('Invalid category'),
  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { title, description, revealDate, message, category, isPublic, tags } = req.body;
    const revealDateTime = new Date(revealDate);

    // Validate reveal date is in the future
    if (revealDateTime <= new Date()) {
      return res.status(400).json({ message: 'Reveal date must be in the future' });
    }

    // Process uploaded files
    const processedFiles = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const fileInfo = FileProcessor.getFileInfo(file);
          
          // Generate thumbnail for images and videos
          let thumbnailPath = null;
          if (file.mimetype.startsWith('image/')) {
            thumbnailPath = await FileProcessor.generateThumbnail(file.path, 'image');
          } else if (file.mimetype.startsWith('video/')) {
            thumbnailPath = await FileProcessor.generateThumbnail(file.path, 'video');
          }

          // Encrypt the file
          const encryptionResult = await encryptionService.encryptFile(file.path);
          
          processedFiles.push({
            ...fileInfo,
            thumbnailPath,
            encryptedPath: encryptionResult.encryptedPath,
            encryptionKey: encryptionResult.key,
            isEncrypted: true
          });
        } catch (error) {
          console.error('File processing error:', error);
          // Continue with other files, but log the error
        }
      }
    }

    // Encrypt the message if provided
    let encryptedMessage = null;
    let messageEncryption = null;
    if (message) {
      const messageResult = await encryptionService.encryptText(message);
      encryptedMessage = messageResult.encrypted;
      messageEncryption = {
        key: messageResult.key,
        iv: messageResult.iv,
        authTag: messageResult.authTag
      };
    }

    // Create time capsule
    const capsule = new Capsule({
      title,
      description,
      content: {
        message: encryptedMessage,
        files: processedFiles
      },
      creator: req.user._id,
      revealDate: revealDateTime,
      isPublic: isPublic !== undefined ? isPublic : true,
      category: category || 'other',
      tags: tags || [],
      encryptionData: messageEncryption
    });

    await capsule.save();

    // Add capsule to user's created capsules
    await User.findByIdAndUpdate(req.user._id, {
      $push: { capsulesCreated: capsule._id }
    });

    // Populate creator info for response
    await capsule.populate('creator', 'username avatar');

    res.status(201).json({
      message: 'Time capsule created successfully',
      capsule: {
        id: capsule._id,
        title: capsule.title,
        description: capsule.description,
        creator: capsule.creator,
        createdDate: capsule.createdDate,
        revealDate: capsule.revealDate,
        category: capsule.category,
        tags: capsule.tags,
        isPublic: capsule.isPublic,
        timeRemaining: capsule.timeRemaining,
        daysRemaining: capsule.daysRemaining,
        position: capsule.position,
        color: capsule.color
      }
    });
  } catch (error) {
    console.error('Capsule creation error:', error);
    res.status(500).json({ message: 'Failed to create time capsule', error: error.message });
  }
});

// Get all public capsules
router.get('/', optionalAuth, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('category').optional().isIn(['personal', 'family', 'friendship', 'achievement', 'memory', 'wish', 'prediction', 'other']),
  query('status').optional().isIn(['all', 'pending', 'revealed']),
  query('sort').optional().isIn(['newest', 'oldest', 'reveal-date', 'popular'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const category = req.query.category;
    const status = req.query.status || 'all';
    const sort = req.query.sort || 'newest';
    const search = req.query.search;

    // Build query
    const query = { isPublic: true };
    
    if (category) {
      query.category = category;
    }

    if (status === 'pending') {
      query.isRevealed = false;
    } else if (status === 'revealed') {
      query.isRevealed = true;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Build sort
    let sortOptions = {};
    switch (sort) {
      case 'oldest':
        sortOptions = { createdDate: 1 };
        break;
      case 'reveal-date':
        sortOptions = { revealDate: 1 };
        break;
      case 'popular':
        sortOptions = { views: -1, 'likes.length': -1 };
        break;
      default: // newest
        sortOptions = { createdDate: -1 };
    }

    const skip = (page - 1) * limit;

    const [capsules, totalCount] = await Promise.all([
      Capsule.find(query)
        .populate('creator', 'username avatar')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),
      Capsule.countDocuments(query)
    ]);

    // Add computed fields and remove sensitive data for unrevealed capsules
    const processedCapsules = capsules.map(capsule => {
      const processed = {
        id: capsule._id,
        title: capsule.title,
        description: capsule.description,
        creator: capsule.creator,
        createdDate: capsule.createdDate,
        revealDate: capsule.revealDate,
        isRevealed: capsule.isRevealed,
        category: capsule.category,
        tags: capsule.tags,
        views: capsule.views,
        likeCount: capsule.likes?.length || 0,
        commentCount: capsule.comments?.length || 0,
        position: capsule.position,
        color: capsule.color,
        timeRemaining: capsule.isRevealed ? 0 : Math.max(0, new Date(capsule.revealDate).getTime() - new Date().getTime()),
        daysRemaining: capsule.isRevealed ? 0 : Math.ceil(Math.max(0, new Date(capsule.revealDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      };

      // Only include content if revealed or user is the creator
      if (capsule.isRevealed || (req.user && capsule.creator._id.toString() === req.user._id.toString())) {
        processed.content = capsule.content;
      }

      return processed;
    });

    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      capsules: processedCapsules,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Capsules fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch capsules', error: error.message });
  }
});

// Get specific capsule by ID
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const capsule = await Capsule.findById(req.params.id)
      .populate('creator', 'username avatar bio joinDate')
      .populate('comments.user', 'username avatar');

    if (!capsule) {
      return res.status(404).json({ message: 'Capsule not found' });
    }

    // Check if capsule is public or user is the creator
    if (!capsule.isPublic && (!req.user || capsule.creator._id.toString() !== req.user._id.toString())) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Increment view count (only if not the creator)
    if (!req.user || capsule.creator._id.toString() !== req.user._id.toString()) {
      capsule.views += 1;
      await capsule.save();
    }

    const response = {
      id: capsule._id,
      title: capsule.title,
      description: capsule.description,
      creator: capsule.creator,
      createdDate: capsule.createdDate,
      revealDate: capsule.revealDate,
      isRevealed: capsule.isRevealed,
      category: capsule.category,
      tags: capsule.tags,
      views: capsule.views,
      likes: capsule.likes,
      comments: capsule.comments,
      position: capsule.position,
      color: capsule.color,
      timeRemaining: capsule.timeRemaining,
      daysRemaining: capsule.daysRemaining,
      likeCount: capsule.likeCount,
      commentCount: capsule.commentCount
    };

    // Only include content if revealed or user is the creator
    if (capsule.isRevealed || (req.user && capsule.creator._id.toString() === req.user._id.toString())) {
      // Decrypt content if revealed
      if (capsule.isRevealed && capsule.content.message && capsule.encryptionData) {
        try {
          const decryptedMessage = await encryptionService.decryptText({
            encrypted: capsule.content.message,
            key: capsule.encryptionData.encryptedKey,
            iv: capsule.encryptionData.iv,
            authTag: capsule.encryptionData.authTag
          });
          response.content = {
            ...capsule.content,
            message: decryptedMessage
          };
        } catch (error) {
          console.error('Decryption error:', error);
          response.content = capsule.content;
        }
      } else {
        response.content = capsule.content;
      }
    }

    res.json(response);
  } catch (error) {
    console.error('Capsule fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch capsule', error: error.message });
  }
});

// Like/Unlike capsule
router.post('/:id/like', authenticateToken, async (req, res) => {
  try {
    const capsule = await Capsule.findById(req.params.id);
    
    if (!capsule) {
      return res.status(404).json({ message: 'Capsule not found' });
    }

    if (!capsule.isPublic) {
      return res.status(403).json({ message: 'Cannot like private capsule' });
    }

    const existingLike = capsule.likes.find(like => 
      like.user.toString() === req.user._id.toString()
    );

    if (existingLike) {
      // Unlike
      capsule.likes = capsule.likes.filter(like => 
        like.user.toString() !== req.user._id.toString()
      );
      await capsule.save();
      res.json({ message: 'Capsule unliked', likeCount: capsule.likes.length });
    } else {
      // Like
      capsule.likes.push({ user: req.user._id });
      await capsule.save();
      res.json({ message: 'Capsule liked', likeCount: capsule.likes.length });
    }
  } catch (error) {
    console.error('Like toggle error:', error);
    res.status(500).json({ message: 'Failed to toggle like', error: error.message });
  }
});

// Add comment to capsule
router.post('/:id/comments', authenticateToken, [
  body('text')
    .notEmpty()
    .withMessage('Comment text is required')
    .isLength({ max: 500 })
    .withMessage('Comment cannot exceed 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { text } = req.body;
    const capsule = await Capsule.findById(req.params.id);
    
    if (!capsule) {
      return res.status(404).json({ message: 'Capsule not found' });
    }

    if (!capsule.isPublic) {
      return res.status(403).json({ message: 'Cannot comment on private capsule' });
    }

    capsule.comments.push({
      user: req.user._id,
      text
    });

    await capsule.save();
    await capsule.populate('comments.user', 'username avatar');

    const newComment = capsule.comments[capsule.comments.length - 1];

    res.status(201).json({
      message: 'Comment added successfully',
      comment: newComment
    });
  } catch (error) {
    console.error('Comment creation error:', error);
    res.status(500).json({ message: 'Failed to add comment', error: error.message });
  }
});

// Get user's own capsules
router.get('/user/my-capsules', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [capsules, totalCount] = await Promise.all([
      Capsule.find({ creator: req.user._id })
        .sort({ createdDate: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Capsule.countDocuments({ creator: req.user._id })
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      capsules,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('User capsules fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch user capsules', error: error.message });
  }
});

// Delete capsule (only creator can delete)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const capsule = await Capsule.findById(req.params.id);
    
    if (!capsule) {
      return res.status(404).json({ message: 'Capsule not found' });
    }

    if (capsule.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied. You can only delete your own capsules.' });
    }

    // Delete associated files
    if (capsule.content.files && capsule.content.files.length > 0) {
      for (const file of capsule.content.files) {
        try {
          await FileProcessor.deleteFile(file.path);
          if (file.encryptedPath) {
            await FileProcessor.deleteFile(file.encryptedPath);
          }
          if (file.thumbnailPath) {
            await FileProcessor.deleteFile(file.thumbnailPath);
          }
        } catch (error) {
          console.error('File deletion error:', error);
        }
      }
    }

    await Capsule.findByIdAndDelete(req.params.id);

    // Remove from user's created capsules
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { capsulesCreated: req.params.id }
    });

    res.json({ message: 'Capsule deleted successfully' });
  } catch (error) {
    console.error('Capsule deletion error:', error);
    res.status(500).json({ message: 'Failed to delete capsule', error: error.message });
  }
});

module.exports = router;