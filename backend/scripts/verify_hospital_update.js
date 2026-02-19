const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function verifyHospitalUpdate() {
    try {
        const timestamp = Date.now();
        const email = `testadmin_${timestamp}@example.com`;
        const password = 'password123';

        console.log(`1. Registering new admin user: ${email}`);
        const authRes = await axios.post(`${API_URL}/auth/signup`, {
            name: 'Test Admin',
            email: email,
            password: password,
            hospitalName: `Test Hospital ${timestamp}`
        });

        const token = authRes.data.token;
        console.log('Admin registered. Token received.');

        // Configure axios with auth header
        const config = {
            headers: { 'x-auth-token': token }
        };

        // 2. Check/Create Hospital
        console.log('2. Checking for hospital...');
        let hospital;
        try {
            const meRes = await axios.get(`${API_URL}/hospitals/me`, config);
            hospital = meRes.data.hospital;
            console.log('Hospital found:', hospital.name);
        } catch (err) {
            if (err.response && err.response.status === 404) {
                console.log('Hospital not found (unexpected for admin signup but handling)... creating one.');
                const createRes = await axios.post(`${API_URL}/hospitals`, {
                    name: `Test Hospital ${timestamp}`,
                    address: 'Initial Address',
                    latitude: 10.0,
                    longitude: 10.0,
                    bio: 'Test Bio'
                }, config);
                hospital = createRes.data;
            } else {
                throw err;
            }
        }

        const hospitalId = hospital._id;
        console.log(`Hospital ID: ${hospitalId}`);

        // 3. Update Location (Attempt 1)
        console.log('3. Updating location (Attempt 1)...');
        const update1 = {
            address: '123 Test St, Locality A',
            latitude: 12.9716,
            longitude: 77.5946
        };
        await axios.put(`${API_URL}/hospitals/${hospitalId}`, update1, config);

        // Verify Attempt 1
        console.log('Verifying Attempt 1...');
        const check1 = await axios.get(`${API_URL}/hospitals/${hospitalId}`);
        if (check1.data.hospital.address === update1.address &&
            check1.data.hospital.latitude === update1.latitude &&
            check1.data.hospital.longitude === update1.longitude) {
            console.log('SUCCESS: First update verified.');
        } else {
            console.error('FAILURE: First update mismatch.', check1.data.hospital);
        }

        // 4. Update Location (Attempt 2)
        console.log('4. Updating location (Attempt 2 - New Location)...');
        const update2 = {
            address: '456 Another Rd, Locality B',
            latitude: 13.0000,
            longitude: 78.0000
        };
        await axios.put(`${API_URL}/hospitals/${hospitalId}`, update2, config);

        // Verify Attempt 2
        console.log('Verifying Attempt 2...');
        const check2 = await axios.get(`${API_URL}/hospitals/${hospitalId}`);
        if (check2.data.hospital.address === update2.address &&
            check2.data.hospital.latitude === update2.latitude &&
            check2.data.hospital.longitude === update2.longitude) {
            console.log('SUCCESS: Second update verified.');
            console.log('VERIFICATION COMPLETE: Hospital location can be updated multiple times.');
        } else {
            console.error('FAILURE: Second update mismatch.', check2.data.hospital);
        }

    } catch (error) {
        console.error('Verification failed:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error('Stack:', error.stack);
        }
    }
}

verifyHospitalUpdate();
