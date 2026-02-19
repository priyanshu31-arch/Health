const express = require('express');
const router = express.Router();
const HealthRecord = require('../models/HealthRecord');
const auth = require('../middleware/auth');

// @route   GET /api/health-records
// @desc    Get all health records for the current user
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const records = await HealthRecord.find({ user: req.user.id }).sort({ date: -1 });
        res.json(records);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/health-records
// @desc    Add a new health record
// @access  Private
router.post('/', auth, async (req, res) => {
    const { type, value, unit, notes, file, date } = req.body;

    try {
        const newRecord = new HealthRecord({
            user: req.user.id,
            type,
            value,
            unit,
            notes,
            file,
            date: date || Date.now()
        });

        const record = await newRecord.save();
        res.json(record);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/health-records/:id
// @desc    Delete a health record
// @access  Private
router.delete('/:id', auth, async (req, res) => {
    try {
        const record = await HealthRecord.findById(req.params.id);

        if (!record) {
            return res.status(404).json({ msg: 'Record not found' });
        }

        // Check user
        if (record.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        await record.deleteOne(); // or findByIdAndDelete

        res.json({ msg: 'Record removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
