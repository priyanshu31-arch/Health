const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const dotenv = require('dotenv');

dotenv.config();

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Multer Storage for Cloudinary
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'health-hub/uploads',
        allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'webp', 'pdf'],
        resource_type: 'auto',
        public_id: (req, file) => `file-${Date.now()}-${Math.round(Math.random() * 1E9)}`
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// @route   POST /api/upload
// @desc    Upload an image to Cloudinary
// @access  Public
router.post('/', (req, res) => {
    upload.single('image')(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            console.error('Multer Error:', err);
            return res.status(400).json({ msg: `Upload error: ${err.message}` });
        } else if (err) {
            console.error('Upload Error:', err);
            return res.status(400).json({ msg: err.message || 'An error occurred during upload' });
        }

        try {
            if (!req.file) {
                return res.status(400).json({ msg: 'No file selected' });
            }
            // Cloudinary returns the secure URL in req.file.path
            console.log('File uploaded to Cloudinary:', req.file.path);
            res.json({ url: req.file.path });
        } catch (error) {
            console.error('Server save error:', error);
            res.status(500).send('Server Error');
        }
    });
});

module.exports = router;
