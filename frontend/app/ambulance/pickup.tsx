import { useRouter, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    View,
    Platform,
    Modal,
    TextInput
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemedText } from '../../components/themed-text';
import { COLORS, SHADOWS, FONTS } from '../../constants/theme';
import { api } from '../config/api.config';
import * as Location from 'expo-location';
import StatusModal from '@/components/StatusModal';
import { useNotifications } from '@/context/NotificationContext';
import Shimmer from '@/components/Shimmer';
import { ThemedButton } from '@/components/ui/ThemedButton';

export default function AmbulancePickupScreen() {
    const router = useRouter();
    const [ambulances, setAmbulances] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [bookingLoading, setBookingLoading] = useState(false);
    const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
    const { addNotification } = useNotifications();

    // Booking Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [bookingSuccess, setBookingSuccess] = useState(false); // New state for success view
    const [confirmedBooking, setConfirmedBooking] = useState<any>(null); // Store booking result
    const [selectedAmbulance, setSelectedAmbulance] = useState<any>(null);
    const [patientName, setPatientName] = useState('');
    const [contactNumber, setContactNumber] = useState('');
    const [pickupAddress, setPickupAddress] = useState('');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // New State for Record Sharing
    const [myRecords, setMyRecords] = useState<any[]>([]);
    const [selectedRecords, setSelectedRecords] = useState<string[]>([]);
    const [showRecords, setShowRecords] = useState(false);

    // Status Modal State (for errors)
    const [statusModalVisible, setStatusModalVisible] = useState(false);
    const [statusModalType, setStatusModalType] = useState<'success' | 'error'>('error');
    const [statusModalMessage, setStatusModalMessage] = useState('');

    const showStatus = (type: 'success' | 'error', message: string) => {
        setStatusModalType(type);
        setStatusModalMessage(message);
        setStatusModalVisible(true);
    };

    // Get hospitalId and optional ambulanceId from params
    const { hospitalId, ambulanceId } = useLocalSearchParams();

    useEffect(() => {
        if (hospitalId) {
            fetchAmbulances();
            fetchMyRecords();
        } else {
            // Fallback or error if arrived here without hospital
            Alert.alert('Error', 'No hospital selected');
            router.back();
        }
        getUserLocation();
    }, [hospitalId]);

    const fetchMyRecords = async () => {
        try {
            const records = await api.getHealthRecords();
            setMyRecords(records);
        } catch (error) {
            console.log('Failed to fetch records for sharing option');
        }
    };

    const toggleRecordSelection = (recordId: string) => {
        if (selectedRecords.includes(recordId)) {
            setSelectedRecords(selectedRecords.filter(id => id !== recordId));
        } else {
            setSelectedRecords([...selectedRecords, recordId]);
        }
    };

    const getUserLocation = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setUserLocation({ lat: 30.7333, lon: 76.7794 });
                return;
            }

            const location = await Location.getCurrentPositionAsync({});
            setUserLocation({
                lat: location.coords.latitude,
                lon: location.coords.longitude
            });
        } catch (error) {
            console.error('Error getting location:', error);
            setUserLocation({ lat: 30.7333, lon: 76.7794 });
        }
    };

    const fetchAmbulances = async () => {
        try {
            setLoading(true);
            // Pass hospitalId and isAvailable=true
            const data = await api.getAmbulances(hospitalId as string, true);
            setAmbulances(data);

            // If ambulanceId was passed, automatically open the booking modal for it
            if (ambulanceId && data.length > 0) {
                const target = data.find((a: any) => a._id === ambulanceId);
                if (target) {
                    initiateBooking(target);
                }
            }
        } catch (error) {
            console.error(error);
            showStatus('error', 'Failed to fetch ambulances');
        } finally {
            setLoading(false);
        }
    };

    const initiateBooking = (ambulance: any) => {
        setSelectedAmbulance(ambulance);
        setBookingSuccess(false);
        setModalVisible(true);
    };

    const confirmBooking = async () => {
        if (!patientName.trim() || !contactNumber.trim()) {
            setErrorMessage('Please fill in patient name and contact number');
            return;
        }

        const bookingLat = userLocation?.lat || 30.7333;
        const bookingLon = userLocation?.lon || 76.7794;

        try {
            setBookingLoading(true);

            const bookingData = {
                pickupLat: bookingLat,
                pickupLon: bookingLon,
                hospitalId: selectedAmbulance.hospital._id || selectedAmbulance.hospital,
                ambulanceId: selectedAmbulance._id, // Pass specific ambulance ID
                patientName,
                contactNumber,
                pickupAddress,
                sharedRecords: selectedRecords
            };

            const result = await api.bookAmbulance(bookingData);
            setConfirmedBooking(result);
            setBookingSuccess(true);

            // Add to in-app notification context
            addNotification(
                'Ambulance Booked! 🚑',
                `Ambulance ${selectedAmbulance.ambulanceNumber} is on its way for ${patientName}.`,
                'booking'
            );

            setPatientName('');
            setContactNumber('');
            setPickupAddress('');
        } catch (error: any) {
            console.error('Booking Error:', error);
            const msg = error.message || 'Failed to book ambulance';
            // Close the booking modal so the error modal is visible?
            // Or show on top. Modals on top of modals can be tricky on Android.
            // Let's close booking modal first.
            setModalVisible(false);
            setTimeout(() => showStatus('error', msg), 400);
        } finally {
            setBookingLoading(false);
        }
    };

    const handleTrackNow = () => {
        console.log('🚑 handleTrackNow Called');
        console.log('Confirmed Booking:', JSON.stringify(confirmedBooking, null, 2));

        setModalVisible(false);
        if (confirmedBooking) {
            // Extract coordinates
            const pickupLat = confirmedBooking.pickupLocation?.coordinates[1] || userLocation?.lat;
            const pickupLon = confirmedBooking.pickupLocation?.coordinates[0] || userLocation?.lon;
            const dropLat = confirmedBooking.hospital?.latitude;
            const dropLon = confirmedBooking.hospital?.longitude;
            const dropAddress = confirmedBooking.hospital?.address || confirmedBooking.hospital?.name;

            // Extract ambulance initial location
            const ambulanceLat = confirmedBooking.itemId?.currentLocation?.coordinates[1];
            const ambulanceLon = confirmedBooking.itemId?.currentLocation?.coordinates[0];

            router.push({
                pathname: '/tracking',
                params: {
                    bookingId: confirmedBooking._id,
                    vehicleNumber: confirmedBooking.ambulanceNumber,
                    role: 'user',
                    pickupLat,
                    pickupLon,
                    dropLat,
                    dropLon,
                    dropAddress,
                    ambulanceLat,
                    ambulanceLon
                }
            });
        }
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.card}>
            <View style={styles.cardContent}>
                <View style={styles.iconBox}>
                    <MaterialCommunityIcons name="ambulance" size={32} color={COLORS.primary} />
                </View>
                <View style={{ flex: 1 }}>
                    <ThemedText style={styles.cardTitle}>{item.ambulanceNumber}</ThemedText>
                    <ThemedText style={styles.hospitalText}>{item.hospital?.name || 'HealthBridge Hospital'}</ThemedText>
                    <View style={styles.statusContainer}>
                        <View style={styles.activeDot} />
                        <ThemedText style={styles.statusText}>Available Now</ThemedText>
                    </View>
                </View>
                <ThemedButton
                    title="Book Now"
                    onPress={() => initiateBooking(item)}
                    disabled={bookingLoading}
                    style={{ minHeight: 44, paddingHorizontal: 16 }}
                    textStyle={{ fontSize: 14 }}
                />
            </View>
        </View>
    );

    const AmbulanceSkeleton = () => (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <ThemedText style={styles.headerTitle}>Select Ambulance</ThemedText>
            </View>
            <View style={{ padding: 20 }}>
                {[1, 2, 3].map((i) => (
                    <View key={i} style={[styles.card, { height: 120 }]}>
                        <Shimmer width="100%" height="100%" borderRadius={20} />
                    </View>
                ))}
            </View>
        </View>
    );

    if (loading) {
        return <AmbulanceSkeleton />;
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <ThemedText style={styles.headerTitle}>Select Ambulance</ThemedText>
            </View>

            <FlatList
                data={ambulances}
                renderItem={renderItem}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.list}
                ListEmptyComponent={<ThemedText style={styles.emptyText}>No ambulances available at the moment.</ThemedText>}
            />

            <Modal
                transparent={true}
                visible={modalVisible}
                animationType="slide"
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        {!bookingSuccess ? (
                            // Booking Form
                            <>
                                <ThemedText style={styles.modalTitle}>Book Ambulance</ThemedText>
                                <ThemedText style={styles.modalSubtitle}>Enter details for quick pickup.</ThemedText>

                                {/* Location Info */}
                                <View style={styles.locationInfo}>
                                    <MaterialCommunityIcons name="map-marker" size={20} color={COLORS.primary} />
                                    <ThemedText style={styles.locationText}>
                                        {userLocation ? 'GPS Location Detected' : 'Using Default Location'}
                                    </ThemedText>
                                </View>

                                {errorMessage && (
                                    <View style={styles.errorContainer}>
                                        <MaterialCommunityIcons name="alert-circle" size={16} color={COLORS.error} />
                                        <ThemedText style={styles.errorText}>{errorMessage}</ThemedText>
                                    </View>
                                )}

                                <View style={styles.inputContainer}>
                                    <ThemedText style={styles.label}>Pickup Address (Optional)</ThemedText>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter Landmark/Address"
                                        value={pickupAddress}
                                        onChangeText={setPickupAddress}
                                        placeholderTextColor={COLORS.textLight}
                                    />
                                </View>

                                <View style={styles.inputContainer}>
                                    <ThemedText style={styles.label}>Patient Name</ThemedText>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Who is this for?"
                                        value={patientName}
                                        onChangeText={(text) => {
                                            const alphabetOnly = text.replace(/[^a-zA-Z\s]/g, '');
                                            setPatientName(alphabetOnly);
                                            if (errorMessage) setErrorMessage(null);
                                        }}
                                        placeholderTextColor={COLORS.textLight}
                                    />
                                </View>

                                <View style={styles.inputContainer}>
                                    <ThemedText style={styles.label}>Contact Number</ThemedText>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Driver will call this number"
                                        value={contactNumber}
                                        onChangeText={(text) => {
                                            const numbersOnly = text.replace(/[^0-9]/g, '');
                                            if (numbersOnly.length <= 10) setContactNumber(numbersOnly);
                                            if (errorMessage) setErrorMessage(null);
                                        }}
                                        keyboardType="phone-pad"
                                        placeholderTextColor={COLORS.textLight}
                                    />
                                </View>

                                <View style={styles.modalActions}>
                                    <ThemedButton
                                        title="Cancel"
                                        variant="outline"
                                        onPress={() => setModalVisible(false)}
                                        disabled={bookingLoading}
                                        style={{ flex: 1 }}
                                    />
                                    <ThemedButton
                                        title="Confirm & Book"
                                        onPress={confirmBooking}
                                        isLoading={bookingLoading}
                                        disabled={bookingLoading}
                                        style={{ flex: 1 }}
                                    />
                                </View>
                            </>
                        ) : (
                            // Success View
                            <View style={styles.successContainer}>
                                <View style={styles.successIconCircle}>
                                    <MaterialCommunityIcons name="check" size={40} color="#fff" />
                                </View>
                                <ThemedText style={styles.successTitle}>Booking Confirmed!</ThemedText>
                                <ThemedText style={styles.successMessage}>
                                    Your ambulance is on its way. Use live tracking to see the driver's location.
                                </ThemedText>

                                <ThemedButton
                                    title="Track Live"
                                    variant="gradient"
                                    icon={<MaterialCommunityIcons name="map-marker-radius" size={18} color="white" />}
                                    onPress={handleTrackNow}
                                    style={{ width: '100%' }}
                                />

                                <TouchableOpacity
                                    onPress={() => setModalVisible(false)}
                                    style={styles.closeLink}
                                >
                                    <ThemedText style={styles.closeLinkText}>Close</ThemedText>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>

            <StatusModal
                visible={statusModalVisible}
                type={statusModalType}
                message={statusModalMessage}
                onClose={() => setStatusModalVisible(false)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: Platform.OS === 'ios' ? 60 : 50,
        paddingHorizontal: 20,
        paddingBottom: 20,
        backgroundColor: COLORS.white,
        ...SHADOWS.small,
        zIndex: 10,
    },
    backBtn: {
        marginRight: 16,
    },
    headerTitle: {
        fontSize: 20,
        fontFamily: FONTS.bold,
        color: COLORS.text,
    },
    list: {
        padding: 20,
        gap: 16,
    },
    card: {
        backgroundColor: COLORS.white,
        padding: 16,
        borderRadius: 16,
        ...SHADOWS.small,
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    iconBox: {
        width: 56,
        height: 56,
        borderRadius: 16,
        backgroundColor: COLORS.primary + '15', // 15% opacity
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardTitle: {
        fontSize: 18,
        fontFamily: FONTS.bold,
        color: COLORS.text,
        marginBottom: 4,
    },
    hospitalText: {
        fontSize: 14,
        color: COLORS.textLight,
        marginBottom: 8,
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    activeDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#22C55E', // Green
    },
    statusText: {
        fontSize: 12,
        color: '#22C55E',
        fontFamily: FONTS.semiBold,
    },
    bookBtn: {
        backgroundColor: COLORS.primary,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 12,
        minWidth: 90,
        alignItems: 'center',
    },
    bookBtnText: {
        color: COLORS.white,
        fontWeight: 'bold',
        fontSize: 14,
    },
    emptyText: {
        textAlign: 'center',
        color: COLORS.textLight,
        marginTop: 40,
        fontSize: 16,
    },

    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalContent: {
        backgroundColor: COLORS.white,
        width: '100%',
        borderRadius: 24,
        padding: 24,
        gap: 16,
        ...SHADOWS.medium,
    },
    modalTitle: {
        fontSize: 22,
        fontFamily: FONTS.bold,
        color: COLORS.text,
        textAlign: 'center',
    },
    modalSubtitle: {
        fontSize: 14,
        color: COLORS.textLight,
        textAlign: 'center',
        marginBottom: 8,
    },
    inputContainer: {
        gap: 8,
    },
    label: {
        fontSize: 14,
        fontFamily: FONTS.semiBold,
        color: COLORS.text,
        marginLeft: 4,
    },
    input: {
        backgroundColor: COLORS.background,
        padding: 16,
        borderRadius: 12,
        fontSize: 16,
        fontFamily: FONTS.regular,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        color: COLORS.text,
    },
    modalActions: {
        flexDirection: 'row',
        gap: 16,
        marginTop: 16,
    },
    cancelButton: {
        flex: 1,
        padding: 16,
        alignItems: 'center',
        borderRadius: 12,
        backgroundColor: COLORS.background,
    },
    confirmButton: {
        flex: 1,
        padding: 16,
        alignItems: 'center',
        borderRadius: 12,
        backgroundColor: COLORS.primary,
    },
    cancelText: {
        fontWeight: '600',
        color: COLORS.text,
    },
    confirmText: {
        fontWeight: 'bold',
        color: '#fff',
    },
    locationInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: COLORS.primary + '10',
        padding: 12,
        borderRadius: 8,
        marginBottom: 8
    },
    locationText: {
        fontSize: 14,
        color: COLORS.primary,
        fontWeight: '500'
    },

    // Success State Styles
    successContainer: {
        alignItems: 'center',
        padding: 16,
        gap: 12
    },
    successIconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#22C55E',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8
    },
    successTitle: {
        fontSize: 24,
        fontFamily: FONTS.bold,
        color: COLORS.text,
        textAlign: 'center'
    },
    successMessage: {
        fontSize: 16,
        color: COLORS.textLight,
        textAlign: 'center',
        marginBottom: 16,
        lineHeight: 22,
        fontFamily: FONTS.regular,
    },
    trackButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 16,
        width: '100%',
        alignItems: 'center',
        ...SHADOWS.small
    },
    trackButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold'
    },
    closeLink: {
        padding: 12,
    },
    closeLinkText: {
        color: COLORS.textLight,
        fontWeight: '600'
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF2F2',
        padding: 10,
        borderRadius: 8,
        marginBottom: 8,
        gap: 8,
    },
    errorText: {
        color: COLORS.error,
        fontSize: 14,
        flex: 1,
    },
    // Record Sharing Styles
    recordSection: {
        width: '100%',
        marginTop: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        overflow: 'hidden'
    },
    recordHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#F8FAFC'
    },
    recordTitle: {
        fontSize: 14,
        fontFamily: FONTS.medium,
        color: COLORS.text
    },
    badge: {
        backgroundColor: COLORS.primary + '20',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8
    },
    badgeText: {
        color: COLORS.primary,
        fontSize: 10,
        fontWeight: '600'
    },
    recordList: {
        padding: 8,
        gap: 8,
        maxHeight: 200
    },
    recordItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        backgroundColor: COLORS.white,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        gap: 8
    },
    recordItemActive: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.primary + '05'
    },
    recordType: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text
    },
    recordDate: {
        fontSize: 12,
        color: COLORS.textLight
    },
    noRecordsText: {
        textAlign: 'center',
        color: COLORS.textLight,
        fontSize: 12,
        padding: 12,
        fontStyle: 'italic'
    }
});
