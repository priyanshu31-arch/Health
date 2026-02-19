const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Hospital = require('../models/Hospital');
const Ambulance = require('../models/Ambulance');

const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

const verify = async () => {
    try {
        console.log('🔌 Connecting to MongoDB...');
        console.log('URI:', process.env.MONGO_URI ? process.env.MONGO_URI.split('@')[1] : 'UNDEFINED');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected.');

        const hospitalCount = await Hospital.countDocuments();
        console.log(`Hospital Count: ${hospitalCount}`);

        const ambulanceCount = await Ambulance.countDocuments();
        console.log(`Ambulance Count: ${ambulanceCount}`);

        const hospitals = await Hospital.find({});
        console.log(`\n🏥 Found ${hospitals.length} Hospitals:\n`);

        hospitals.forEach(h => {
            console.log(`- Name: ${h.name}`);
            console.log(`  Address: ${h.address}`);
            console.log(`  Lat/Lon: ${h.latitude}, ${h.longitude}`);
            console.log(`  Bio: ${h.bio}`);
            console.log('-----------------------------------');
        });

        const ambulances = await Ambulance.find({});
        console.log(`\n🚑 Found ${ambulances.length} Ambulances:\n`);

        // Check first 3 ambulances
        ambulances.slice(0, 3).forEach(a => {
            console.log(`- Number: ${a.ambulanceNumber}`);
            console.log(`  Location: ${JSON.stringify(a.currentLocation)}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('❌ Verification failed:', error);
        process.exit(1);
    }
};

verify();
