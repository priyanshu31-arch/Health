const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Booking = require('../models/Booking');
const Ambulance = require('../models/Ambulance');

dotenv.config();

const findBooking = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to DB');

        // Check for normal Bookings
        const lastBooking = await Booking.findOne().sort({ bookedAt: -1 });

        // Check for Ambulances that are 'booked' (since our new flow updates Ambulance directly)
        const lastBookedAmbulance = await Ambulance.findOne({ status: 'booked' });

        if (lastBookedAmbulance) {
            console.log(`FOUND_ID:${lastBookedAmbulance._id}`);
            console.log(`Type: Ambulance (Direct)`);
        } else if (lastBooking) {
            console.log(`FOUND_ID:${lastBooking._id}`);
            console.log(`Type: Booking`);
        } else {
            console.log('NO_BOOKINGS_FOUND');
        }

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

findBooking();
