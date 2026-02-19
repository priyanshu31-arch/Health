const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const http = require('http');
const { initSocket } = require('./socket');

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => {
    console.error('❌ MongoDB Connection Failed:', err.message);
    process.exit(1);
  });

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/beds', require('./routes/beds'));
app.use('/api/ambulances', require('./routes/ambulances'));
app.use('/api/hospitals', require('./routes/hospitals'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/ambulance', require('./routes/ambulance-booking.js'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/health-tips', require('./routes/healthTips'));
app.use('/api/health-records', require('./routes/healthRecords'));
app.use('/api/doctors', require('./routes/doctors'));
app.use('/api/diseases', require('./routes/diseases'));

// Serve static uploads
const path = require('path');
const fs = require('fs');
const uploadsPath = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}
app.use('/uploads', express.static(uploadsPath));

app.get('/', (req, res) => {
  res.send('Hospital Admin Server is running with MongoDB');
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
