const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const Hospital = require('./models/Hospital');
const Ambulance = require('./models/Ambulance');
const Bed = require('./models/Bed');
const User = require('./models/User');

dotenv.config();

const sampleHospitals = [
    {
        name: 'Apollo Hospital',
        bio: 'Sector 34, Chandigarh • Multi-speciality',
        rating: 4.8,
        photo: 'https://images.unsplash.com/photo-1587351021759-3e566b9af9ef?q=80&w=2072&auto=format&fit=crop',
        email: 'admin@apollo.com',
        phone: '+919988776655'
    },
    {
        name: 'Max Hospital',
        bio: 'Mohali, Chandigarh • Premium Care',
        rating: 4.6,
        photo: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=2053&auto=format&fit=crop',
        email: 'admin@max.com',
        phone: '+919988776644'
    },
    {
        name: 'Fortis Hospital',
        bio: 'Sector 62, Chandigarh • Heart Care',
        rating: 4.7,
        photo: 'https://images.unsplash.com/photo-1512678080530-7760d81faba6?q=80&w=2074&auto=format&fit=crop',
        email: 'admin@fortis.com',
        phone: '+919988776633'
    }
];

const seedDatabase = async () => {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected.');

        // Clear existing data
        console.log('🧹 Clearing existing data...');
        await Hospital.deleteMany({});
        await Ambulance.deleteMany({});
        await Bed.deleteMany({});
        await User.deleteMany({ role: 'admin' }); // Optional: clear existing admins

        const createdHospitals = [];

        // Create Hospitals and Admin Users
        for (const h of sampleHospitals) {
            // 1. Create Admin User for Hospital
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('123456', salt);

            const user = new User({
                name: h.name + ' Admin',
                email: h.email,
                password: hashedPassword,
                role: 'admin',
                hospitalName: h.name
            });
            await user.save();

            // 2. Create Hospital
            const hospital = new Hospital({
                name: h.name,
                user: user._id,
                bio: h.bio,
                rating: h.rating,
                photo: h.photo,
                address: 'Chandigarh, India',
                latitude: 30.7333 + (Math.random() * 0.05),
                longitude: 76.7794 + (Math.random() * 0.05)
            });
            const savedHospital = await hospital.save();
            createdHospitals.push(savedHospital);
            console.log(`🏥 Created: ${h.name}`);

            // 3. Create Beds (20 beds per hospital)
            const beds = [];
            for (let i = 1; i <= 20; i++) {
                beds.push({
                    bedNumber: `B-${100 + i}`,
                    isAvailable: Math.random() > 0.3, // 70% chance available
                    hospital: savedHospital._id
                });
            }
            await Bed.insertMany(beds);
            console.log(`   🛏️ Added 20 beds`);

            // 4. Create Ambulances (5 per hospital)
            const ambulances = [];
            for (let i = 1; i <= 5; i++) {
                ambulances.push({
                    ambulanceNumber: `CH-0${i}-${1000 + Math.floor(Math.random() * 9000)}`,
                    isAvailable: Math.random() > 0.2,
                    hospital: savedHospital._id,
                    status: 'available',
                    currentLocation: {
                        type: 'Point',
                        coordinates: [76.7794 + (Math.random() * 0.1), 30.7333 + (Math.random() * 0.1)] // Random Chandigarh coords
                    }
                });
            }
            await Ambulance.insertMany(ambulances);
            console.log(`   🚑 Added 5 ambulances`);
        }

        console.log('✨ Database Seeded Successfully!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
};

seedDatabase();
