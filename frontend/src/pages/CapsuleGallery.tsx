import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Filter, Grid, List, Calendar, Clock, Eye, Heart } from 'lucide-react';
import Scene3D from '../components/3D/Scene3D';
import { TimeCapsule, CapsuleCategory } from '../types';
import { capsulesApi } from '../services/api';
import { formatDistanceToNow } from 'date-fns';

const CapsuleGallery: React.FC = () => {
  const [capsules, setCapsules] = useState<TimeCapsule[]>([]);
  const [filteredCapsules, setFilteredCapsules] = useState<TimeCapsule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'3d' | 'grid' | 'list'>('3d');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CapsuleCategory | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'pending' | 'revealed'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'reveal-date' | 'popular'>('newest');
  const [selectedCapsule, setSelectedCapsule] = useState<string | undefined>();
  
  const navigate = useNavigate();

  useEffect(() => {
    loadCapsules();
  }, []);

  useEffect(() => {
    filterAndSortCapsules();
  }, [capsules, searchTerm, selectedCategory, selectedStatus, sortBy]);

  const loadCapsules = async () => {
    try {
      setIsLoading(true);
      const response = await capsulesApi.getAll({ limit: 100 });
      setCapsules(response.capsules);
    } catch (error) {
      console.error('Failed to load capsules:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterAndSortCapsules = () => {
    let filtered = [...capsules];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(capsule =>
        capsule.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        capsule.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        capsule.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(capsule => capsule.category === selectedCategory);
    }

    // Status filter
    if (selectedStatus === 'pending') {
      filtered = filtered.filter(capsule => !capsule.isRevealed);
    } else if (selectedStatus === 'revealed') {
      filtered = filtered.filter(capsule => capsule.isRevealed);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime();
        case 'reveal-date':
          return new Date(a.revealDate).getTime() - new Date(b.revealDate).getTime();
        case 'popular':
          return (b.views + b.likeCount) - (a.views + a.likeCount);
        default: // newest
          return new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime();
      }
    });

    setFilteredCapsules(filtered);
  };

  const handleCapsuleClick = (capsule: TimeCapsule) => {
    if (viewMode === '3d') {
      setSelectedCapsule(capsule.id);
      setTimeout(() => {
        navigate(`/capsule/${capsule.id}`);
      }, 500);
    } else {
      navigate(`/capsule/${capsule.id}`);
    }
  };

  const categories: Array<{ value: CapsuleCategory | 'all'; label: string }> = [
    { value: 'all', label: 'All Categories' },
    { value: 'personal', label: 'Personal' },
    { value: 'family', label: 'Family' },
    { value: 'friendship', label: 'Friendship' },
    { value: 'achievement', label: 'Achievement' },
    { value: 'memory', label: 'Memory' },
    { value: 'wish', label: 'Wish' },
    { value: 'prediction', label: 'Prediction' },
    { value: 'other', label: 'Other' }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-16">
        <div className="glass rounded-lg p-8">
          <div className="flex items-center space-x-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            <span className="text-white text-lg">Loading time capsules...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16">
      {/* Header */}
      <div className="sticky top-16 z-40 bg-black/60 backdrop-blur-md border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            {/* Title and Stats */}
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Time Capsule Gallery</h1>
              <p className="text-white/70">
                {filteredCapsules.length} of {capsules.length} capsules
              </p>
            </div>

            {/* Controls */}
            <div className="flex flex-col lg:flex-row gap-4 w-full lg:w-auto">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/60" />
                <input
                  type="text"
                  placeholder="Search capsules..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field pl-10 w-full lg:w-64"
                />
              </div>

              {/* Filters */}
              <div className="flex gap-2">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as CapsuleCategory | 'all')}
                  className="input-field"
                >
                  {categories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as 'all' | 'pending' | 'revealed')}
                  className="input-field"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="revealed">Revealed</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'reveal-date' | 'popular')}
                  className="input-field"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="reveal-date">By Reveal Date</option>
                  <option value="popular">Most Popular</option>
                </select>
              </div>

              {/* View Mode Toggle */}
              <div className="flex bg-white/10 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('3d')}
                  className={`p-2 rounded ${viewMode === '3d' ? 'bg-blue-500 text-white' : 'text-white/60 hover:text-white'}`}
                  title="3D View"
                >
                  <div className="w-4 h-4 border border-current rounded-sm"></div>
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'text-white/60 hover:text-white'}`}
                  title="Grid View"
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'text-white/60 hover:text-white'}`}
                  title="List View"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1">
        {viewMode === '3d' ? (
          <div className="h-screen">
            <Scene3D
              capsules={filteredCapsules}
              onCapsuleClick={handleCapsuleClick}
              selectedCapsuleId={selectedCapsule}
              enableControls={true}
            />
          </div>
        ) : (
          <div className="max-w-7xl mx-auto px-4 py-8">
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredCapsules.map((capsule) => (
                  <CapsuleCard
                    key={capsule.id}
                    capsule={capsule}
                    onClick={() => handleCapsuleClick(capsule)}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredCapsules.map((capsule) => (
                  <CapsuleListItem
                    key={capsule.id}
                    capsule={capsule}
                    onClick={() => handleCapsuleClick(capsule)}
                  />
                ))}
              </div>
            )}

            {filteredCapsules.length === 0 && (
              <div className="text-center py-20">
                <div className="glass rounded-lg p-8 max-w-md mx-auto">
                  <Clock className="h-12 w-12 text-white/60 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No capsules found</h3>
                  <p className="text-white/70">Try adjusting your search or filters</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

interface CapsuleCardProps {
  capsule: TimeCapsule;
  onClick: () => void;
}

const CapsuleCard: React.FC<CapsuleCardProps> = ({ capsule, onClick }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.05, y: -5 }}
      className="card cursor-pointer group"
      onClick={onClick}
    >
      <div className="relative">
        <div 
          className="w-full h-32 rounded-lg mb-4 bg-gradient-to-br"
          style={{ 
            background: `linear-gradient(135deg, ${capsule.color}40, ${capsule.color}80)` 
          }}
        >
          <div className="absolute top-2 right-2">
            <div className={`w-3 h-3 rounded-full ${capsule.isRevealed ? 'bg-green-400' : 'bg-orange-400'} animate-pulse`}></div>
          </div>
        </div>

        <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors">
          {capsule.title}
        </h3>

        <p className="text-white/70 text-sm mb-4 line-clamp-2">
          {capsule.description}
        </p>

        <div className="space-y-2 text-xs text-white/60">
          <div className="flex items-center space-x-1">
            <Calendar className="h-3 w-3" />
            <span>
              {capsule.isRevealed 
                ? `Revealed ${formatDistanceToNow(new Date(capsule.revealDate))} ago`
                : `Reveals in ${capsule.daysRemaining} days`
              }
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1">
                <Eye className="h-3 w-3" />
                <span>{capsule.views}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Heart className="h-3 w-3" />
                <span>{capsule.likeCount}</span>
              </div>
            </div>
            <span className="text-xs bg-white/10 px-2 py-1 rounded">
              {capsule.category}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const CapsuleListItem: React.FC<CapsuleCardProps> = ({ capsule, onClick }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ x: 5 }}
      className="glass rounded-lg p-4 cursor-pointer group"
      onClick={onClick}
    >
      <div className="flex items-center space-x-4">
        <div 
          className="w-16 h-16 rounded-lg flex-shrink-0 bg-gradient-to-br flex items-center justify-center"
          style={{ 
            background: `linear-gradient(135deg, ${capsule.color}40, ${capsule.color}80)` 
          }}
        >
          <Clock className="h-6 w-6 text-white" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
            {capsule.title}
          </h3>
          <p className="text-white/70 text-sm truncate">
            {capsule.description}
          </p>
          <div className="flex items-center space-x-4 mt-2 text-xs text-white/60">
            <span>by {capsule.creator.username}</span>
            <span>•</span>
            <span>{capsule.category}</span>
            <span>•</span>
            <span>
              {capsule.isRevealed 
                ? `Revealed ${formatDistanceToNow(new Date(capsule.revealDate))} ago`
                : `${capsule.daysRemaining} days remaining`
              }
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-4 text-white/60">
          <div className="flex items-center space-x-1">
            <Eye className="h-4 w-4" />
            <span>{capsule.views}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Heart className="h-4 w-4" />
            <span>{capsule.likeCount}</span>
          </div>
          <div className={`w-3 h-3 rounded-full ${capsule.isRevealed ? 'bg-green-400' : 'bg-orange-400'} animate-pulse`}></div>
        </div>
      </div>
    </motion.div>
  );
};

export default CapsuleGallery;