import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { Calendar, Upload, X, Image, Video, FileText, Plus, Eye } from 'lucide-react';
import { CreateCapsuleData, CapsuleCategory } from '../types';
import { capsulesApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const CreateCapsule: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [previewMode, setPreviewMode] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    getValues
  } = useForm<CreateCapsuleData>({
    defaultValues: {
      category: 'personal',
      isPublic: true,
      tags: []
    }
  });

  const watchedValues = watch();

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
      'video/*': ['.mp4', '.mov', '.avi'],
      'audio/*': ['.mp3', '.wav'],
      'application/pdf': ['.pdf'],
      'text/*': ['.txt'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    onDrop: (acceptedFiles) => {
      setUploadedFiles(prev => [...prev, ...acceptedFiles]);
    },
    onDropRejected: (rejectedFiles) => {
      rejectedFiles.forEach(({ errors }) => {
        errors.forEach((error) => {
          if (error.code === 'file-too-large') {
            toast.error('File is too large. Maximum size is 50MB.');
          } else if (error.code === 'file-invalid-type') {
            toast.error('File type not supported.');
          }
        });
      });
    }
  });

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const addTag = (tag: string) => {
    const currentTags = getValues('tags') || [];
    if (tag && !currentTags.includes(tag)) {
      setValue('tags', [...currentTags, tag]);
    }
  };

  const removeTag = (tagToRemove: string) => {
    const currentTags = getValues('tags') || [];
    setValue('tags', currentTags.filter(tag => tag !== tagToRemove));
  };

  const onSubmit = async (data: CreateCapsuleData) => {
    try {
      setIsSubmitting(true);

      // Validate reveal date
      const revealDate = new Date(data.revealDate);
      if (revealDate <= new Date()) {
        toast.error('Reveal date must be in the future');
        return;
      }

      // Prepare form data
      const formData: CreateCapsuleData = {
        ...data,
        files: uploadedFiles
      };

      await capsulesApi.create(formData);
      
      toast.success('Time capsule created successfully!');
      navigate('/gallery');
    } catch (error: any) {
      console.error('Failed to create capsule:', error);
      toast.error(error.response?.data?.message || 'Failed to create time capsule');
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories: Array<{ value: CapsuleCategory; label: string; description: string }> = [
    { value: 'personal', label: 'Personal', description: 'Private thoughts and experiences' },
    { value: 'family', label: 'Family', description: 'Family memories and moments' },
    { value: 'friendship', label: 'Friendship', description: 'Messages for friends' },
    { value: 'achievement', label: 'Achievement', description: 'Milestones and accomplishments' },
    { value: 'memory', label: 'Memory', description: 'Special memories to preserve' },
    { value: 'wish', label: 'Wish', description: 'Hopes and dreams for the future' },
    { value: 'prediction', label: 'Prediction', description: 'Predictions about the future' },
    { value: 'other', label: 'Other', description: 'Miscellaneous content' }
  ];

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (file.type.startsWith('video/')) return <Video className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (previewMode) {
    return <CapsulePreview data={watchedValues} files={uploadedFiles} onBack={() => setPreviewMode(false)} />;
  }

  return (
    <div className="min-h-screen pt-20 pb-10">
      <div className="max-w-4xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">Create Your Time Capsule</h1>
            <p className="text-white/70 text-lg">
              Preserve your memories, thoughts, and dreams for the future
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Basic Information */}
            <div className="card">
              <h2 className="text-2xl font-semibold text-white mb-6">Basic Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-white font-medium mb-2">Title *</label>
                  <input
                    type="text"
                    {...register('title', { 
                      required: 'Title is required',
                      maxLength: { value: 200, message: 'Title cannot exceed 200 characters' }
                    })}
                    className="input-field w-full"
                    placeholder="Give your time capsule a title..."
                  />
                  {errors.title && (
                    <p className="text-red-400 text-sm mt-1">{errors.title.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">Category *</label>
                  <select
                    {...register('category', { required: 'Category is required' })}
                    className="input-field w-full"
                  >
                    {categories.map(category => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-white font-medium mb-2">Description *</label>
                <textarea
                  {...register('description', { 
                    required: 'Description is required',
                    maxLength: { value: 2000, message: 'Description cannot exceed 2000 characters' }
                  })}
                  className="input-field w-full h-32 resize-none"
                  placeholder="Describe what this time capsule contains and why it's special..."
                />
                {errors.description && (
                  <p className="text-red-400 text-sm mt-1">{errors.description.message}</p>
                )}
              </div>

              <div>
                <label className="block text-white font-medium mb-2">Reveal Date *</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/60" />
                  <input
                    type="datetime-local"
                    {...register('revealDate', { 
                      required: 'Reveal date is required',
                      validate: (value) => {
                        const date = new Date(value);
                        return date > new Date() || 'Reveal date must be in the future';
                      }
                    })}
                    className="input-field w-full pl-10"
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>
                {errors.revealDate && (
                  <p className="text-red-400 text-sm mt-1">{errors.revealDate.message}</p>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="card">
              <h2 className="text-2xl font-semibold text-white mb-6">Content</h2>
              
              <div>
                <label className="block text-white font-medium mb-2">Message</label>
                <textarea
                  {...register('message', {
                    maxLength: { value: 5000, message: 'Message cannot exceed 5000 characters' }
                  })}
                  className="input-field w-full h-40 resize-none"
                  placeholder="Write your message to the future..."
                />
                {errors.message && (
                  <p className="text-red-400 text-sm mt-1">{errors.message.message}</p>
                )}
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-white font-medium mb-4">Files</label>
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isDragActive 
                      ? 'border-blue-400 bg-blue-400/10' 
                      : 'border-white/30 hover:border-white/50'
                  }`}
                >
                  <input {...getInputProps()} />
                  <Upload className="h-12 w-12 text-white/60 mx-auto mb-4" />
                  <p className="text-white/80 mb-2">
                    {isDragActive
                      ? 'Drop the files here...'
                      : 'Drag & drop files here, or click to select files'
                    }
                  </p>
                  <p className="text-white/60 text-sm">
                    Supports images, videos, audio, documents (Max 50MB each)
                  </p>
                </div>

                {/* Uploaded Files */}
                {uploadedFiles.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <h4 className="text-white font-medium">Uploaded Files ({uploadedFiles.length})</h4>
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-white/10 rounded-lg p-3">
                        <div className="flex items-center space-x-3">
                          {getFileIcon(file)}
                          <div>
                            <p className="text-white text-sm">{file.name}</p>
                            <p className="text-white/60 text-xs">{formatFileSize(file.size)}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Settings */}
            <div className="card">
              <h2 className="text-2xl font-semibold text-white mb-6">Settings</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-white font-medium">Public Capsule</label>
                    <p className="text-white/60 text-sm">Allow others to see your capsule in the gallery</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      {...register('isPublic')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-white font-medium mb-2">Tags</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {watchedValues.tags?.map((tag, index) => (
                      <span
                        key={index}
                        className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-sm flex items-center space-x-2"
                      >
                        <span>{tag}</span>
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="text-blue-300 hover:text-blue-100 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      className="input-field flex-1"
                      placeholder="Add a tag..."
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const target = e.target as HTMLInputElement;
                          addTag(target.value.trim());
                          target.value = '';
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        const input = (e.target as HTMLButtonElement).previousElementSibling as HTMLInputElement;
                        addTag(input.value.trim());
                        input.value = '';
                      }}
                      className="btn-secondary px-4"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-white/60 text-xs mt-1">Press Enter or click + to add tags</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-4 justify-end">
              <button
                type="button"
                onClick={() => setPreviewMode(true)}
                className="btn-secondary flex items-center space-x-2"
              >
                <Eye className="h-4 w-4" />
                <span>Preview</span>
              </button>
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    <span>Create Time Capsule</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

interface CapsulePreviewProps {
  data: CreateCapsuleData;
  files: File[];
  onBack: () => void;
}

const CapsulePreview: React.FC<CapsulePreviewProps> = ({ data, files, onBack }) => {
  return (
    <div className="min-h-screen pt-20 pb-10">
      <div className="max-w-4xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-bold text-white">Preview Your Time Capsule</h1>
            <button onClick={onBack} className="btn-secondary">
              Back to Edit
            </button>
          </div>

          <div className="card space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-white mb-4">{data.title}</h2>
              <div className="flex items-center space-x-4 text-white/60 text-sm mb-4">
                <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded">
                  {data.category}
                </span>
                <span>{data.isPublic ? 'Public' : 'Private'}</span>
                <span>Reveals: {new Date(data.revealDate).toLocaleDateString()}</span>
              </div>
              <p className="text-white/80">{data.description}</p>
            </div>

            {data.message && (
              <div>
                <h3 className="text-lg font-medium text-white mb-2">Message</h3>
                <div className="bg-white/5 rounded-lg p-4">
                  <p className="text-white/80 whitespace-pre-wrap">{data.message}</p>
                </div>
              </div>
            )}

            {files.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-white mb-2">Files ({files.length})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {files.map((file, index) => (
                    <div key={index} className="bg-white/5 rounded-lg p-4">
                      <div className="flex items-center space-x-3">
                        {file.type.startsWith('image/') ? <Image className="h-5 w-5 text-blue-400" /> :
                         file.type.startsWith('video/') ? <Video className="h-5 w-5 text-purple-400" /> :
                         <FileText className="h-5 w-5 text-green-400" />}
                        <div>
                          <p className="text-white text-sm">{file.name}</p>
                          <p className="text-white/60 text-xs">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.tags && data.tags.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-white mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {data.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CreateCapsule;