import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState, useRef } from 'react';
import MapView, { Marker, PROVIDER_DEFAULT, AnimatedRegion } from 'react-native-maps';
import io from 'socket.io-client/dist/socket.io.js';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

import { SOCKET_URL } from '../../config';

// Configure Socket - Should match your backend URL
// const SOCKET_URL = 'http://localhost:5000';

export default function TrackingScreen() {
    const {
        bookingId, role, patientName, vehicleNumber,
        pickupLat, pickupLon, dropLat, dropLon, dropAddress
    } = useLocalSearchParams();
    const router = useRouter();
    const mapRef = useRef<MapView>(null);

    // Initial region (fallback to Bangalore)
    const [region, setRegion] = useState({
        latitude: pickupLat ? parseFloat(pickupLat as string) : 12.9716,
        longitude: pickupLon ? parseFloat(pickupLon as string) : 77.5946,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
    });

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

    // Parse params
    const pLat = pickupLat ? parseFloat(pickupLat as string) : undefined;
    const pLon = pickupLon ? parseFloat(pickupLon as string) : undefined;
    const dLat = dropLat ? parseFloat(dropLat as string) : undefined;
    const dLon = dropLon ? parseFloat(dropLon as string) : undefined;

    useEffect(() => {
        // Init Socket
        const newSocket = io(SOCKET_URL);
        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('Socket Connected');
            newSocket.emit('join_booking', bookingId);
        });

        newSocket.on('receive_location', (loc: any) => {
            console.log('Received Remote Location:', loc);
            // Ensure numbers
            if (loc && loc.latitude && loc.longitude) {
                const newLoc = {
                    latitude: parseFloat(loc.latitude),
                    longitude: parseFloat(loc.longitude),
                };
                setRemoteLocation(newLoc);

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
            }
            setStatus('Active');
        });

        newSocket.on('receive_ack', (data: any) => {
            console.log('Received Ack:', data);
            setStatus(data.message);
            setIsAcknowledged(true);
        });

        return () => {
            newSocket.disconnect();
        };
    }, []);

    const requestLocationPermission = async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        setPermissionStatus(status);
        return status;
    };

    // Location Tracking (Self)
    useEffect(() => {
        let subscription: any;

        const startTracking = async () => {
            const status = await requestLocationPermission();
            if (status !== 'granted') return;

            subscription = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.High,
                    timeInterval: 2000, // Faster updates (2s)
                    distanceInterval: 5, // Smaller distance (5m)
                },
                (loc) => {
                    const { latitude, longitude } = loc.coords;

                    // Only emit if Admin (or Driver in future)
                    if (role === 'admin') {
                        if (socket) {
                            socket.emit('send_location', {
                                bookingId,
                                location: { latitude, longitude }
                            });
                        }
                    }
                }
            );
        };

        startTracking();

        return () => {
            if (subscription) subscription.remove();
        };
    }, [socket, role]);

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
        if (socket) {
            socket.emit('send_ack', bookingId);
            setIsAcknowledged(true);
            setStatus('Acknowledged. Sharing location.');
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Ionicons name="arrow-back" size={24} color="black" onPress={() => router.back()} />
                <Text style={styles.headerTitle}>Live Tracking</Text>
            </View>

            <MapView
                ref={mapRef}
                style={styles.map}
                provider={PROVIDER_DEFAULT}
                initialRegion={region}
                showsUserLocation={true}
            >
                {/* Ambulance Marker (Remote) */}
                {remoteLocation && (
                    <Marker.Animated
                        coordinate={ambulanceCoordinate as any}
                        title="Ambulance"
                        description={vehicleNumber as string || "Ambulance"}
                    >
                        <View style={styles.markerContainer}>
                            <Ionicons name="medical" size={24} color="red" />
                        </View>
                    </Marker.Animated>
                )}

                {/* Pickup Marker */}
                {pLat && pLon && (
                    <Marker
                        coordinate={{ latitude: pLat, longitude: pLon }}
                        title="Pickup Location"
                        pinColor="green"
                    />
                )}

                {/* Drop Marker */}
                {dLat && dLon && (
                    <Marker
                        coordinate={{ latitude: dLat, longitude: dLon }}
                        title="Drop Location"
                        description={dropAddress as string}
                        pinColor="blue"
                    />
                )}
            </MapView>

            <View style={styles.footer}>
                <Text style={styles.statusText}>Status: {status}</Text>
                {role === 'admin' && !isAcknowledged && (
                    <TouchableOpacity style={styles.ackButton} onPress={sendAck}>
                        <Text style={styles.ackButtonText}>Acknowledge & Start Trip</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 50,
        paddingHorizontal: 16,
        paddingBottom: 16,
        backgroundColor: '#fff',
        zIndex: 1,
        elevation: 2,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginLeft: 16,
    },
    map: {
        flex: 1,
    },
    footer: {
        padding: 20,
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    statusText: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 10,
        color: '#333',
    },
    ackButton: {
        backgroundColor: '#EF4444',
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
    },
    ackButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    markerContainer: {
        backgroundColor: 'white',
        padding: 5,
        borderRadius: 20,
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
});
