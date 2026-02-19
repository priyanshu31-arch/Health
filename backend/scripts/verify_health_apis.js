const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

const API_URL = 'http://localhost:5000/api';
let token = null;

// Connect DB to clean up if needed (optional)
mongoose.connect(process.env.MONGO_URI).then(() => console.log('DB Connected for cleanup/verification (optional)'));

async function login() {
    try {
        // Register or Login a test user
        const userData = {
            email: 'test_health_admin@example.com',
            password: 'password123',
            name: 'Health Admin'
        };

        try {
            await axios.post(`${API_URL}/auth/signup`, userData);
            console.log('✅ Registered test user');
        } catch (e) {
            if (e.response && e.response.status === 400) {
                console.log('ℹ️ User likely already exists, proceeding to login');
            } else {
                console.log('⚠️ Registration warning:', e.message);
            }
        }

        const res = await axios.post(`${API_URL}/auth/login`, {
            email: userData.email,
            password: userData.password
        });

        token = res.data.token;
        console.log('✅ Login successful');
    } catch (error) {
        console.error('❌ Login failed:', error.message);
        process.exit(1);
    }
}

async function verifyHealthTips() {
    console.log('\n--- Verifying Health Tips ---');
    try {
        // Create
        const res = await axios.post(`${API_URL}/health-tips`, {
            title: 'Benefits of Water',
            content: 'Drinking water is good.',
            tags: ['Hydration']
        }, { headers: { 'x-auth-token': token } });
        console.log('✅ Created Health Tip:', res.data.title);

        // Get All
        const getRes = await axios.get(`${API_URL}/health-tips`);
        if (getRes.data.length > 0) console.log('✅ Fetched Health Tips:', getRes.data.length);
        else console.error('❌ Failed to fetch health tips');

    } catch (error) {
        console.error('❌ Health Tips Failed:', error.response ? `${error.response.status} ${error.response.statusText}` : error.message);
    }
}

async function verifyHealthRecords() {
    console.log('\n--- Verifying Health Records ---');
    try {
        // Create
        const res = await axios.post(`${API_URL}/health-records`, {
            type: 'Blood Pressure',
            value: '120/80',
            unit: 'mmHg'
        }, { headers: { 'x-auth-token': token } });
        console.log('✅ Added Health Record:', res.data.value);

        // Get All
        const getRes = await axios.get(`${API_URL}/health-records`, { headers: { 'x-auth-token': token } });
        if (getRes.data.length > 0) console.log('✅ Fetched Health Records:', getRes.data.length);
        else console.error('❌ Failed to fetch health records');

    } catch (error) {
        console.error('❌ Health Records Failed:', error.response ? `${error.response.status} ${error.response.statusText}` : error.message);
    }
}

async function verifyDoctors() {
    console.log('\n--- Verifying Doctors ---');
    try {
        // Create
        const res = await axios.post(`${API_URL}/doctors`, {
            name: 'Dr. House',
            specialty: 'Diagnostician',
            qualification: 'MD',
            contact: '1234567890'
        }, { headers: { 'x-auth-token': token } });
        console.log('✅ Added Doctor:', res.data.name);

        // Get All
        const getRes = await axios.get(`${API_URL}/doctors`);
        if (getRes.data.length > 0) console.log('✅ Fetched Doctors:', getRes.data.length);
        else console.error('❌ Failed to fetch doctors');

    } catch (error) {
        console.error('❌ Doctors Failed:', error.response ? `${error.response.status} ${error.response.statusText}` : error.message);
    }
}

async function verifyDiseases() {
    console.log('\n--- Verifying Diseases ---');
    try {
        // Create
        const uniqueName = 'Flu-' + Date.now();
        const res = await axios.post(`${API_URL}/diseases`, {
            name: uniqueName,
            symptoms: ['Fever', 'Chills'],
            causes: ['Virus']
        }, { headers: { 'x-auth-token': token } });
        console.log('✅ Added Disease:', res.data.name);

        // Get All
        const getRes = await axios.get(`${API_URL}/diseases`);
        if (getRes.data.length > 0) console.log('✅ Fetched Diseases:', getRes.data.length);
        else console.error('❌ Failed to fetch diseases');

    } catch (error) {
        console.error('❌ Diseases Failed:', error.response ? `${error.response.status} ${error.response.statusText}` : error.message);
    }
}

async function run() {
    await login();
    await verifyHealthTips();
    await verifyHealthRecords();
    await verifyDoctors();
    await verifyDiseases();
    console.log('\n✅ Verification Complete');
    process.exit(0);
}

run();
