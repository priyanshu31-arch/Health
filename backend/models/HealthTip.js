const mongoose = require('mongoose');

const HealthTipSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    author: {
        type: String, // Can be "Dr. Smith" or a user ID if needed
        default: 'Health Hub Admin',
    },
    image: {
        type: String, // URL to image
        default: '',
    },
    tags: {
        type: [String], // e.g., ["Diet", "Cardio", "Mental Health"]
        default: [],
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('HealthTip', HealthTipSchema);
