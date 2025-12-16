const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const playlistData = require('../utils/playlist.json');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../public/uploads/videos');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage config
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Generate unique name: timestamp-filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('video/')) {
            cb(null, true);
        } else {
            cb(new Error('Only video files are allowed!'), false);
        }
    },
    limits: { fileSize: 500 * 1024 * 1024 } // 500MB limit
});

// Upload endpoint
router.post('/upload', upload.single('video'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const fileUrl = `/uploads/videos/${req.file.filename}`;

        res.json({
            message: 'Upload successful',
            url: fileUrl,
            filename: req.file.originalname,
            size: req.file.size
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ message: 'Server error during upload' });
    }
});

// Get playlist
router.get('/playlist', (req, res) => {
    try {
        // Reload playlist in case it changed
        const currentPlaylist = JSON.parse(fs.readFileSync(path.join(__dirname, '../utils/playlist.json'), 'utf8'));
        res.json(currentPlaylist);
    } catch (error) {
        console.error('Error reading playlist:', error);
        res.status(500).json({ message: 'Error fetching playlist' });
    }
});

// Save playlist
router.post('/playlist', (req, res) => {
    try {
        const newPlaylist = req.body;
        if (!Array.isArray(newPlaylist)) {
            return res.status(400).json({ message: 'Invalid format' });
        }

        fs.writeFileSync(path.join(__dirname, '../utils/playlist.json'), JSON.stringify(newPlaylist, null, 2));
        res.json({ message: 'Playlist saved successfully', size: newPlaylist.length });
    } catch (error) {
        console.error('Error saving playlist:', error);
        res.status(500).json({ message: 'Error saving playlist' });
    }
});

module.exports = router;
