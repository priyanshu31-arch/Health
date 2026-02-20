const express = require('express');
const router = express.Router();
const Bed = require('../models/Bed');
const Hospital = require('../models/Hospital');
const auth = require('../middleware/auth');

// @route   GET /beds
// @desc    Get all beds
// @access  Public
router.get('/', async (req, res) => {
  try {
    const beds = await Bed.find().populate('hospital', 'name');
    res.json(beds);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /beds
// @desc    Add a new bed
// @access  Private
router.post('/', auth, async (req, res) => {
  const { bedNumber, isAvailable, hospital } = req.body;

  try {
    const hospitalToUpdate = await Hospital.findById(hospital);

    if (!hospitalToUpdate) {
      return res.status(404).json({ msg: 'Hospital not found' });
    }

    if (hospitalToUpdate.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    // Check if bed number already exists for this hospital
    const existingBed = await Bed.findOne({ hospital, bedNumber });
    if (existingBed) {
      return res.status(400).json({ msg: 'Bed number already exists in this hospital' });
    }

    const newBed = new Bed({
      bedNumber,
      isAvailable,
      hospital,
    });

    const bed = await newBed.save();

    res.json(bed);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT /beds/:id/status
// @desc    Update bed status (Free/Occupied)
// @access  Private
router.put('/:id/status', auth, async (req, res) => {
  const { isAvailable } = req.body;
  try {
    let bed = await Bed.findById(req.params.id);
    if (!bed) return res.status(404).json({ msg: 'Bed not found' });

    const hospital = await Hospital.findById(bed.hospital);
    if (hospital.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    bed.isAvailable = isAvailable;
    await bed.save();
    res.json(bed);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE /beds/:id
// @desc    Delete a bed
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    let bed = await Bed.findById(req.params.id);

    if (!bed) {
      return res.status(404).json({ msg: 'Bed not found' });
    }

    const hospital = await Hospital.findById(bed.hospital);

    if (hospital.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    await Bed.deleteOne({ _id: req.params.id });

    res.json({ msg: 'Bed removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
