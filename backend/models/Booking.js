const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  bookingType: {
    type: String,
    required: true,
    enum: ['bed', 'ambulance'],
  },
  bookingTypeModel: {
    type: String,
    required: true,
    enum: ['Bed', 'Ambulance'],
  },
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'bookingTypeModel',
  },
  hospital: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  bookedAt: {
    type: Date,
    default: Date.now,
  },
  patientName: {
    type: String,
    required: true,
  },
  contactNumber: {
    type: String,
    required: true,
  },
  pickupAddress: {
    type: String, // For ambulance bookings
  },
  pickupLat: {
    type: Number,
  },
  pickupLon: {
    type: Number,
  },
  isOffline: {
    type: Boolean,
    default: false,
  },
  sharedRecords: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HealthRecord'
  }],
});

module.exports = mongoose.model('Booking', BookingSchema);
