const mongoose = require('mongoose');

const HealthRecordSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    type: {
        type: String, // e.g., "Blood Pressure", "Blood Sugar", "Weight", "Prescription"
        required: true,
    },
    value: {
        type: String, // Store as string to handle "120/80" or "95 kg"
        required: true,
    },
    unit: {
        type: String, // e.g., "mmHg", "mg/dL", "kg"
        default: '',
    },
    notes: {
        type: String,
        default: '',
    },
    file: {
        type: String, // URL to uploaded report/prescription
        default: '',
    },
    date: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('HealthRecord', HealthRecordSchema);
