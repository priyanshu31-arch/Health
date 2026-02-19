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
    hash: {
        type: String,
        required: false, // Will be generated before save
    },
});

// Blockchain Simulation: Generate Hash before saving
const crypto = require('crypto');

HealthRecordSchema.pre('save', function (next) {
    if (!this.isModified('hash')) {
        // Create a string from critical data fields
        const dataString = `${this.user}-${this.type}-${this.value}-${this.date.toISOString()}`;
        // Generate SHA-256 hash
        this.hash = crypto.createHash('sha256').update(dataString).digest('hex');
    }
    next();
});

module.exports = mongoose.model('HealthRecord', HealthRecordSchema);
