const mongoose = require('mongoose');

const BedSchema = new mongoose.Schema({
  bedNumber: {
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
});

module.exports = mongoose.model('Bed', BedSchema);
