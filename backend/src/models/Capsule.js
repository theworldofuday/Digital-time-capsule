const mongoose = require('mongoose');

const capsuleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    minlength: [1, 'Title cannot be empty'],
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    minlength: [1, 'Description cannot be empty'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  content: {
    message: {
      type: String,
      default: ''
    },
    files: [{
      filename: String,
      originalName: String,
      mimetype: String,
      size: Number,
      path: String,
      encryptedPath: String,
      isEncrypted: {
        type: Boolean,
        default: true
      }
    }]
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdDate: {
    type: Date,
    default: Date.now
  },
  revealDate: {
    type: Date,
    required: [true, 'Reveal date is required'],
    validate: {
      validator: function(date) {
        return date > new Date();
      },
      message: 'Reveal date must be in the future'
    }
  },
  isRevealed: {
    type: Boolean,
    default: false
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }],
  category: {
    type: String,
    enum: ['personal', 'family', 'friendship', 'achievement', 'memory', 'wish', 'prediction', 'other'],
    default: 'other'
  },
  encryptionData: {
    algorithm: {
      type: String,
      default: 'aes-256-gcm'
    },
    iv: String,
    authTag: String,
    encryptedKey: String
  },
  views: {
    type: Number,
    default: 0
  },
  likes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    likedAt: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    text: {
      type: String,
      required: true,
      maxlength: [500, 'Comment cannot exceed 500 characters']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  position: {
    x: {
      type: Number,
      default: () => Math.random() * 100 - 50
    },
    y: {
      type: Number,
      default: () => Math.random() * 100 - 50
    },
    z: {
      type: Number,
      default: () => Math.random() * 100 - 50
    }
  },
  color: {
    type: String,
    default: () => {
      const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3', '#54A0FF'];
      return colors[Math.floor(Math.random() * colors.length)];
    }
  }
}, {
  timestamps: true
});

// Indexes for performance
capsuleSchema.index({ creator: 1 });
capsuleSchema.index({ revealDate: 1 });
capsuleSchema.index({ isRevealed: 1 });
capsuleSchema.index({ isPublic: 1 });
capsuleSchema.index({ category: 1 });
capsuleSchema.index({ tags: 1 });
capsuleSchema.index({ createdDate: -1 });

// Virtual for time remaining
capsuleSchema.virtual('timeRemaining').get(function() {
  if (this.isRevealed) return 0;
  const now = new Date();
  const timeLeft = this.revealDate.getTime() - now.getTime();
  return Math.max(0, timeLeft);
});

// Virtual for days remaining
capsuleSchema.virtual('daysRemaining').get(function() {
  const timeRemaining = this.timeRemaining;
  return Math.ceil(timeRemaining / (1000 * 60 * 60 * 24));
});

// Virtual for like count
capsuleSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

// Virtual for comment count
capsuleSchema.virtual('commentCount').get(function() {
  return this.comments.length;
});

// Ensure virtuals are included in JSON
capsuleSchema.set('toJSON', { virtuals: true });

// Pre-save middleware to validate reveal date
capsuleSchema.pre('save', function(next) {
  if (this.isNew && this.revealDate <= new Date()) {
    next(new Error('Reveal date must be in the future'));
  } else {
    next();
  }
});

// Static method to find public capsules
capsuleSchema.statics.findPublic = function() {
  return this.find({ isPublic: true }).populate('creator', 'username avatar');
};

// Static method to find revealed capsules
capsuleSchema.statics.findRevealed = function() {
  return this.find({ isRevealed: true, isPublic: true }).populate('creator', 'username avatar');
};

// Static method to find pending capsules
capsuleSchema.statics.findPending = function() {
  return this.find({ isRevealed: false, isPublic: true }).populate('creator', 'username avatar');
};

module.exports = mongoose.model('Capsule', capsuleSchema);