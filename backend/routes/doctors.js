const express = require('express');
const router = express.Router();
const Doctor = require('../models/Doctor');
const auth = require('../middleware/auth');

// @route   GET /api/doctors
// @desc    Get all doctors (with optional search)
// @access  Public
router.get('/', async (req, res) => {
    try {
        const { specialty, hospital } = req.query;
        let query = {};

        if (specialty) {
            query.specialty = { $regex: specialty, $options: 'i' };
        }
        if (hospital) {
            query.hospital = hospital;
        }

        const doctors = await Doctor.find(query).populate('hospital', 'name address'); // Populate hospital details if linked
        res.json(doctors);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/doctors
// @desc    Add a new doctor
// @access  Private (Admin)
router.post('/', auth, async (req, res) => {
    const { name, specialty, hospital, qualification, experience, contact, bio, image, availability } = req.body;

    try {
        const newDoctor = new Doctor({
            name,
            specialty,
            hospital,
            qualification,
            experience,
            contact,
            bio,
            image,
            availability
        });

        const doctor = await newDoctor.save();
        res.json(doctor);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
