const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const dotenv = require('dotenv');

<<<<<<< HEAD
// Configure storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
        cb(null, 'profile-' + uniqueSuffix + ext);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png|gif|webp/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype || extname) {
            return cb(null, true);
        }
        cb(new Error('Error: Images only (jpeg, jpg, png, gif, webp)!'));
    }
});

// @route   POST /api/upload
// @desc    Upload an image
// @access  Public
router.post('/', (req, res) => {
    upload.single('image')(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            // A Multer error occurred when uploading.
            console.error('Multer Error:', err);
            return res.status(400).json({ msg: `Upload error: ${err.message}` });
        } else if (err) {
            // An unknown error occurred when uploading.
            console.error('Unknown Upload Error:', err);
            return res.status(400).json({ msg: err.message || 'An error occurred during upload' });
        }

        // Everything went fine.
        try {
            if (!req.file) {
                return res.status(400).json({ msg: 'No file selected' });
            }
            // Return the URL to access the file
            const fileUrl = `/uploads/${req.file.filename}`;
            console.log('File uploaded successfully:', fileUrl);
            res.json({ url: fileUrl });
        } catch (err) {
            console.error('Server save error:', err);
            res.status(500).send('Server Error');
        }
    });
=======
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
        folder: 'health-hub/hospitals', // Folder name in Cloudinary
        allowed_formats: ['jpg', 'png', 'jpeg', 'gif'],
        public_id: (req, file) => `hospital-${Date.now()}-${file.originalname.split('.')[0]}`
    }
});

const upload = multer({ storage: storage });

// @route   POST /api/upload
// @desc    Upload an image to Cloudinary
// @access  Public (or Private if needed)
router.post('/', upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ msg: 'No file uploaded' });
        }
        // Cloudinary returns the secure URL in req.file.path
        res.json({ url: req.file.path });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
>>>>>>> db1ba967c36631a0eafe8ec600c116380c74a819
});

module.exports = router;
