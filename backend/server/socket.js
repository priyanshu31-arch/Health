const socketIo = require('socket.io');

let io;

const initSocket = (server) => {
    io = socketIo(server, {
        cors: {
            origin: "*", // Allow all for dev
            methods: ["GET", "POST"]
        }
    });

    io.on('connection', (socket) => {
        console.log('New client connected:', socket.id);

        // Join a specific booking room
        socket.on('join_booking', (bookingId) => {
            socket.join(bookingId);
            console.log(`Socket ${socket.id} joined booking room: ${bookingId}`);
        });

        // Send location update (Ambulance -> User or User -> Ambulance)
        socket.on('send_location', (data) => {
            const { bookingId, location } = data; // location: { lat, lng }
            // Broadcast to everyone in the room except sender
            socket.to(bookingId).emit('receive_location', location);
        });

        // Admin acknowledgement
        socket.on('send_ack', (bookingId) => {
            io.to(bookingId).emit('receive_ack', { status: 'acknowledged', message: 'Ambulance is on the way!' });
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
        });
    });

    return io;
};

const getIo = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};

module.exports = { initSocket, getIo };
