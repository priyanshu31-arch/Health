const mongoose = require('mongoose');

const HospitalSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  photo: {
    type: String,
    default: 'https://i.imgur.com/JUZSO7r.png',
  },
  bio: {
    type: String,
    default: 'A hospital dedicated to providing the best healthcare services.',
  },
  rating: {
    type: Number,
    default: 4.5,
  },
  address: {
    type: String,
    default: 'Bangalore, India',
  },
  latitude: {
    type: Number,
    default: 12.9716, // Bangalore default
  },
  longitude: {
    type: Number,
    default: 77.5946,
  },
});

module.exports = mongoose.model('Hospital', HospitalSchema);
