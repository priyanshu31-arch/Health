const mongoose = require('mongoose');

const DoctorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    specialty: {
        type: String, // e.g., "Cardiologist", "Dermatologist"
        required: true,
    },
    hospital: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hospital', // Optional link to a registered hospital
        required: false,
    },
    qualification: {
        type: String, // e.g., "MBBS, MD"
        required: true,
    },
    experience: {
        type: Number, // Years of experience
        default: 0,
    },
    contact: {
        type: String, // Phone or Email
        required: true,
    },
    bio: {
        type: String,
        default: '',
    },
    image: {
        type: String,
        default: '',
    },
    availability: {
        type: String, // Simple text for now, e.g., "Mon-Fri 9am-5pm"
        default: 'Available',
    },
});

module.exports = mongoose.model('Doctor', DoctorSchema);
