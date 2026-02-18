const express = require('express');
const router = express.Router();
const Ambulance = require('../models/Ambulance');
const Hospital = require('../models/Hospital');
const Booking = require('../models/Booking');
const auth = require('../middleware/auth');

// @route   POST /ambulance/book
// @desc    Book the nearest available ambulance
// @access  Private (for Users)
// @route   POST /ambulance/book
// @desc    Book the nearest available ambulance
// @access  Public (Guest OK)
router.post('/book', async (req, res) => {
  const { pickupLat, pickupLon, hospitalId, patientName, contactNumber, pickupAddress, ambulanceId } = req.body;
  const jwt = require('jsonwebtoken'); // Ensure jwt is imported

  if (!pickupLat || !pickupLon || !hospitalId) {
    return res.status(400).json({ msg: 'Missing location or hospital ID.' });
  }

  let userId = null;
  const token = req.header('x-auth-token');
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.user.id;
    } catch (err) {
      // Continue as guest
    }
  }

  try {
    const hospital = await Hospital.findById(hospitalId);
    if (!hospital) {
      return res.status(404).json({ msg: 'Hospital not found.' });
    }

    let targetAmbulance = null;

    if (ambulanceId) {
      // Book specific ambulance
      targetAmbulance = await Ambulance.findOne({
        _id: ambulanceId,
        hospital: hospitalId,
        isAvailable: true // Match the GET request filter
      });
    } else {
      // Find the nearest available ambulance to the user
      // (Simplification: just find one available for this hospital)
      targetAmbulance = await Ambulance.findOne({
        hospital: hospitalId,
        status: 'available',
      });
    }

    if (!targetAmbulance) {
      return res.status(404).json({ msg: 'Selected ambulance is no longer available.' });
    }

    // Assign the booking to the ambulance
    if (userId) {
      targetAmbulance.user = userId;
    }
    targetAmbulance.status = 'booked';
    // Also set isAvailable to false so it doesn't show up in lists
    targetAmbulance.isAvailable = false;

    targetAmbulance.pickupLocation = {
      type: 'Point',
      coordinates: [pickupLon, pickupLat],
    };
    // destinationAddress is usually the hospital
    targetAmbulance.destinationAddress = hospital.name;

    // For demonstration, we'll set the ambulance's starting location nearby
    targetAmbulance.currentLocation = {
      type: 'Point',
      coordinates: [pickupLon + 0.005, pickupLat + 0.005], // Simulating a nearby start
    };

    await targetAmbulance.save();

    // Create a booking record for history
    const booking = new Booking({
      bookingType: 'ambulance',
      bookingTypeModel: 'Ambulance',
      itemId: targetAmbulance._id,
      hospital: hospital._id,
      user: userId, // Can be null
      patientName: patientName || 'Guest',
      contactNumber: contactNumber || 'N/A',
      pickupAddress,
      pickupLat,
      pickupLon
    });
    await booking.save();

    await targetAmbulance.populate('hospital');
    res.json(targetAmbulance);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /ambulance/status/:ambulanceId
// @desc    Get the status and location of a booked ambulance
// @access  Private
router.get('/status/:ambulanceId', auth, async (req, res) => {
  try {
    const ambulance = await Ambulance.findById(req.params.ambulanceId);

    if (!ambulance || ambulance.user.toString() !== req.user.id) {
      return res.status(404).json({ msg: 'Ambulance booking not found.' });
    }

    res.json({
      _id: ambulance._id,
      currentLocation: ambulance.currentLocation,
      status: ambulance.status,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT /ambulance/location/:ambulanceId
// @desc    Update an ambulance's current location (for the driver's app)
// @access  Private (for Admins/Drivers)
const { getIo } = require('../socket');

// @route   PUT /ambulance/location/:ambulanceId
// @desc    Update an ambulance's current location (for the driver's app)
// @access  Private (for Admins/Drivers)
router.put('/location/:ambulanceId', async (req, res) => {
  const { lat, lon } = req.body;

  if (!lat || !lon) {
    return res.status(400).json({ msg: 'Missing location data.' });
  }

  try {
    const ambulance = await Ambulance.findById(req.params.ambulanceId);

    if (!ambulance) {
      return res.status(404).json({ msg: 'Ambulance not found.' });
    }

    // In a real app, you'd verify the request is from the correct driver/admin

    ambulance.currentLocation = {
      type: 'Point',
      coordinates: [lon, lat],
    };

    // Logic to update status from 'booked' to 'in-transit' when the ride starts
    if (ambulance.status === 'booked') {
      ambulance.status = 'in-transit';
    }

    await ambulance.save();

    // Emit socket event for real-time tracking
    try {
      const io = getIo();
      // Emit to the room matching the ambulance ID
      io.to(req.params.ambulanceId).emit('receive_location', {
        latitude: lat,
        longitude: lon
      });
      console.log(`Emitted location update for ambulance ${req.params.ambulanceId}`);
    } catch (socketError) {
      console.error('Socket Emission Error:', socketError.message);
    }

    res.json(ambulance);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
