import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState, useRef } from 'react';
<<<<<<< HEAD
import MapView, { Marker, PROVIDER_DEFAULT, AnimatedRegion } from 'react-native-maps';
=======
import MapView, { Marker, PROVIDER_DEFAULT, Polyline } from 'react-native-maps';
>>>>>>> 110bde4635d92b6879d87d21a81d24140acb8f48
import io from 'socket.io-client/dist/socket.io.js';
import * as Location from 'expo-location';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { SOCKET_URL } from '../../config';
import { COLORS, SHADOWS, FONTS } from '../../constants/theme';
import { ThemedText } from '../themed-text';
import { ThemedButton } from '../ui/ThemedButton';

export default function TrackingScreen() {
    const {
        bookingId, role, patientName, vehicleNumber,
        pickupLat, pickupLon, dropLat, dropLon, dropAddress
    } = useLocalSearchParams();
    const router = useRouter();
    const mapRef = useRef<MapView>(null);

    // Initial region (fallback to Bangalore)
    const [region] = useState({
        latitude: pickupLat ? parseFloat(pickupLat as string) : 12.9716,
        longitude: pickupLon ? parseFloat(pickupLon as string) : 77.5946,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
    });

<<<<<<< HEAD
    const [status, setStatus] = useState('Waiting for ambulance location...');
    const [socket, setSocket] = useState<any>(null);
    const [isAcknowledged, setIsAcknowledged] = useState(false);
    const [permissionStatus, setPermissionStatus] = useState<Location.PermissionStatus | 'undetermined'>('undetermined');
    const [remoteLocation, setRemoteLocation] = useState<any>(null);

    // Animated Region for Ambulance
    const [ambulanceCoordinate] = useState(new AnimatedRegion({
        latitude: pickupLat ? parseFloat(pickupLat as string) : 12.9716,
        longitude: pickupLon ? parseFloat(pickupLon as string) : 77.5946,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
    }));
=======
    const [remoteLocation, setRemoteLocation] = useState<any>(null);
    const [status, setStatus] = useState('Connecting to ambulance...');
    const [socket, setSocket] = useState<any>(null);
    const [isAcknowledged, setIsAcknowledged] = useState(false);
    const [connected, setConnected] = useState(false);
>>>>>>> 110bde4635d92b6879d87d21a81d24140acb8f48

    // Parse params
    const pLat = pickupLat ? parseFloat(pickupLat as string) : undefined;
    const pLon = pickupLon ? parseFloat(pickupLon as string) : undefined;
    const dLat = dropLat ? parseFloat(dropLat as string) : undefined;
    const dLon = dropLon ? parseFloat(dropLon as string) : undefined;

    useEffect(() => {
        if (!bookingId) return;

        // Init Socket
        const newSocket = io(SOCKET_URL, {
            transports: ['websocket'],
            reconnection: true,
        });
        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('Socket Connected');
            setConnected(true);
            newSocket.emit('join_booking', bookingId);
            setStatus('Joined booking session');
        });

        newSocket.on('disconnect', () => {
            console.log('Socket Disconnected');
            setConnected(false);
            setStatus('Connection lost. Reconnecting...');
        });

        newSocket.on('receive_location', (loc: any) => {
            console.log('Received Remote Location:', loc);
            if (loc && loc.latitude && loc.longitude) {
                const newLoc = {
                    latitude: parseFloat(loc.latitude),
                    longitude: parseFloat(loc.longitude),
                };
                setRemoteLocation(newLoc);

<<<<<<< HEAD
                // Animate marker
                if (Platform.OS === 'android') {
                    // Android needs a duration
                    (ambulanceCoordinate as any).timing({
                        latitude: newLoc.latitude,
                        longitude: newLoc.longitude,
                        duration: 1000,
                        useNativeDriver: false
                    }).start();
                } else {
                    (ambulanceCoordinate as any).timing({
                        latitude: newLoc.latitude,
                        longitude: newLoc.longitude,
                        duration: 1000,
                        useNativeDriver: false
                    }).start();
                }
=======
                // Smoothly animate to updated location
                mapRef.current?.animateToRegion({
                    ...newLoc,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                }, 1000);

                setStatus('Tracking live location');
>>>>>>> 110bde4635d92b6879d87d21a81d24140acb8f48
            }
        });

        newSocket.on('receive_ack', (data: any) => {
            console.log('Received Ack:', data);
            setStatus(data.message);
            setIsAcknowledged(true);
        });

        return () => {
            newSocket.disconnect();
        };
    }, [bookingId]);

    const requestLocationPermission = async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        setPermissionStatus(status);
        return status;
    };

    // Location Tracking (Self)
    useEffect(() => {
        let subscription: any;
<<<<<<< HEAD

        const startTracking = async () => {
            const status = await requestLocationPermission();
            if (status !== 'granted') return;
=======
        if (!socket || !connected) return;

        (async () => {
            let { status: permissionStatus } = await Location.requestForegroundPermissionsAsync();
            if (permissionStatus !== 'granted') return;
>>>>>>> 110bde4635d92b6879d87d21a81d24140acb8f48

            subscription = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.High,
<<<<<<< HEAD
                    timeInterval: 2000, // Faster updates (2s)
                    distanceInterval: 5, // Smaller distance (5m)
=======
                    timeInterval: 2000, // Faster updates for smoother tracking
                    distanceInterval: 5,
>>>>>>> 110bde4635d92b6879d87d21a81d24140acb8f48
                },
                (loc) => {
                    const { latitude, longitude } = loc.coords;

<<<<<<< HEAD
                    // Only emit if Admin (or Driver in future)
                    if (role === 'admin') {
                        if (socket) {
                            socket.emit('send_location', {
                                bookingId,
                                location: { latitude, longitude }
                            });
                        }
=======
                    // Support for Driver role or Admin to share their location
                    if (role === 'admin' || role === 'driver') {
                        socket.emit('send_location', {
                            bookingId,
                            location: { latitude, longitude }
                        });
>>>>>>> 110bde4635d92b6879d87d21a81d24140acb8f48
                    }
                }
            );
        };

        startTracking();

        return () => {
            if (subscription) subscription.remove();
        };
    }, [socket, connected, role, bookingId]);

    if (permissionStatus !== 'granted' && permissionStatus !== 'undetermined') {
        return (
            <View style={styles.center}>
                <Ionicons name="location-outline" size={64} color="red" />
                <Text style={styles.permissionText}>Location Permission Needed</Text>
                <Text style={styles.permissionSubText}>We need your location to track the ambulance accurately.</Text>
                <TouchableOpacity style={styles.permissionButton} onPress={requestLocationPermission}>
                    <Text style={styles.permissionButtonText}>Enable Location</Text>
                </TouchableOpacity>
                <View style={styles.footer}>
                    <TouchableOpacity style={[styles.ackButton, { backgroundColor: '#333' }]} onPress={() => router.back()}>
                        <Text style={styles.ackButtonText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    const sendAck = () => {
        if (socket && connected) {
            socket.emit('send_ack', bookingId);
            setIsAcknowledged(true);
            setStatus('Starting trip...');
        } else {
            Alert.alert('Error', 'Socket not connected. Please wait.');
        }
    };

    return (
        <View style={styles.container}>
            {/* Transparent Header Over Map */}
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

            <MapView
                ref={mapRef}
                style={styles.map}
                provider={PROVIDER_DEFAULT}
                initialRegion={region}
                showsUserLocation={true}
                showsMyLocationButton={false}
                showsCompass={false}
            >
                {/* Ambulance Marker (Remote) */}
                {remoteLocation && (
<<<<<<< HEAD
                    <Marker.Animated
                        coordinate={ambulanceCoordinate as any}
                        title="Ambulance"
                        description={vehicleNumber as string || "Ambulance"}
=======
                    <Marker
                        coordinate={remoteLocation}
                        anchor={{ x: 0.5, y: 0.5 }}
>>>>>>> 110bde4635d92b6879d87d21a81d24140acb8f48
                    >
                        <View style={styles.ambulanceMarker}>
                            <MaterialCommunityIcons name="ambulance" size={22} color="white" />
                        </View>
                    </Marker.Animated>
                )}

                {/* Pickup Marker */}
                {pLat && pLon && (
                    <Marker
                        coordinate={{ latitude: pLat, longitude: pLon }}
                        title="Pickup Point"
                    >
                        <View style={[styles.pointMarker, { borderColor: '#22C55E' }]}>
                            <View style={[styles.pointInner, { backgroundColor: '#22C55E' }]} />
                        </View>
                    </Marker>
                )}

                {/* Drop Marker */}
                {dLat && dLon && (
                    <Marker
                        coordinate={{ latitude: dLat, longitude: dLon }}
                        title="Hospital"
                    >
                        <View style={[styles.pointMarker, { borderColor: COLORS.primary }]}>
                            <View style={[styles.pointInner, { backgroundColor: COLORS.primary }]} />
                        </View>
                    </Marker>
                )}

                {/* Simple Path if locations available */}
                {remoteLocation && pLat && pLon && (
                    <Polyline
                        coordinates={[remoteLocation, { latitude: pLat, longitude: pLon }]}
                        strokeWidth={3}
                        strokeColor={COLORS.primary + '80'}
                        lineDashPattern={[5, 5]}
                    />
                )}
            </MapView>

            {/* Bottom Info Card */}
            <View style={styles.footer}>
                <View style={styles.dragHandle} />

                <View style={styles.infoRow}>
                    <View style={styles.infoBox}>
                        <ThemedText style={styles.label}>Ambulance</ThemedText>
                        <ThemedText style={styles.value}>{vehicleNumber || 'Finding...'}</ThemedText>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.infoBox}>
                        <ThemedText style={styles.label}>Patient</ThemedText>
                        <ThemedText style={styles.value}>{patientName || 'Emergency'}</ThemedText>
                    </View>
                </View>

                <View style={styles.statusIndicator}>
                    {!remoteLocation && connected && <ActivityIndicator size="small" color={COLORS.primary} style={{ marginRight: 8 }} />}
                    <ThemedText style={styles.statusText}>{status}</ThemedText>
                </View>

                {role === 'admin' && !isAcknowledged && (
                    <ThemedButton
                        title="Acknowledge & Start Trip"
                        onPress={sendAck}
                        style={styles.actionBtn}
                        variant="primary"
                    />
                )}

                {role === 'user' && (
                    <ThemedButton
                        title="Call Emergency"
                        onPress={() => Alert.alert('Call', 'Connecting to driver...')}
                        variant="outline"
                        style={styles.actionBtn}
                        icon={<Ionicons name="call" size={18} color={COLORS.primary} style={{ marginRight: 8 }} />}
                    />
                )}
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
        top: Platform.OS === 'ios' ? 60 : 40,
        left: 20,
        right: 20,
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 10,
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
    map: {
        flex: 1,
    },
    footer: {
        backgroundColor: COLORS.white,
        padding: 24,
        paddingTop: 12,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
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
        marginBottom: 24,
    },
    statusText: {
        fontSize: 14,
        color: COLORS.text,
        fontFamily: FONTS.medium,
    },
    actionBtn: {
        width: '100%',
    },
    ambulanceMarker: {
        width: 40,
        height: 40,
        borderRadius: 20,
<<<<<<< HEAD
        borderWidth: 1,
        borderColor: '#ccc'
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    permissionText: {
        fontSize: 22,
        fontWeight: 'bold',
        marginTop: 20,
        marginBottom: 10
    },
    permissionSubText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 30
    },
    permissionButton: {
        backgroundColor: '#EF4444',
        paddingHorizontal: 30,
        paddingVertical: 15,
        borderRadius: 25
    },
    permissionButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold'
    }
=======
        backgroundColor: '#EF4444',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: 'white',
        ...SHADOWS.medium,
    },
    pointMarker: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
    },
    pointInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
>>>>>>> 110bde4635d92b6879d87d21a81d24140acb8f48
});
