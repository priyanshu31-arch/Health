const mongoose = require('mongoose');

const PointSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['Point'],
    required: true,
  },
  coordinates: {
    type: [Number], // [longitude, latitude]
    required: true,
  },
});

const AmbulanceSchema = new mongoose.Schema({
  ambulanceNumber: {
    type: String,
    required: true,
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
  hospital: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  pickupLocation: {
    type: PointSchema,
    default: undefined,
  },
  destinationAddress: {
    type: String,
    default: '',
  },
  currentLocation: {
    type: PointSchema,
    default: undefined,
  },
  status: {
    type: String,
    enum: ['available', 'booked', 'in-transit', 'completed'],
    default: 'available',
  },
});

// Create a 2dsphere index on the location fields for geospatial queries
AmbulanceSchema.index({ pickupLocation: '2dsphere' });
AmbulanceSchema.index({ currentLocation: '2dsphere' });

module.exports = mongoose.model('Ambulance', AmbulanceSchema);
