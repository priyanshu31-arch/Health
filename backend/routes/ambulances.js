const express = require('express');
const router = express.Router();
const Ambulance = require('../models/Ambulance');
const Hospital = require('../models/Hospital');
const auth = require('../middleware/auth');

// @route   GET /ambulances
// @desc    Get all ambulances (with optional filters)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { hospital, isAvailable } = req.query;
    let query = {};
    if (hospital) query.hospital = hospital;
    if (isAvailable !== undefined) query.isAvailable = isAvailable === 'true';

    const ambulances = await Ambulance.find(query).populate('hospital', 'name');
    res.json(ambulances);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT /ambulances/:id/status
// @desc    Update ambulance status
// @access  Private (Admin/Hospital Owner)
router.put('/:id/status', auth, async (req, res) => {
  const { isAvailable } = req.body;
  try {
    let ambulance = await Ambulance.findById(req.params.id);
    if (!ambulance) return res.status(404).json({ msg: 'Ambulance not found' });

    const hospital = await Hospital.findById(ambulance.hospital);
    if (hospital.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    ambulance.isAvailable = isAvailable;
    // Also reset status string if becoming available
    if (isAvailable) {
      ambulance.status = 'available';
      ambulance.user = null; // Clear assigned user
    }

    await ambulance.save();
    res.json(ambulance);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /ambulances
// @desc    Add a new ambulance
// @access  Private
router.post('/', auth, async (req, res) => {
  const { ambulanceNumber, isAvailable, hospital } = req.body;

  try {
    const hospitalToUpdate = await Hospital.findById(hospital);

    if (!hospitalToUpdate) {
      return res.status(404).json({ msg: 'Hospital not found' });
    }

    if (hospitalToUpdate.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    // Check if ambulance number already exists for this hospital
    const existingAmbulance = await Ambulance.findOne({ hospital, ambulanceNumber });
    if (existingAmbulance) {
      return res.status(400).json({ msg: 'Ambulance number already exists in this hospital' });
    }

    const newAmbulance = new Ambulance({
      ambulanceNumber,
      isAvailable,
      hospital,
    });

    const ambulance = await newAmbulance.save();

    res.json(ambulance);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE /ambulances/:id
// @desc    Delete an ambulance
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    let ambulance = await Ambulance.findById(req.params.id);

    if (!ambulance) {
      return res.status(404).json({ msg: 'Ambulance not found' });
    }

    const hospital = await Hospital.findById(ambulance.hospital);

    // Debug user ID matching
    console.log('Delete Request - User ID from Token:', req.user.id);
    console.log('Delete Request - Hospital User ID:', hospital.user.toString());

    if (hospital.user.toString() !== req.user.id) {
      console.log('Authorization Failed');
      return res.status(401).json({ msg: 'Not authorized' });
    }

    await Ambulance.deleteOne({ _id: req.params.id });

    res.json({ msg: 'Ambulance removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
