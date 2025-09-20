import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Clock, Eye, Heart, MessageCircle, Share2, Download, User, Tag } from 'lucide-react';
import { TimeCapsule } from '../types';
import { capsulesApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { formatDistanceToNow, format } from 'date-fns';
import toast from 'react-hot-toast';

const CapsuleDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [capsule, setCapsule] = useState<TimeCapsule | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  useEffect(() => {
    if (id) {
      loadCapsule(id);
    }
  }, [id]);

  useEffect(() => {
    if (capsule && user) {
      setIsLiked(capsule.likes.some(like => like.user === user.id));
    }
  }, [capsule, user]);

  const loadCapsule = async (capsuleId: string) => {
    try {
      setIsLoading(true);
      const data = await capsulesApi.getById(capsuleId);
      setCapsule(data);
    } catch (error: any) {
      console.error('Failed to load capsule:', error);
      if (error.response?.status === 404) {
        toast.error('Time capsule not found');
        navigate('/gallery');
      } else {
        toast.error('Failed to load time capsule');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = async () => {
    if (!user || !capsule) {
      toast.error('Please log in to like capsules');
      return;
    }

    try {
      await capsulesApi.like(capsule.id);
      
      // Update local state
      setCapsule(prev => {
        if (!prev) return null;
        
        const newLikes = isLiked
          ? prev.likes.filter(like => like.user !== user.id)
          : [...prev.likes, { user: user.id, likedAt: new Date().toISOString() }];
        
        return {
          ...prev,
          likes: newLikes,
          likeCount: newLikes.length
        };
      });
      
      setIsLiked(!isLiked);
      toast.success(isLiked ? 'Removed from favorites' : 'Added to favorites');
    } catch (error) {
      console.error('Failed to toggle like:', error);
      toast.error('Failed to update like status');
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !capsule) {
      toast.error('Please log in to comment');
      return;
    }

    if (!commentText.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    try {
      setIsSubmittingComment(true);
      const response = await capsulesApi.addComment(capsule.id, commentText.trim());
      
      // Update local state
      setCapsule(prev => {
        if (!prev) return null;
        return {
          ...prev,
          comments: [...prev.comments, response.comment],
          commentCount: prev.commentCount + 1
        };
      });
      
      setCommentText('');
      toast.success('Comment added successfully');
    } catch (error) {
      console.error('Failed to add comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: capsule?.title,
        text: capsule?.description,
        url: window.location.href
      });
    } catch (error) {
      // Fallback to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-16">
        <div className="glass rounded-lg p-8">
          <div className="flex items-center space-x-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            <span className="text-white text-lg">Loading time capsule...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!capsule) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-16">
        <div className="glass rounded-lg p-8 text-center">
          <Clock className="h-12 w-12 text-white/60 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Time capsule not found</h2>
          <p className="text-white/70 mb-4">This capsule may have been removed or doesn't exist.</p>
          <button
            onClick={() => navigate('/gallery')}
            className="btn-primary"
          >
            Back to Gallery
          </button>
        </div>
      </div>
    );
  }

  const timeProgress = capsule.isRevealed ? 1 : 
    Math.max(0, 1 - (capsule.timeRemaining / (1000 * 60 * 60 * 24 * 365)));

  return (
    <div className="min-h-screen pt-16">
      {/* Hero Section */}
      <div className="relative h-64 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative h-full flex items-center justify-center">
          <div className="text-center max-w-4xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                {capsule.title}
              </h1>
              <div className="flex items-center justify-center space-x-6 text-white/80">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>by {capsule.creator.username}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span>{format(new Date(capsule.createdDate), 'MMM d, yyyy')}</span>
                </div>
                <div className={`flex items-center space-x-2 ${capsule.isRevealed ? 'text-green-400' : 'text-orange-400'}`}>
                  <Clock className="h-4 w-4" />
                  <span>
                    {capsule.isRevealed 
                      ? `Revealed ${formatDistanceToNow(new Date(capsule.revealDate))} ago`
                      : `Reveals in ${capsule.daysRemaining} days`
                    }
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="card"
            >
              <h2 className="text-2xl font-semibold text-white mb-4">Description</h2>
              <p className="text-white/80 leading-relaxed">{capsule.description}</p>
            </motion.div>

            {/* Content (if revealed or user is creator) */}
            {(capsule.isRevealed || (user && capsule.creator.id === user.id)) && capsule.content && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="card"
              >
                <h2 className="text-2xl font-semibold text-white mb-4">
                  {capsule.isRevealed ? 'Revealed Content' : 'Preview (Creator Only)'}
                </h2>
                
                {capsule.content.message && (
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-white mb-3">Message</h3>
                    <div className="bg-white/5 rounded-lg p-4">
                      <p className="text-white/80 whitespace-pre-wrap">{capsule.content.message}</p>
                    </div>
                  </div>
                )}

                {capsule.content.files && capsule.content.files.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-white mb-3">
                      Files ({capsule.content.files.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {capsule.content.files.map((file, index) => (
                        <div key={index} className="bg-white/5 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              {file.mimetype.startsWith('image/') ? (
                                <img 
                                  src={`/api/uploads/${file.filename}`} 
                                  alt={file.originalName}
                                  className="w-12 h-12 object-cover rounded"
                                />
                              ) : (
                                <div className="w-12 h-12 bg-blue-500/20 rounded flex items-center justify-center">
                                  <span className="text-xs text-blue-300">
                                    {file.mimetype.split('/')[0]}
                                  </span>
                                </div>
                              )}
                              <div>
                                <p className="text-white text-sm">{file.originalName}</p>
                                <p className="text-white/60 text-xs">
                                  {(file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                            </div>
                            <button className="text-blue-400 hover:text-blue-300 transition-colors">
                              <Download className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Locked Content Preview */}
            {!capsule.isRevealed && (!user || capsule.creator.id !== user.id) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="card text-center"
              >
                <div className="py-12">
                  <Clock className="h-16 w-16 text-white/40 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">Content Locked</h3>
                  <p className="text-white/70 mb-4">
                    This time capsule will be revealed in {capsule.daysRemaining} days
                  </p>
                  
                  {/* Progress bar */}
                  <div className="max-w-md mx-auto">
                    <div className="bg-white/10 rounded-full h-2 mb-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${timeProgress * 100}%` }}
                      />
                    </div>
                    <p className="text-white/60 text-sm">
                      {Math.round(timeProgress * 100)}% of time elapsed
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Comments */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="card"
            >
              <h2 className="text-2xl font-semibold text-white mb-6">
                Comments ({capsule.commentCount})
              </h2>

              {/* Add Comment */}
              {user && (
                <form onSubmit={handleComment} className="mb-6">
                  <div className="flex space-x-4">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-sm font-medium">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <textarea
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Add a comment..."
                        className="input-field w-full h-20 resize-none"
                        maxLength={500}
                      />
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-white/60 text-xs">
                          {commentText.length}/500 characters
                        </span>
                        <button
                          type="submit"
                          disabled={isSubmittingComment || !commentText.trim()}
                          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSubmittingComment ? 'Posting...' : 'Post Comment'}
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              )}

              {/* Comments List */}
              <div className="space-y-4">
                {capsule.comments.map((comment) => (
                  <div key={comment._id} className="flex space-x-4">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                      {comment.user.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-white font-medium">{comment.user.username}</span>
                        <span className="text-white/60 text-xs">
                          {formatDistanceToNow(new Date(comment.createdAt))} ago
                        </span>
                      </div>
                      <p className="text-white/80">{comment.text}</p>
                    </div>
                  </div>
                ))}

                {capsule.comments.length === 0 && (
                  <div className="text-center py-8 text-white/60">
                    <MessageCircle className="h-8 w-8 mx-auto mb-2" />
                    <p>No comments yet. Be the first to comment!</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="card"
            >
              <h3 className="text-lg font-semibold text-white mb-4">Statistics</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Eye className="h-4 w-4 text-white/60" />
                    <span className="text-white/80">Views</span>
                  </div>
                  <span className="text-white font-medium">{capsule.views}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Heart className="h-4 w-4 text-white/60" />
                    <span className="text-white/80">Likes</span>
                  </div>
                  <span className="text-white font-medium">{capsule.likeCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MessageCircle className="h-4 w-4 text-white/60" />
                    <span className="text-white/80">Comments</span>
                  </div>
                  <span className="text-white font-medium">{capsule.commentCount}</span>
                </div>
              </div>
            </motion.div>

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="card"
            >
              <h3 className="text-lg font-semibold text-white mb-4">Actions</h3>
              <div className="space-y-3">
                {user && (
                  <button
                    onClick={handleLike}
                    className={`w-full flex items-center justify-center space-x-2 py-2 px-4 rounded-lg transition-colors ${
                      isLiked 
                        ? 'bg-red-500 hover:bg-red-600 text-white' 
                        : 'bg-white/10 hover:bg-white/20 text-white'
                    }`}
                  >
                    <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                    <span>{isLiked ? 'Unlike' : 'Like'}</span>
                  </button>
                )}
                
                <button
                  onClick={handleShare}
                  className="w-full flex items-center justify-center space-x-2 py-2 px-4 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                  <Share2 className="h-4 w-4" />
                  <span>Share</span>
                </button>
              </div>
            </motion.div>

            {/* Tags */}
            {capsule.tags.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="card"
              >
                <h3 className="text-lg font-semibold text-white mb-4">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {capsule.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-sm flex items-center space-x-1"
                    >
                      <Tag className="h-3 w-3" />
                      <span>{tag}</span>
                    </span>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Creator Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="card"
            >
              <h3 className="text-lg font-semibold text-white mb-4">Creator</h3>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-lg font-medium">
                  {capsule.creator.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-white font-medium">{capsule.creator.username}</p>
                  <p className="text-white/60 text-sm">
                    Joined {formatDistanceToNow(new Date(capsule.creator.joinDate))} ago
                  </p>
                </div>
              </div>
              {capsule.creator.bio && (
                <p className="text-white/70 text-sm mt-3">{capsule.creator.bio}</p>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CapsuleDetail;