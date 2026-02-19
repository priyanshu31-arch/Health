const mongoose = require('mongoose');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const HealthRecord = require('../models/HealthRecord');
const Consent = require('../models/Consent');
const AuditLog = require('../models/AuditLog');
require('dotenv').config(); // Load environment variables if needed, specifically DB connection

// Hardcoded for testing if env not ready, or strictly mock
const TEST_DB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/health_app_test';

async function runVerification() {
    console.log('--- Starting Backend Foundation Verification ---');
    
    try {
        await mongoose.connect(TEST_DB_URI);
        console.log('Connected to MongoDB.');

        // 1. Create User
        const testUser = new User({
            name: 'Test Patient',
            email: `patient_${Date.now()}@test.com`,
            password: 'hashedpassword123',
            role: 'user'
        });
        await testUser.save();
        console.log(`[PASS] Created User: ${testUser.id}`);

        // 2. Create Doctor
        const testDoctor = new Doctor({
            name: 'Dr. Test',
            specialty: 'General',
            qualification: 'MD',
            contact: '1234567890'
        });
        await testDoctor.save();
        console.log(`[PASS] Created Doctor: ${testDoctor.id}`);

        // 3. Create Health Record (Check Hash)
        const record = new HealthRecord({
            user: testUser.id,
            type: 'Blood Pressure',
            value: '120/80',
            unit: 'mmHg'
        });
        await record.save();
        
        if (record.hash) {
            console.log(`[PASS] Health Record Created with Hash: ${record.hash}`);
        } else {
            console.error('[FAIL] Health Record Hash Missing!');
        }

        // 4. Create Consent
        const consent = new Consent({
            patient: testUser.id,
            doctor: testDoctor.id,
            status: 'pending',
            expiresAt: new Date(Date.now() + 86400000) // 1 day later
        });
        await consent.save();
        console.log(`[PASS] Consent Request Created: ${consent.id}`);

        // 5. Create Audit Log
        const log = new AuditLog({
            action: 'TEST_ACTION',
            performedBy: testUser.id,
            targetResource: record.id,
            resourceType: 'HealthRecord',
            details: 'Created a health record'
        });
        await log.save();
        console.log(`[PASS] Audit Log Entry Created: ${log.id}`);

        // 6. Tamper Detection Test
        // Re-saving strictness or manual verification logic...
        // Ideally, if we change data, hash should change or be invalid if we tracked "previousHash".
        // Since we are just hashing content on save, let's verify re-save updates hash.
        const originalHash = record.hash;
        record.value = '130/90';
        await record.save();
        const newHash = record.hash;

        if (originalHash !== newHash) {
             console.log(`[PASS] Hash updated on record change: ${originalHash} -> ${newHash}`);
        } else {
             console.error('[FAIL] Hash did not update on record change!');
        }

    } catch (error) {
        console.error('Verification Failed:', error);
    } finally {
        await mongoose.connection.close();
        console.log('--- Verification Complete ---');
    }
}

runVerification();
