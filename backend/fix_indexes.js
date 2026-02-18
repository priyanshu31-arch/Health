const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const fixIndexes = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB Connected');

        const collection = mongoose.connection.collection('users');

        // List indexes to confirm
        const indexes = await collection.indexes();
        console.log('Current Indexes:', indexes);

        // Drop the problematic index
        try {
            await collection.dropIndex('username_1');
            console.log('✅ Dropped index: username_1');
        } catch (e) {
            console.log('⚠️ Index username_1 might not exist or already dropped:', e.message);
        }

        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
};

fixIndexes();
