const io = require('socket.io-client');

const SOCKET_URL = 'http://localhost:5000'; // Ensure this matches your server URL
const bookingId = process.argv[2];

if (!bookingId) {
    console.error('Please provide a bookingId.');
    console.error('Usage: node simulate_location.js <bookingId>');
    process.exit(1);
}

const socket = io(SOCKET_URL);

// Route: Indiranagar to MG Road approx coordinates
const route = [
    { lat: 12.9716, lng: 77.5946 }, // Start
    { lat: 12.9720, lng: 77.5950 },
    { lat: 12.9730, lng: 77.5960 },
    { lat: 12.9740, lng: 77.5970 },
    { lat: 12.9750, lng: 77.5980 },
    { lat: 12.9760, lng: 77.5990 }, // End
];

socket.on('connect', () => {
    console.log('Simulator connected to server.');

    // Join the booking room as the ambulance/driver
    socket.emit('join_booking', bookingId);
    console.log(`Joined booking: ${bookingId}`);

    let index = 0;
    const interval = setInterval(() => {
        if (index >= route.length) {
            console.log('Route completed.');
            clearInterval(interval);
            socket.disconnect();
            return;
        }

        const location = route[index];
        console.log(`Sending location: ${JSON.stringify(location)}`);

        socket.emit('send_location', {
            bookingId,
            location: {
                latitude: location.lat,
                longitude: location.lng
            }
        });

        index++;
    }, 2000); // Update every 2 seconds
});

socket.on('disconnect', () => {
    console.log('Simulator disconnected.');
});
