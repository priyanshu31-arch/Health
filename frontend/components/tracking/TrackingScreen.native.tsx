import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState, useRef } from 'react';
import MapView, { Marker, PROVIDER_DEFAULT, AnimatedRegion, Polyline } from 'react-native-maps';
import { io } from 'socket.io-client';
import * as Location from 'expo-location';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { SOCKET_URL } from '../../config';
import { COLORS, SHADOWS, FONTS } from '../../constants/theme';
import { ThemedText } from '../themed-text';
import { ThemedButton } from '../ui/ThemedButton';

export default function TrackingScreen() {
    const params = useLocalSearchParams();
    const {
        bookingId, role, patientName, vehicleNumber,
        pickupLat, pickupLon, dropLat, dropLon, dropAddress,
        ambulanceLat, ambulanceLon
    } = params;

    const router = useRouter();
    const mapRef = useRef<MapView>(null);

    // Parse params safely
    const pLat = pickupLat ? parseFloat(pickupLat as string) : undefined;
    const pLon = pickupLon ? parseFloat(pickupLon as string) : undefined;
    const dLat = dropLat ? parseFloat(dropLat as string) : undefined;
    const dLon = dropLon ? parseFloat(dropLon as string) : undefined;
    const ambLat = ambulanceLat ? parseFloat(ambulanceLat as string) : undefined;
    const ambLon = ambulanceLon ? parseFloat(ambulanceLon as string) : undefined;

    // Initial region (Center on Ambulance if available, else Pickup)
    const [region] = useState({
        latitude: ambLat || pLat,
        longitude: ambLon || pLon,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
    });

    const [status, setStatus] = useState(ambLat ? 'Ambulance Found' : 'Live Tracking');
    const [socket, setSocket] = useState<any>(null);
    const [isAcknowledged, setIsAcknowledged] = useState(false);
    const [connected, setConnected] = useState(false);
    const [permissionStatus, setPermissionStatus] = useState<Location.PermissionStatus | 'undetermined'>('undetermined');
    const [remoteLocation, setRemoteLocation] = useState<any>(null);

    // Animated Region for Ambulance
    const [ambulanceCoordinate] = useState(new AnimatedRegion({
        latitude: ambLat || pLat,
        longitude: ambLon || pLon,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
    }));

    useEffect(() => {
        if (!bookingId) return;

        // Init Socket with stable v4 import
        const newSocket = io(SOCKET_URL, {
            transports: ['websocket'],
            reconnection: true,
            autoConnect: true
        });
        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('Live Tracking: Connected');
            setConnected(true);
            newSocket.emit('join_booking', bookingId);
            setStatus('Joined tracking session');
        });

        newSocket.on('connect_error', (error) => {
            console.error('Socket Connection Error:', error);
            setStatus('Connection failed. Retrying...');
        });

        newSocket.on('disconnect', () => {
            console.log('Live Tracking: Disconnected');
            setConnected(false);
            setStatus('Connection lost. Reconnecting...');
        });

        newSocket.on('receive_location', (loc: any) => {
            console.log('Received Remote Location:', loc);
            if (loc && (loc.latitude || loc.lat) && (loc.longitude || loc.lng)) {
                const newLoc = {
                    latitude: parseFloat(loc.latitude || loc.lat),
                    longitude: parseFloat(loc.longitude || loc.lng),
                };
                setRemoteLocation(newLoc);

                // Animate marker with stability
                const duration = 1500; // Slightly longer for smoothness

                // AnimatedRegion.timing doesn't take useNativeDriver: true
                ambulanceCoordinate.timing({
                    latitude: newLoc.latitude,
                    longitude: newLoc.longitude,
                    duration,
                } as any).start();

                setStatus('Ambulance Found');
            }
        });

        newSocket.on('receive_ack', (data: any) => {
            console.log('Received Ack:', data);
            setStatus(data.message);
            setIsAcknowledged(true);
        });

        return () => {
            if (newSocket) newSocket.disconnect();
        };
    }, [bookingId]);

    const requestLocationPermission = async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        setPermissionStatus(status);
        return status;
    };

    // Location Tracking (Self)
    useEffect(() => {
        let isSubscribed = true;
        let subscription: any = null;

        const startTracking = async () => {
            const status = await requestLocationPermission();
            if (status !== 'granted') return;

            if (!socket || !connected) return;

            subscription = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.High,
                    timeInterval: 2000,
                    distanceInterval: 10,
                },
                (loc) => {
                    if (!isSubscribed) return;
                    const { latitude, longitude } = loc.coords;

                    // Support for Driver role or Admin to share their location
                    if (role === 'admin' || role === 'driver') {
                        if (socket && socket.connected) {
                            socket.emit('send_location', {
                                bookingId,
                                location: { latitude, longitude }
                            });
                        }
                    }
                }
            );
        };

        if (connected) {
            startTracking();
        }

        return () => {
            isSubscribed = false;
            if (subscription) subscription.remove();
        };
    }, [socket, connected, role, bookingId]);

    if (permissionStatus !== 'granted' && permissionStatus !== 'undetermined') {
        return (
            <View style={styles.center}>
                <Ionicons name="location-outline" size={64} color={COLORS.error} />
                <Text style={styles.permissionText}>Location Needed</Text>
                <Text style={styles.permissionSubText}>We need your location to track the ambulance accurately.</Text>
                <ThemedButton
                    title="Enable Location"
                    onPress={requestLocationPermission}
                    style={{ paddingHorizontal: 40 }}
                />
                <TouchableOpacity style={{ marginTop: 20 }} onPress={() => router.back()}>
                    <Text style={{ color: COLORS.textLight }}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const sendAck = () => {
        if (socket && connected) {
            socket.emit('send_ack', bookingId);
            setIsAcknowledged(true);
            setStatus('Ambulance is dispatching...');
        } else {
            Alert.alert('Connection issue', 'Not connected to server. Please wait.');
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
                        <ThemedText style={styles.connectionText}>{connected ? 'Online' : 'Offline'}</ThemedText>
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
                    <Marker.Animated
                        coordinate={ambulanceCoordinate as any}
                        title="Ambulance"
                        description={vehicleNumber as string || "Ambulance"}
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
                        title="Patient Location"
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
                        title="Destination Hospital"
                    >
                        <View style={[styles.pointMarker, { borderColor: COLORS.primary }]}>
                            <View style={[styles.pointInner, { backgroundColor: COLORS.primary }]} />
                        </View>
                    </Marker>
                )}

                {/* Live Path */}
                {remoteLocation && (
                    <Polyline
                        coordinates={[
                            remoteLocation,
                            { latitude: pLat, longitude: pLon }
                        ]}
                        strokeWidth={3}
                        strokeColor={COLORS.primary}
                        lineDashPattern={[5, 10]}
                    />
                )}
            </MapView>

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
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        ...SHADOWS.large,
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
        backgroundColor: '#F8FAFC',
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
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#EF4444',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: 'white',
        ...SHADOWS.medium,
    },
    pointMarker: {
        width: 22,
        height: 22,
        borderRadius: 11,
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
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        backgroundColor: COLORS.white
    },
    permissionText: {
        fontSize: 22,
        fontFamily: FONTS.bold,
        marginTop: 20,
        marginBottom: 10,
        color: COLORS.text
    },
    permissionSubText: {
        fontSize: 16,
        color: COLORS.textLight,
        textAlign: 'center',
        marginBottom: 30,
        fontFamily: FONTS.regular,
        lineHeight: 24
    }
});
