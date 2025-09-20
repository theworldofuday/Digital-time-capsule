import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Calendar, Clock, Eye, Heart, Settings, Edit } from 'lucide-react';
import { TimeCapsule } from '../types';
import { capsulesApi, authApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { formatDistanceToNow, format } from 'date-fns';

const Profile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [userCapsules, setUserCapsules] = useState<TimeCapsule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    username: user?.username || '',
    bio: user?.bio || ''
  });

  useEffect(() => {
    loadUserCapsules();
  }, []);

  const loadUserCapsules = async () => {
    try {
      setIsLoading(true);
      const response = await capsulesApi.getUserCapsules();
      setUserCapsules(response.capsules);
    } catch (error) {
      console.error('Failed to load user capsules:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      await authApi.updateProfile(editData);
      updateUser(editData);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  const stats = {
    totalCapsules: userCapsules.length,
    revealedCapsules: userCapsules.filter(c => c.isRevealed).length,
    totalViews: userCapsules.reduce((sum, c) => sum + c.views, 0),
    totalLikes: userCapsules.reduce((sum, c) => sum + c.likeCount, 0)
  };

  if (!user) return null;

  return (
    <div className="min-h-screen pt-20 pb-10">
      <div className="max-w-6xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Profile Header */}
          <div className="card mb-8">
            <div className="flex flex-col md:flex-row items-start gap-6">
              <div className="w-24 h-24 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-3xl font-bold text-white">
                {user.username.charAt(0).toUpperCase()}
              </div>
              
              <div className="flex-1">
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-white font-medium mb-2">Username</label>
                      <input
                        type="text"
                        value={editData.username}
                        onChange={(e) => setEditData({ ...editData, username: e.target.value })}
                        className="input-field w-full max-w-md"
                      />
                    </div>
                    <div>
                      <label className="block text-white font-medium mb-2">Bio</label>
                      <textarea
                        value={editData.bio}
                        onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                        className="input-field w-full h-20 resize-none"
                        maxLength={500}
                        placeholder="Tell us about yourself..."
                      />
                    </div>
                    <div className="flex space-x-3">
                      <button onClick={handleUpdateProfile} className="btn-primary">
                        Save Changes
                      </button>
                      <button onClick={() => setIsEditing(false)} className="btn-secondary">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <h1 className="text-3xl font-bold text-white">{user.username}</h1>
                      <button
                        onClick={() => setIsEditing(true)}
                        className="btn-secondary flex items-center space-x-2"
                      >
                        <Edit className="h-4 w-4" />
                        <span>Edit Profile</span>
                      </button>
                    </div>
                    
                    {user.bio && (
                      <p className="text-white/80 mb-4">{user.bio}</p>
                    )}
                    
                    <div className="flex items-center space-x-4 text-white/60 text-sm">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>Joined {formatDistanceToNow(new Date(user.joinDate))} ago</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <User className="h-4 w-4" />
                        <span>{user.email}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Time Capsules', value: stats.totalCapsules, icon: Clock },
              { label: 'Revealed', value: stats.revealedCapsules, icon: Eye },
              { label: 'Total Views', value: stats.totalViews, icon: Eye },
              { label: 'Total Likes', value: stats.totalLikes, icon: Heart }
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="card text-center"
              >
                <stat.icon className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-white/60 text-sm">{stat.label}</div>
              </motion.div>
            ))}
          </div>

          {/* My Capsules */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="card"
          >
            <h2 className="text-2xl font-semibold text-white mb-6">My Time Capsules</h2>
            
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            ) : userCapsules.length > 0 ? (
              <div className="space-y-4">
                {userCapsules.map((capsule) => (
                  <div key={capsule.id} className="bg-white/5 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-white">{capsule.title}</h3>
                          <span className={`px-2 py-1 rounded text-xs ${
                            capsule.isRevealed ? 'bg-green-500/20 text-green-300' : 'bg-orange-500/20 text-orange-300'
                          }`}>
                            {capsule.isRevealed ? 'Revealed' : 'Pending'}
                          </span>
                          <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded text-xs">
                            {capsule.category}
                          </span>
                        </div>
                        
                        <p className="text-white/70 text-sm mb-3">{capsule.description}</p>
                        
                        <div className="flex items-center space-x-4 text-white/60 text-xs">
                          <span>Created {format(new Date(capsule.createdDate), 'MMM d, yyyy')}</span>
                          <span>•</span>
                          <span>
                            {capsule.isRevealed 
                              ? `Revealed ${formatDistanceToNow(new Date(capsule.revealDate))} ago`
                              : `Reveals in ${capsule.daysRemaining} days`
                            }
                          </span>
                          <span>•</span>
                          <span>{capsule.views} views</span>
                          <span>•</span>
                          <span>{capsule.likeCount} likes</span>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <a
                          href={`/capsule/${capsule.id}`}
                          className="btn-secondary text-sm"
                        >
                          View
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Clock className="h-16 w-16 text-white/40 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No time capsules yet</h3>
                <p className="text-white/60 mb-6">Start preserving your memories for the future</p>
                <a href="/create" className="btn-primary">
                  Create Your First Capsule
                </a>
              </div>
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;