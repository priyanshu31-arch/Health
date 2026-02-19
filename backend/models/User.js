const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: false,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  hospitalName: {
    type: String,
    required: false,
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'doctor'],
    default: 'user',
  },
  profilePhoto: {
    type: String,
    default: '',
  },
  age: {
    type: String,
    required: false,
  },
  location: {
    type: String,
    required: false,
  },
  phone: {
    type: String,
    required: false,
  },
  resetPasswordOTP: {
    type: String,
    required: false,
  },
  resetPasswordExpires: {
    type: Date,
    required: false,
  },
});

module.exports = mongoose.model('User', UserSchema);
