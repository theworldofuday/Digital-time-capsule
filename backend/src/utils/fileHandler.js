const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');

// Set FFmpeg path
ffmpeg.setFfmpegPath(ffmpegStatic);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|avi|mp3|wav|pdf|doc|docx|txt/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images, videos, audio, and documents are allowed.'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.UPLOAD_MAX_SIZE) || 50000000 // 50MB default
  },
  fileFilter: fileFilter
});

// File processing utilities
class FileProcessor {
  static async processImage(filePath, options = {}) {
    try {
      const { width = 1920, height = 1080, quality = 80 } = options;
      const processedPath = filePath.replace(/\.(jpg|jpeg|png)$/i, '_processed.jpg');
      
      await sharp(filePath)
        .resize(width, height, { 
          fit: 'inside', 
          withoutEnlargement: true 
        })
        .jpeg({ quality })
        .toFile(processedPath);
      
      return processedPath;
    } catch (error) {
      throw new Error(`Image processing failed: ${error.message}`);
    }
  }

  static async processVideo(filePath, options = {}) {
    try {
      const { width = 1280, height = 720 } = options;
      const processedPath = filePath.replace(/\.(mp4|mov|avi)$/i, '_processed.mp4');
      
      return new Promise((resolve, reject) => {
        ffmpeg(filePath)
          .size(`${width}x${height}`)
          .videoBitrate('1000k')
          .audioBitrate('128k')
          .format('mp4')
          .on('end', () => resolve(processedPath))
          .on('error', (err) => reject(new Error(`Video processing failed: ${err.message}`)))
          .save(processedPath);
      });
    } catch (error) {
      throw new Error(`Video processing failed: ${error.message}`);
    }
  }

  static async generateThumbnail(filePath, type = 'image') {
    try {
      const thumbnailPath = filePath.replace(/\.[^.]+$/, '_thumb.jpg');
      
      if (type === 'image') {
        await sharp(filePath)
          .resize(300, 300, { fit: 'cover' })
          .jpeg({ quality: 70 })
          .toFile(thumbnailPath);
      } else if (type === 'video') {
        return new Promise((resolve, reject) => {
          ffmpeg(filePath)
            .screenshots({
              count: 1,
              folder: path.dirname(thumbnailPath),
              filename: path.basename(thumbnailPath),
              size: '300x300'
            })
            .on('end', () => resolve(thumbnailPath))
            .on('error', (err) => reject(new Error(`Thumbnail generation failed: ${err.message}`)));
        });
      }
      
      return thumbnailPath;
    } catch (error) {
      throw new Error(`Thumbnail generation failed: ${error.message}`);
    }
  }

  static getFileInfo(file) {
    const stats = fs.statSync(file.path);
    return {
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: stats.size,
      path: file.path,
      uploadDate: stats.birthtime
    };
  }

  static async deleteFile(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }
    } catch (error) {
      console.error(`Failed to delete file ${filePath}:`, error);
    }
  }
}

module.exports = {
  upload,
  FileProcessor
};