const axios = require('axios');

const AMBULANCE_ID = process.argv[2];
const API_URL = 'http://localhost:5000/api/ambulance/location';

if (!AMBULANCE_ID) {
    console.error('❌ Error: Please provide an Ambulance ID.');
    console.log('Usage: node scripts/simulate_ambulance.js <AMBULANCE_ID>');
    process.exit(1);
}

// Starting coordinates (Bangalore Center)
let lat = 12.9716;
let lon = 77.5946;

console.log(`🚑 Starting simulation for Ambulance ID: ${AMBULANCE_ID}`);
console.log(`📍 Initial Location: ${lat}, ${lon}`);
console.log('Press Ctrl+C to stop the simulation.');

setInterval(async () => {
    // Simulate movement: Move diagonally roughly North-East
    // 0.0005 degrees is approx 55 meters
    lat += 0.0005;
    lon += 0.0005;

    try {
        const response = await axios.put(`${API_URL}/${AMBULANCE_ID}`, {
            lat,
            lon
        });

        console.log(`✅ Updated Location: ${lat.toFixed(4)}, ${lon.toFixed(4)}`);
    } catch (error) {
        console.error('❌ Update Failed:', error.response ? error.response.data : error.message);
    }
}, 3000); // Update every 3 seconds
