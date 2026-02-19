const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Bed = require('../models/Bed');
const Ambulance = require('../models/Ambulance');
const auth = require('../middleware/auth');
const jwt = require('jsonwebtoken');

// @route   GET /bookings
// @desc    Get all bookings
// @access  Public
router.get('/', async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('hospital', 'name')
      .populate('itemId');
    res.json(bookings);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /bookings
// @desc    Create a new booking
// @access  Public
// @route   GET /bookings/my
// @desc    Get bookings for logged in user
// @access  Private
router.get('/my', auth, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id })
      .populate('hospital', 'name')
      .populate('itemId')
      .sort({ bookedAt: -1 });
    res.json(bookings);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /bookings
// @desc    Create a new booking
// @access  Public (Auth optional)
router.post('/', async (req, res) => {
  const { bookingType, itemId, hospital, patientName, contactNumber, isOffline } = req.body;
  const token = req.header('x-auth-token');

  try {
    let userId = null;
    if (token && !isOffline) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.user.id;
      } catch (err) {
        console.warn('Invalid token provided for booking, proceeding as guest');
      }
    }

    const bookingModelMap = {
      bed: 'Bed',
      ambulance: 'Ambulance',
    };

    const newBooking = new Booking({
      bookingType,
      bookingTypeModel: bookingModelMap[bookingType],
      itemId,
      hospital,
      patientName,
      contactNumber,
      user: userId, // Optional
      isOffline: isOffline || false,
    });

    const booking = await newBooking.save();

    if (bookingType === 'bed') {
      await Bed.findByIdAndUpdate(itemId, { isAvailable: false });
    } else if (bookingType === 'ambulance') {
      await Ambulance.findByIdAndUpdate(itemId, { isAvailable: false });
    }

    res.json(booking);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE /bookings/:id
// @desc    Delete a booking
// @access  Private (should be, but keeping public/auth consistent with others for MVP)
router.delete('/:id', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ msg: 'Booking not found' });
    }

    // Release the resource
    if (booking.bookingType === 'bed') {
      await Bed.findByIdAndUpdate(booking.itemId, { isAvailable: true });
    } else if (booking.bookingType === 'ambulance') {
      await Ambulance.findByIdAndUpdate(booking.itemId, {
        isAvailable: true,
        status: 'available',
        user: null
      });
    }

    await Booking.findByIdAndDelete(req.params.id);

    res.json({ msg: 'Booking removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
