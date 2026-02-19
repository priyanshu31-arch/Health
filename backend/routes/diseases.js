const express = require('express');
const router = express.Router();
const Disease = require('../models/Disease');
const auth = require('../middleware/auth');

// @route   GET /api/diseases
// @desc    Get all diseases or search by name
// @access  Public
router.get('/', async (req, res) => {
    try {
        const { search } = req.query;
        let query = {};

        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }

        const diseases = await Disease.find(query);
        res.json(diseases);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/diseases
// @desc    Add a new disease (Admin)
// @access  Private
router.post('/', auth, async (req, res) => {
    const { name, symptoms, causes, remedies, consultDoctor } = req.body;

    try {
        let disease = await Disease.findOne({ name });
        if (disease) {
            return res.status(400).json({ msg: 'Disease already exists' });
        }

        disease = new Disease({
            name,
            symptoms,
            causes,
            remedies,
            consultDoctor
        });

        await disease.save();
        res.json(disease);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
