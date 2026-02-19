const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function verifyOfflineBooking() {
    try {
        console.log('1. Fetching hospitals...');
        const hospitalsRes = await axios.get(`${API_URL}/hospitals`);
        if (hospitalsRes.data.length === 0) {
            console.log('No hospitals found. Cannot proceed.');
            return;
        }
        const hospital = hospitalsRes.data[0];
        console.log(`Address found: ${hospital.name} (${hospital._id})`);

        console.log('2. Fetching beds for hospital...');
        const bedsRes = await axios.get(`${API_URL}/beds`);
        const beds = bedsRes.data.filter(b => b.hospital._id === hospital._id || b.hospital === hospital._id);

        const availableBed = beds.find(b => b.isAvailable);
        if (!availableBed) {
            console.log('No available beds found for testing.');
            // Create a bed if none exist?
            // Requires admin auth... skip for now.
            return;
        }
        console.log(`Found available bed: ${availableBed.bedNumber} (${availableBed._id})`);

        console.log('3. Attempting offline booking...');
        const bookingData = {
            bookingType: 'bed',
            itemId: availableBed._id,
            hospital: hospital._id,
            patientName: 'Test Offline Patient',
            contactNumber: '9999999999',
            isOffline: true
        };

        const bookingRes = await axios.post(`${API_URL}/bookings`, bookingData);
        console.log('Booking successful:', bookingRes.data);

        if (bookingRes.data.user === null && bookingRes.data.isOffline === true) {
            console.log('SUCCESS: Booking is marked as offline and user is null.');
        } else {
            console.error('FAILURE: Booking data mismatch.');
        }

        console.log('4. Verifying bed status is now unavailable...');
        const bedsRes2 = await axios.get(`${API_URL}/beds`);
        const updatedBed = bedsRes2.data.find(b => b._id === availableBed._id);
        if (!updatedBed.isAvailable) {
            console.log('SUCCESS: Bed is now marked as unavailable.');
        } else {
            console.error('FAILURE: Bed is still available.');
        }

        // Optional: Clean up
        console.log('5. Cleaning up (Deleting booking)...');
        await axios.delete(`${API_URL}/bookings/${bookingRes.data._id}`);
        console.log('Booking deleted. Checking bed status...');

        // Bed should be available again (handled by delete booking logic)
        const bedsRes3 = await axios.get(`${API_URL}/beds`);
        const finalBed = bedsRes3.data.find(b => b._id === availableBed._id);
        if (finalBed.isAvailable) {
            console.log('SUCCESS: Bed is available again.');
        } else {
            console.log('WARNING: Bed did not return to available (check delete logic).');
        }

    } catch (error) {
        console.error('Verification failed:', error.response?.data || error.message);
    }
}

verifyOfflineBooking();
