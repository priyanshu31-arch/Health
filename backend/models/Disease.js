const mongoose = require('mongoose');

const DiseaseSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
    },
    symptoms: {
        type: [String], // e.g., ["Fever", "Cough", "Headache"]
        default: [],
    },
    causes: {
        type: [String],
        default: [],
    },
    remedies: {
        type: [String], // e.g., "Drink water", "Rest", "Paracetamol"
        default: [],
    },
    consultDoctor: {
        type: Boolean, // If true, show a warning to see a doctor immediately
        default: false,
    },
});

module.exports = mongoose.model('Disease', DiseaseSchema);
