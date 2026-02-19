import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useState, Suspense, lazy } from 'react';
import { io } from 'socket.io-client';

import { SOCKET_URL } from '../../app/config/api.config';
import { COLORS, SHADOWS, FONTS } from '../../constants/theme';
import { ThemedText } from '../themed-text';
import { ThemedButton } from '../ui/ThemedButton';

// Lazy load Leaflet Map to avoid SSR 'window is not defined' error
const LeafletMap = lazy(() => import('./LeafletMap'));

export default function TrackingScreenWeb() {
    const {
        bookingId, role, patientName, vehicleNumber,
        pickupLat, pickupLon, dropLat, dropLon, dropAddress
    } = useLocalSearchParams();
    const router = useRouter();

    // State
    const [status, setStatus] = useState('Connecting to ambulance...');
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
            if (loc && (loc.latitude || loc.lat) && (loc.longitude || loc.lng)) {
                setRemoteLocation({
                    latitude: parseFloat(loc.latitude || loc.lat),
                    longitude: parseFloat(loc.longitude || loc.lng)
                });
                setStatus('Tracking live location');
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
    const displayLat = remoteLocation?.latitude || 12.9716;
    const displayLon = remoteLocation?.longitude || 77.5946;

    // Parse params
    const pLat = pickupLat ? parseFloat(pickupLat as string) : undefined;
    const pLon = pickupLon ? parseFloat(pickupLon as string) : undefined;
    const dLat = dropLat ? parseFloat(dropLat as string) : undefined;
    const dLon = dropLon ? parseFloat(dropLon as string) : undefined;

    return (
        <View style={styles.container}>
            {/* Floating Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <ThemedText style={styles.headerTitle}>Live Tracking</ThemedText>
                    <View style={styles.connectionStatus}>
                        <View style={[styles.statusDot, { backgroundColor: connected ? '#22C55E' : '#EF4444' }]} />
                        <ThemedText style={styles.connectionText}>{connected ? 'Connected' : 'Offline'}</ThemedText>
                    </View>
                </View>
            </View>

            <View style={styles.mapContainer}>
                {/* Only render Map on Client */}
                {isClient && (
                    <Suspense fallback={<View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>}>
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
            </View>

            {/* Bottom Info Card */}
            <View style={styles.footer}>
                <View style={styles.dragHandle} />

                <View style={styles.infoRow}>
                    <View style={styles.infoBox}>
                        <ThemedText style={styles.label}>Vehicle</ThemedText>
                        <ThemedText style={styles.value}>{vehicleNumber || 'Tracking...'}</ThemedText>
                    </View>
                </View>

                <View style={styles.statusIndicator}>
                    {!remoteLocation && connected && <ActivityIndicator size="small" color={COLORS.primary} style={{ marginRight: 8 }} />}
                    <ThemedText style={styles.statusText}>{status}</ThemedText>
                </View>


            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        position: 'absolute',
        top: 20,
        left: 20,
        right: 20,
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 1000,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.medium,
    },
    headerContent: {
        flex: 1,
        marginLeft: 12,
        backgroundColor: COLORS.white,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 22,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        ...SHADOWS.medium,
    },
    headerTitle: {
        fontSize: 16,
        fontFamily: FONTS.bold,
        color: COLORS.text,
    },
    connectionStatus: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    connectionText: {
        fontSize: 12,
        fontFamily: FONTS.medium,
        color: COLORS.textLight,
    },
    mapContainer: {
        flex: 1,
        position: 'relative',
        width: '100%',
        height: '100%'
    },
    footer: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        backgroundColor: COLORS.white,
        padding: 24,
        paddingTop: 12,
        borderRadius: 24,
        zIndex: 1000,
        maxWidth: 500, // Limiting width on web for better look
        alignSelf: 'center', // Centering on web
        ...SHADOWS.medium,
    },
    dragHandle: {
        width: 40,
        height: 4,
        backgroundColor: '#E2E8F0',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 20,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    infoBox: {
        flex: 1,
    },
    label: {
        fontSize: 12,
        color: COLORS.textLight,
        fontFamily: FONTS.medium,
        marginBottom: 4,
    },
    value: {
        fontSize: 16,
        color: COLORS.text,
        fontFamily: FONTS.bold,
    },
    divider: {
        width: 1,
        height: 30,
        backgroundColor: '#E2E8F0',
        marginHorizontal: 16,
    },
    statusIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        padding: 12,
        borderRadius: 12,
        marginBottom: 20,
    },
    statusText: {
        fontSize: 14,
        color: COLORS.text,
        fontFamily: FONTS.medium,
    },
    actionBtn: {
        width: '100%',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    }
});
