import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, Sparkles, Globe, ArrowRight, Play } from 'lucide-react';
import Scene3D from '../components/3D/Scene3D';
import { TimeCapsule } from '../types';
import { capsulesApi } from '../services/api';

const HomePage: React.FC = () => {
  const [featuredCapsules, setFeaturedCapsules] = useState<TimeCapsule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadFeaturedCapsules();
  }, []);

  const loadFeaturedCapsules = async () => {
    try {
      const response = await capsulesApi.getAll({ limit: 20, sort: 'popular' });
      setFeaturedCapsules(response.capsules);
    } catch (error) {
      console.error('Failed to load featured capsules:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCapsuleClick = (capsule: TimeCapsule) => {
    navigate(`/capsule/${capsule.id}`);
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Hero Section with 3D Scene Background */}
      <section className="relative h-screen flex items-center justify-center">
        {/* 3D Background */}
        <div className="absolute inset-0 z-0">
          {!isLoading && (
            <Scene3D
              capsules={featuredCapsules.slice(0, 10)}
              onCapsuleClick={handleCapsuleClick}
              enableControls={false}
            />
          )}
        </div>

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/30 to-black/60 z-10" />

        {/* Hero Content */}
        <div className="relative z-20 text-center max-w-4xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent leading-tight">
              Digital Time Capsule
            </h1>
            
            <p className="text-xl md:text-2xl text-white/80 max-w-2xl mx-auto leading-relaxed">
              Preserve your memories, messages, and dreams for the future. 
              Create encrypted time capsules that reveal themselves when the time is right.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                to="/create"
                className="btn-primary text-lg px-8 py-4 flex items-center space-x-2 group"
              >
                <Clock className="h-5 w-5" />
                <span>Create Time Capsule</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <Link
                to="/gallery"
                className="btn-secondary text-lg px-8 py-4 flex items-center space-x-2"
              >
                <Globe className="h-5 w-5" />
                <span>Explore Gallery</span>
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.5 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20"
        >
          <div className="flex flex-col items-center space-y-2 text-white/60">
            <span className="text-sm">Scroll to explore</span>
            <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
              <div className="w-1 h-3 bg-white/60 rounded-full mt-2 animate-pulse"></div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="relative py-20 bg-black/40 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Why Choose Digital Time Capsules?
            </h2>
            <p className="text-xl text-white/70 max-w-3xl mx-auto">
              Experience the future of memory preservation with cutting-edge technology
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="card text-center group hover:scale-105 transition-transform duration-300"
              >
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                </div>
                <h3 className="text-2xl font-semibold text-white mb-4">{feature.title}</h3>
                <p className="text-white/70 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-white/70 text-sm md:text-base">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 bg-gradient-to-r from-blue-600/20 to-purple-600/20">
        <div className="max-w-4xl mx-auto text-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white">
              Ready to Create Your First Time Capsule?
            </h2>
            <p className="text-xl text-white/80 max-w-2xl mx-auto">
              Join thousands of people preserving their memories for the future. 
              Start your journey today.
            </p>
            <Link
              to="/register"
              className="btn-primary text-lg px-8 py-4 inline-flex items-center space-x-2 group"
            >
              <Sparkles className="h-5 w-5" />
              <span>Get Started Free</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

const features = [
  {
    icon: Clock,
    title: 'Time-Locked Encryption',
    description: 'Your content is securely encrypted and automatically revealed only when the specified date arrives.'
  },
  {
    icon: Globe,
    title: '3D Interactive Gallery',
    description: 'Explore time capsules in an immersive 3D environment with stunning visual effects and smooth interactions.'
  },
  {
    icon: Sparkles,
    title: 'Rich Media Support',
    description: 'Store text, images, videos, and documents. Everything is encrypted and safely preserved for the future.'
  }
];

const stats = [
  { value: '10K+', label: 'Time Capsules' },
  { value: '5K+', label: 'Active Users' },
  { value: '2M+', label: 'Memories Preserved' },
  { value: '500+', label: 'Capsules Revealed' }
];

export default HomePage;