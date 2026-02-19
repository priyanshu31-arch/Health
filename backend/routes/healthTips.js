const express = require('express');
const router = express.Router();
const HealthTip = require('../models/HealthTip');
const auth = require('../middleware/auth'); // Assuming you want admin protection for posting

// @route   GET /api/health-tips
// @desc    Get all health tips
// @access  Public
router.get('/', async (req, res) => {
    try {
        const tips = await HealthTip.find().sort({ createdAt: -1 });
        res.json(tips);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/health-tips/:id
// @desc    Get a single health tip
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const tip = await HealthTip.findById(req.params.id);
        if (!tip) {
            return res.status(404).json({ msg: 'Health Tip not found' });
        }
        res.json(tip);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Health Tip not found' });
        }
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/health-tips
// @desc    Create a health tip
// @access  Private (Admin/Doctor) - using auth middleware
router.post('/', auth, async (req, res) => {
    const { title, content, author, image, tags } = req.body;

    try {
        const newTip = new HealthTip({
            title,
            content,
            author,
            image,
            tags
        });

        const tip = await newTip.save();
        res.json(tip);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
