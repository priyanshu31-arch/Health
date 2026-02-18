const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Ambulance = require('../models/Ambulance');

dotenv.config();

const resetAmbulances = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB Connected');

        const result = await Ambulance.updateMany(
            {},
            {
                $set: {
                    isAvailable: true,
                    status: 'available'
                }
            }
        );

        console.log(`✅ Reset ${result.modifiedCount} ambulances to available.`);
        process.exit(0);
    } catch (err) {
        console.error('❌ Error resetting ambulances:', err);
        process.exit(1);
    }
};

resetAmbulances();
