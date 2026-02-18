import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState, Suspense, lazy } from 'react';
import io from 'socket.io-client';
import { SOCKET_URL } from '../../config';

// Lazy load Leaflet Map to avoid SSR 'window is not defined' error
const LeafletMap = lazy(() => import('./LeafletMap'));

export default function TrackingScreenWeb() {
    const {
        bookingId, role, patientName, vehicleNumber,
        pickupLat, pickupLon, dropLat, dropLon, dropAddress
    } = useLocalSearchParams();
    const router = useRouter();

    // State
    const [status, setStatus] = useState('Connecting to Ambulance...');
    const [remoteLocation, setRemoteLocation] = useState<any>(null);
    const [socket, setSocket] = useState<any>(null);
    const [connected, setConnected] = useState(false);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
        // Init Socket
        console.log('Connecting to socket at:', SOCKET_URL);
        const newSocket = io(SOCKET_URL, {
            transports: ['websocket'],
            reconnection: true,
        });
        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('Socket Connected');
            setConnected(true);
            newSocket.emit('join_booking', bookingId);
            setStatus('Waiting for ambulance location...');
        });

        newSocket.on('disconnect', () => {
            console.log('Socket Disconnected');
            setConnected(false);
            setStatus('Connection lost. Reconnecting...');
        });

        newSocket.on('receive_location', (loc: any) => {
            console.log('Received Remote Location:', loc);
            // Ensure numbers
            if (loc && loc.latitude && loc.longitude) {
                setRemoteLocation({
                    latitude: parseFloat(loc.latitude),
                    longitude: parseFloat(loc.longitude)
                });
                setStatus('Ambulance is sharing live location');
            }
        });

        newSocket.on('receive_ack', (data: any) => {
            console.log('Received Ack:', data);
            setStatus(data.message);
        });

        return () => {
            newSocket.disconnect();
        };
    }, [bookingId]);

    // Fallback location (Bangalore) if no signal yet
    // Fallback location (Bangalore) if no signal yet
    const displayLat = remoteLocation?.latitude || 12.9716;
    const displayLon = remoteLocation?.longitude || 77.5946;

    // Parse params
    const pLat = pickupLat ? parseFloat(pickupLat as string) : undefined;
    const pLon = pickupLon ? parseFloat(pickupLon as string) : undefined;
    const dLat = dropLat ? parseFloat(dropLat as string) : undefined;
    const dLon = dropLon ? parseFloat(dropLon as string) : undefined;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Live Tracking (Web)</Text>
            </View>

            <View style={styles.mapContainer}>
                {/* Only render Map on Client */}
                {isClient && (
                    <Suspense fallback={<View style={styles.center}><ActivityIndicator size="large" color="#3B82F6" /></View>}>
                        <LeafletMap
                            lat={displayLat}
                            lon={displayLon}
                            vehicleNumber={vehicleNumber as string}
                            status={status}
                            pickupLat={pLat}
                            pickupLon={pLon}
                            dropLat={dLat}
                            dropLon={dLon}
                            dropAddress={dropAddress as string}
                        />
                    </Suspense>
                )}

                {/* Overlay Status Card */}
                <View style={styles.overlayCard}>
                    <View style={styles.statusRow}>
                        <Ionicons
                            name="radio-button-on"
                            size={20}
                            color={connected ? "#22C55E" : "#EF4444"}
                        />
                        <Text style={styles.statusText}>{status}</Text>
                    </View>
                    {!remoteLocation && (
                        <ActivityIndicator size="small" color="#3B82F6" style={{ marginTop: 8 }} />
                    )}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        gap: 16,
        zIndex: 10
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    mapContainer: {
        flex: 1,
        position: 'relative',
        width: '100%',
        height: '100%'
    },
    overlayCard: {
        position: 'absolute',
        top: 20,
        left: 20,
        right: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: 16,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        zIndex: 1000 // Ensure above map
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8
    },
    statusText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1E293B',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    }
});
