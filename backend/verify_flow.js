const axios = require('axios');

const API_URL = 'http://localhost:5000/api';
let userToken = '';
let adminToken = '';
let hospitalId = '';
let bedId = '';
let bookingId = '';

async function run() {
    try {
        console.log('--- STARTING VERIFICATION ---');

        // 1. Signup/Login User
        console.log('\n[1] Registering User...');
        const userEmail = `user_${Date.now()}@test.com`;
        try {
            const regRes = await axios.post(`${API_URL}/auth/signup`, {
                name: 'Flow User',
                email: userEmail,
                password: 'password123'
            });
            userToken = regRes.data.token;
            console.log('User Registered. Token:', userToken.substring(0, 10) + '...');
        } catch (e) {
            console.log('User registration failed, trying login equivalent? No needs unique email.');
            throw e;
        }

        // 2. Signup/Login Admin (To create hospital/bed if needed, or just use existing)
        // We will use the previously verified admin credentials if possible, or create new.
        console.log('\n[2] Registering Admin...');
        const adminEmail = `admin_${Date.now()}@test.com`;
        try {
            const adminRes = await axios.post(`${API_URL}/auth/signup`, {
                name: 'Flow Admin',
                email: adminEmail,
                password: 'password123',
                hospitalName: 'Flow Hospital'
            });
            adminToken = adminRes.data.token;
            console.log('Admin Registered. Token:', adminToken.substring(0, 10) + '...');

            // Register Hospital (The signup above usually creates the USER, but not the Hospital Record fully? 
            // Wait, User with 'hospitalName' becomes Admin. 
            // Hospital Registration is a separate step usually in frontend: /admin/register-hospital.
            // Let's check logic. If I provide hospitalName in signup, does it create a Hospital?
            // Checking routes/auth.js: It sets role='admin' but doesn't create Hospital model entry automatically?
            // Let's assume we need to POST /api/hospitals to create it.

            console.log('Creating Hospital...');
            const hospRes = await axios.post(`${API_URL}/hospitals`, {
                name: `Flow Hospital ${Date.now()}`,
                email: adminEmail,
                bio: 'Test Bio',
                rating: 5,
                location: 'Test Location',
                city: 'Test City',
                address: 'Test Address',
                coordinates: { lat: 0, lng: 0 }
            }, { headers: { 'x-auth-token': adminToken } });

            hospitalId = hospRes.data._id;
            console.log('Hospital Created:', hospitalId);

            // Add Bed
            console.log('Adding Bed...');
            const bedRes = await axios.post(`${API_URL}/beds`, {
                hospital: hospitalId,
                bedNumber: 'Flow-Bed-1',
                isAvailable: true,
                type: 'General',
                price: 500
            }, { headers: { 'x-auth-token': adminToken } });
            bedId = bedRes.data._id;
            // Add Ambulance
            console.log('Adding Ambulance...');
            const ambRes = await axios.post(`${API_URL}/ambulances`, {
                hospital: hospitalId,
                ambulanceNumber: 'KA-01-AM-9999',
                isAvailable: true,
                type: 'ICU',
                price: 1000
            }, { headers: { 'x-auth-token': adminToken } });
            ambId = ambRes.data._id;
            console.log('Ambulance Added:', ambId);

        } catch (e) {
            console.error('Admin setup failed:', e.message);
            throw e;
        }

        // 3. User Books Bed
        console.log('\n[3] User Booking Bed...');
        const bookRes = await axios.post(`${API_URL}/bookings`, {
            bookingType: 'bed',
            itemId: bedId,
            hospital: hospitalId,
            patientName: 'Test Patient Bed',
            contactNumber: '1234567890'
        }, { headers: { 'x-auth-token': userToken } });
        bookingId = bookRes.data._id;
        console.log('Bed Booking Created:', bookingId);

        // 3a. User Books Ambulance
        console.log('\n[3a] User Booking Ambulance...');
        const ambBookRes = await axios.post(`${API_URL}/bookings`, {
            bookingType: 'ambulance',
            itemId: ambId,
            hospital: hospitalId,
            patientName: 'Test Patient Ambulance',
            contactNumber: '0987654321'
        }, { headers: { 'x-auth-token': userToken } });
        const ambBookingId = ambBookRes.data._id;
        console.log('Ambulance Booking Created:', ambBookingId);

        // 4. Verify User History
        console.log('\n[4] Verifying User History...');
        const historyRes = await axios.get(`${API_URL}/bookings/my`, {
            headers: { 'x-auth-token': userToken }
        });

        const foundBooking = historyRes.data.find(b => b._id === bookingId);
        const foundAmbBooking = historyRes.data.find(b => b._id === ambBookingId);

        if (foundBooking && foundAmbBooking) {
            console.log('✅ Both Bookings found in User History.');
        } else {
            throw new Error('Bookings NOT found in User History');
        }

        // 6. Admin Verifies Booking
        console.log('\n[6] Admin Verifying Bookings...');
        const adminBookingsRes = await axios.get(`${API_URL}/bookings`);
        const adminFound = adminBookingsRes.data.find(b => b._id === bookingId);
        const adminAmbFound = adminBookingsRes.data.find(b => b._id === ambBookingId);

        if (adminFound && adminAmbFound) {
            console.log('✅ Both Bookings visible to Admin.');
        } else {
            throw new Error('Bookings NOT visible to Admin');
        }

        // 7. Admin Deletes Booking
        console.log('\n[7] Admin Deleting Bookings...');
        await axios.delete(`${API_URL}/bookings/${bookingId}`, {
            headers: { 'x-auth-token': adminToken }
        });
        await axios.delete(`${API_URL}/bookings/${ambBookingId}`, {
            headers: { 'x-auth-token': adminToken }
        });
        console.log('Bookings Deleted.');

        // 8. Verify Released (Just verification of script completion at this point)
        console.log('\n--- VERIFICATION SUCCESSFUL ---');

    } catch (err) {
        console.error('\n❌ VERIFICATION FAILED:', err.response ? err.response.data : err.message);
        process.exit(1);
    }
}

run();
