const axios = require('axios');
const mongoose = require('mongoose');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
require('dotenv').config();

const API_URL = 'http://localhost:5000/api';
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/health_app'; // Use same DB as server

// Helper: Login and return token
async function login(email, password) {
    try {
        const res = await axios.post(`${API_URL}/auth/login`, { email, password });
        return res.data.token;
    } catch (err) {
        console.error(`Login failed for ${email}:`, err.response ? err.response.data : err.message);
        return null;
    }
}

async function runTest() {
    console.log('--- Starting Consent Flow Test ---');

    // 1. Setup Data (Direct DB access for setup)
    await mongoose.connect(MONGO_URI);
    
    // Create/Find Patient
    let patient = await User.findOne({ email: 'patient_flow@test.com' });
    if (!patient) {
        patient = new User({
            name: 'Flow Patient',
            email: 'patient_flow@test.com',
            password: 'password123', // Will need a real registered user typically, but for now we might need to rely on existing auth flow or manually hash and save if we want to login.
            // To simplify, let's use the register endpoint or ensuring we have a known user.
            role: 'user'
        });
        // We'll rely on the /register endpoint to ensure password hashing relies on the same logic as the app
    }
    
    // Create/Find Doctor User & Profile
    let doctorUser = await User.findOne({ email: 'doctor_flow@test.com' });
    // We will register them via API to ensure we can login
    
    await mongoose.connection.close(); 

    // 2. Register/Login Users via API
    console.log('Registering users...');
    try {
        await axios.post(`${API_URL}/auth/signup`, {
            name: 'Flow Patient',
            email: 'patient_flow@test.com',
            password: 'password123',
            role: 'user'
        });
    } catch (e) { console.error('Registration failed:', e.response ? e.response.data : e.message); }

    try {
        await axios.post(`${API_URL}/auth/signup`, {
            name: 'Flow Doctor',
            email: 'doctor_flow@test.com',
            password: 'password123',
            role: 'doctor' // Ensure backend allows registering as doctor or we manually update
        });
        // Manually ensure role is doctor if register defaults to user
        // But let's assume register handles it or we manually fix it in DB if needed.
        // Also need to create Doctor Profile for Consent Logic
    } catch (e) { console.error('Registration failed:', e.response ? e.response.data : e.message); }

    // Fix Doctor Data manually to ensure test passes (create Doctor Profile)
    await mongoose.connect(MONGO_URI);
    const docUser = await User.findOne({ email: 'doctor_flow@test.com' });
    if (docUser) { 
        docUser.role = 'doctor'; 
        await docUser.save();
        
        const docProfile = await Doctor.findOne({ contact: 'doctor_flow@test.com' });
        if (!docProfile) {
            await new Doctor({
                name: 'Dr. Flow',
                specialty: 'Test',
                qualification: 'MD',
                contact: 'doctor_flow@test.com', // Links via contact email
            }).save();
        }
    }
    const patUser = await User.findOne({ email: 'patient_flow@test.com' });
    await mongoose.connection.close();


    // 3. Login
    const patientToken = await login('patient_flow@test.com', 'password123');
    const doctorToken = await login('doctor_flow@test.com', 'password123');

    if (!patientToken || !doctorToken) {
        console.error('Failed to login users. Aborting.');
        return;
    }

    // 4. Doctor Requests Access
    console.log('\n--- Step 1: Doctor Requests Access ---');
    try {
        const res = await axios.post(`${API_URL}/consent/request`, {
            patientId: patUser._id
        }, { headers: { 'x-auth-token': doctorToken } });
        console.log('[PASS] Request Sent:', res.data.status);
    } catch (err) {
        console.error('[FAIL] Request Access:', err.response ? err.response.data : err.message);
    }

    // 5. Patient Checks Pending Requests
    console.log('\n--- Step 2: Patient Checks Requests ---');
    let requestId;
    try {
        const res = await axios.get(`${API_URL}/consent/pending`, { 
            headers: { 'x-auth-token': patientToken } 
        });
        console.log(`[PASS] Found ${res.data.length} pending requests`);
        if (res.data.length > 0) requestId = res.data[0]._id;
    } catch (err) {
        console.error('[FAIL] Check Pending:', err.response ? err.response.data : err.message);
    }

    // 6. Patient Approves Request
    if (requestId) {
        console.log('\n--- Step 3: Patient Approves Request ---');
        try {
            const res = await axios.put(`${API_URL}/consent/${requestId}/respond`, {
                status: 'approved'
            }, { headers: { 'x-auth-token': patientToken } });
            console.log('[PASS] Request Approved:', res.data.status);
        } catch (err) {
            console.error('[FAIL] Approve Request:', err.response ? err.response.data : err.message);
        }
    }

    // 7. Doctor Checks Access
    console.log('\n--- Step 4: Doctor Verifies Access ---');
    try {
        const res = await axios.get(`${API_URL}/consent/check/${patUser._id}`, { 
            headers: { 'x-auth-token': doctorToken } 
        });
        if (res.data.hasAccess) {
            console.log('[PASS] Access Verified: TRUE');
        } else {
            console.error('[FAIL] Access Verified: FALSE (Expected TRUE)');
        }
    } catch (err) {
        console.error('[FAIL] Check Access:', err.response ? err.response.data : err.message);
    }
}

runTest();
