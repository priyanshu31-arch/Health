const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
    action: {
        type: String,
        required: true // e.g., 'VIEW_RECORD', 'GRANT_CONSENT', 'LOGIN'
    },
    performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    targetResource: {
        type: mongoose.Schema.Types.ObjectId,
        // Generic reference, could be HealthRecord, Consent, etc.
        // We actully don't strictly need 'ref' here if it can be dynamic, 
        // but for now let's just store the ID.
        required: false 
    },
    resourceType: { // Helper to know what collection targetResource belongs to
        type: String,
        required: false
    },
    details: {
        type: String, // or Object if we want more structure
        default: ''
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('AuditLog', AuditLogSchema);
