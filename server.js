const express = require('express');
const multer = require('multer');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Initialize SQLite database
const db = new sqlite3.Database('./database/capsules.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    initializeDatabase();
  }
});

// Initialize database tables
function initializeDatabase() {
  db.run(`CREATE TABLE IF NOT EXISTS capsules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    message TEXT,
    media_path TEXT,
    media_type TEXT,
    unlock_date TEXT NOT NULL,
    created_date TEXT NOT NULL,
    is_unlocked INTEGER DEFAULT 0,
    encrypted_content TEXT,
    creator_name TEXT
  )`);
}

// Encryption utilities
function encrypt(text) {
  const algorithm = 'aes-256-cbc';
  const key = crypto.scryptSync('time-capsule-secret', 'salt', 32);
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipher(algorithm, key);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(text) {
  const algorithm = 'aes-256-cbc';
  const key = crypto.scryptSync('time-capsule-secret', 'salt', 32);
  
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift(), 'hex');
  const encryptedText = textParts.join(':');
  
  const decipher = crypto.createDecipher(algorithm, key);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

// Routes

// Serve HTML pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/create', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'create.html'));
});

app.get('/gallery', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'gallery.html'));
});

// API Routes

// Get all capsules
app.get('/api/capsules', (req, res) => {
  const query = `SELECT id, title, creator_name, unlock_date, created_date, is_unlocked, media_type FROM capsules ORDER BY created_date DESC`;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    // Check if any capsules should be unlocked
    const now = new Date().toISOString();
    rows.forEach(capsule => {
      if (!capsule.is_unlocked && new Date(capsule.unlock_date) <= new Date(now)) {
        // Auto-unlock expired capsules
        db.run(`UPDATE capsules SET is_unlocked = 1 WHERE id = ?`, [capsule.id]);
        capsule.is_unlocked = 1;
      }
    });
    
    res.json(rows);
  });
});

// Get specific capsule
app.get('/api/capsules/:id', (req, res) => {
  const id = req.params.id;
  const query = `SELECT * FROM capsules WHERE id = ?`;
  
  db.get(query, [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (!row) {
      res.status(404).json({ error: 'Capsule not found' });
      return;
    }
    
    // Check if capsule should be unlocked
    const now = new Date().toISOString();
    if (!row.is_unlocked && new Date(row.unlock_date) <= new Date(now)) {
      db.run(`UPDATE capsules SET is_unlocked = 1 WHERE id = ?`, [id]);
      row.is_unlocked = 1;
    }
    
    // Decrypt content if unlocked
    if (row.is_unlocked && row.encrypted_content) {
      try {
        row.message = decrypt(row.encrypted_content);
      } catch (decryptErr) {
        console.error('Decryption error:', decryptErr);
        row.message = 'Content could not be decrypted';
      }
    } else if (!row.is_unlocked) {
      // Hide sensitive content for locked capsules
      row.message = 'Content is sealed until unlock date';
      row.media_path = null;
    }
    
    res.json(row);
  });
});

// Create new capsule
app.post('/api/capsules', upload.single('media'), (req, res) => {
  const { title, message, unlock_date, creator_name } = req.body;
  const created_date = new Date().toISOString();
  const media_path = req.file ? req.file.filename : null;
  const media_type = req.file ? req.file.mimetype : null;
  
  // Encrypt the message
  const encrypted_content = encrypt(message);
  
  const query = `INSERT INTO capsules (title, encrypted_content, media_path, media_type, unlock_date, created_date, creator_name) VALUES (?, ?, ?, ?, ?, ?, ?)`;
  
  db.run(query, [title, encrypted_content, media_path, media_type, unlock_date, created_date, creator_name], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    res.json({
      id: this.lastID,
      title,
      creator_name,
      unlock_date,
      created_date,
      media_type,
      success: true
    });
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Digital Time Capsule server running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to view the website`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  db.close((err) => {
    if (err) {
      console.error(err.message);
    } else {
      console.log('Database connection closed.');
    }
    process.exit(0);
  });
});