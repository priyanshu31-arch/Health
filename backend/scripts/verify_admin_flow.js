const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api'; // Updated Base URL to include /api
const AUTH_URL = 'http://localhost:5000/api/auth'; // Auth is separate often, let's check index.js
// Index.js: app.use('/api/auth', require('./routes/auth'));
// app.use('/api/ambulances', ...);
// app.use('/api/hospitals', ...);

const ADMIN_CREDENTIALS = {
    email: 'admin@apollo.com',
    password: '123456'
};

async function verifyAdminFlow() {
    try {
        console.log('🔄 Starting Admin Flow Verification...');

        // 1. Login as Admin
        console.log('🔑 Logging in as Admin...');
        const loginRes = await axios.post(`${AUTH_URL}/login`, ADMIN_CREDENTIALS);
        const { token, user } = loginRes.data;

        if (!token || user.role !== 'admin') {
            throw new Error('Login failed or not an admin');
        }
        console.log('✅ Logged in.');

        const authHeaders = {
            headers: { 'x-auth-token': token }
        };

        // 2. Get My Hospital (to get ID)
        console.log('🏥 Fetching Admin Hospital...');
        // Endpoint: /api/hospitals/me
        const hospitalRes = await axios.get(`${BASE_URL}/hospitals/me`, authHeaders);
        const hospitalId = hospitalRes.data.hospital._id;
        console.log(`✅ Hospital Found: ${hospitalRes.data.hospital.name} (${hospitalId})`);

        // 3. Add New Ambulance
        const newAmbNumber = `TEST-AMB-${Math.floor(Math.random() * 1000)}`;
        console.log(`🚑 Adding New Ambulance: ${newAmbNumber}...`);

        // Endpoint: /api/ambulances
        const addAmbRes = await axios.post(`${BASE_URL}/ambulances`, {
            ambulanceNumber: newAmbNumber,
            isAvailable: true,
            hospital: hospitalId
        }, authHeaders);

        const newAmbulanceId = addAmbRes.data._id;
        console.log('✅ Ambulance Added.');

        // 4. Client/User Side Verification
        console.log('👀 Simulate User: Fetching all ambulances...');
        // Endpoint: /api/ambulances
        const allAmbulancesRes = await axios.get(`${BASE_URL}/ambulances`);
        const found = allAmbulancesRes.data.find(a => a._id === newAmbulanceId);

        if (found && found.ambulanceNumber === newAmbNumber) {
            console.log('✅ SUCCESS: New ambulance is visible to users!');
        } else {
            throw new Error('New ambulance NOT found in public list.');
        }

        // 5. Cleanup
        console.log('🧹 Cleaning up...');
        await axios.delete(`${BASE_URL}/ambulances/${newAmbulanceId}`, authHeaders);
        console.log('✅ Cleanup complete.');

        console.log('🎉 Admin Flow Verification PASSED!');

    } catch (error) {
        console.error('❌ Verification FAILED:', error.response ? error.response.data : error.message);
        if (error.response && error.response.status === 404) {
            console.error('Endpoint:', error.config.url);
        }
        process.exit(1);
    }
}

verifyAdminFlow();
