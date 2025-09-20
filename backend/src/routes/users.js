const express = require('express');
const User = require('../models/User');
const Capsule = require('../models/Capsule');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get user profile by username
router.get('/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .select('-email')
      .populate({
        path: 'capsulesCreated',
        match: { isPublic: true },
        select: 'title description createdDate revealDate isRevealed category views likes comments',
        options: { sort: { createdDate: -1 } }
      });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const stats = await Capsule.aggregate([
      { $match: { creator: user._id, isPublic: true } },
      {
        $group: {
          _id: null,
          totalCapsules: { $sum: 1 },
          totalViews: { $sum: '$views' },
          totalLikes: { $sum: { $size: '$likes' } },
          revealedCapsules: {
            $sum: { $cond: ['$isRevealed', 1, 0] }
          }
        }
      }
    ]);

    const userStats = stats[0] || {
      totalCapsules: 0,
      totalViews: 0,
      totalLikes: 0,
      revealedCapsules: 0
    };

    res.json({
      user: {
        id: user._id,
        username: user.username,
        bio: user.bio,
        avatar: user.avatar,
        joinDate: user.joinDate,
        ...userStats,
        capsules: user.capsulesCreated
      }
    });
  } catch (error) {
    console.error('User profile fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch user profile', error: error.message });
  }
});

// Get leaderboard
router.get('/leaderboard/top', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const leaderboard = await User.aggregate([
      {
        $lookup: {
          from: 'capsules',
          localField: '_id',
          foreignField: 'creator',
          as: 'capsules'
        }
      },
      {
        $project: {
          username: 1,
          avatar: 1,
          joinDate: 1,
          totalCapsules: { $size: '$capsules' },
          totalViews: {
            $sum: {
              $map: {
                input: '$capsules',
                as: 'capsule',
                in: '$$capsule.views'
              }
            }
          },
          totalLikes: {
            $sum: {
              $map: {
                input: '$capsules',
                as: 'capsule',
                in: { $size: '$$capsule.likes' }
              }
            }
          }
        }
      },
      { $sort: { totalViews: -1, totalLikes: -1, totalCapsules: -1 } },
      { $limit: limit }
    ]);

    res.json({ leaderboard });
  } catch (error) {
    console.error('Leaderboard fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch leaderboard', error: error.message });
  }
});

module.exports = router;