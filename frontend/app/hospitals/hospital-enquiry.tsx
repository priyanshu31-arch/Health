import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '../../components/themed-text';
import { COLORS, SHADOWS } from '../../constants/theme';

import { api } from '../config/api.config';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { scheduleBookingNotification } from '../../utils/notifications';
import { useNotifications } from '@/context/NotificationContext';
import Shimmer from '@/components/Shimmer';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ThemedButton } from '@/components/ui/ThemedButton';

export default function HospitalEnquiryScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const { addNotification } = useNotifications();
    const params = useLocalSearchParams();
    const { hospitalId, hospitalName } = params;

    const [beds, setBeds] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedBed, setSelectedBed] = useState<string | null>(null);
    const [patientName, setPatientName] = useState('');
    const [contactNumber, setContactNumber] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [bookedInfo, setBookedInfo] = useState<{ bed: string; patient: string; contact: string } | null>(null);

    // New State for Record Sharing
    const [myRecords, setMyRecords] = useState<any[]>([]);
    const [selectedRecords, setSelectedRecords] = useState<string[]>([]);
    const [showRecords, setShowRecords] = useState(false);

    useEffect(() => {
        if (user?.phone) {
            setContactNumber(user.phone);
        }
        if (user?.name) {
            setPatientName(user.name);
        }
    }, [user]);

    useEffect(() => {
        if (hospitalId) {
            fetchBeds();
            fetchMyRecords();
        }
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

    const fetchBeds = async () => {
        try {
            setLoading(true);
            const data = await api.getHospitalDetails(hospitalId as string);
            // Filter only available beds
            const availableBeds = (data.beds || []).filter((b: any) => b.isAvailable);
            console.log('Fetched beds:', data.beds);
            console.log('Available beds:', availableBeds);
            setBeds(availableBeds);
            if (availableBeds.length === 0) {
                Alert.alert('Info', 'No available beds found for this hospital.');
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to fetch hospital details');
        } finally {
            setLoading(false);
        }
    };

    const handleBooking = async () => {
        if (!user) {
            Alert.alert(
                'Login Required',
                'You must be logged in to book a consultation.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Login', onPress: () => router.push('/login') }
                ]
            );
            return;
        }

        if (!selectedBed || !patientName.trim() || !contactNumber.trim()) {
            setErrorMessage('Please select a bed and fill in all patient details to proceed.');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return;
        }

        // Realistic phone number validation (10 digits, starts with 6-9)
        const phoneRegex = /^[6-9]\d{9}$/;
        if (contactNumber.length < 10) {
            setErrorMessage('Contact number must be exactly 10 digits.');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return;
        }
        if (!phoneRegex.test(contactNumber)) {
            setErrorMessage('Please enter a valid 10-digit mobile number starting with 6-9.');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return;
        }


        try {
            setSubmitting(true);
            await api.bookBed({
                bookingType: 'bed',
                itemId: selectedBed,
                hospital: hospitalId as string,
                patientName,
                contactNumber,
                sharedRecords: selectedRecords
            });

            // Trigger notification
            await scheduleBookingNotification('Bed Booking', patientName);

            // Add to in-app notification context
            addNotification(
                'Booking Confirmed! ✅',
                `Your bed booking for ${patientName} at ${hospitalName} is confirmed.`,
                'booking'
            );

            const bedDetails = beds.find(b => b._id === selectedBed);
            const bedInfo = bedDetails ? `Bed ${bedDetails.bedNumber}` : 'Selected Bed';

            setBookedInfo({
                bed: bedInfo,
                patient: patientName,
                contact: contactNumber
            });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setShowSuccessModal(true);

        } catch (error: any) {
            console.error(error);
            Alert.alert('Booking Failed', error.message || 'Could not complete booking.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <ThemedText style={styles.headerTitle}>Book Consultation</ThemedText>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.hospitalCard}>
                    <MaterialCommunityIcons name="hospital-building" size={40} color={COLORS.primary} />
                    <View style={{ flex: 1 }}>
                        <ThemedText style={styles.hospitalName}>{hospitalName}</ThemedText>
                        <ThemedText style={styles.hospitalId}>ID: {hospitalId}</ThemedText>
                    </View>
                </View>

                <ThemedText style={styles.sectionTitle}>Select a Bed</ThemedText>
                <ThemedText style={styles.subtitle}>Choose from available beds below:</ThemedText>

                {loading ? (
                    <View style={styles.grid}>
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <View key={i} style={styles.bedCardSkeleton}>
                                <Shimmer width="100%" height={100} borderRadius={16} />
                            </View>
                        ))}
                    </View>
                ) : beds.length === 0 ? (
                    <View style={styles.emptyState}>
                        <MaterialCommunityIcons name="bed-empty" size={48} color={COLORS.textLight} />
                        <ThemedText style={styles.emptyText}>No beds available at this moment.</ThemedText>
                    </View>
                ) : (
                    <View style={styles.grid}>
                        {beds.map((bed) => (
                            <TouchableOpacity
                                key={bed._id}
                                style={[
                                    styles.bedCard,
                                    selectedBed === bed._id && styles.selectedBed
                                ]}
                                onPress={() => setSelectedBed(bed._id)}
                            >
                                <MaterialCommunityIcons
                                    name="bed"
                                    size={32}
                                    color={selectedBed === bed._id ? COLORS.white : COLORS.primary}
                                />
                                <View style={{ alignItems: 'center' }}>
                                    <ThemedText style={[
                                        styles.bedNumber,
                                        selectedBed === bed._id && styles.selectedText
                                    ]}>
                                        {bed.bedNumber}
                                    </ThemedText>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </ScrollView>

            <View style={styles.formSection}>
                <ThemedText style={styles.sectionTitle}>Patient Details</ThemedText>

                {errorMessage && (
                    <View style={styles.errorContainer}>
                        <MaterialCommunityIcons name="alert-circle" size={16} color={COLORS.error} />
                        <ThemedText style={styles.errorText}>{errorMessage}</ThemedText>
                    </View>
                )}

                <TextInput
                    style={styles.input}
                    placeholder="Patient Name"
                    value={patientName}
                    onChangeText={(text) => {
                        const alphabetOnly = text.replace(/[^a-zA-Z\s]/g, '');
                        setPatientName(alphabetOnly);
                        if (errorMessage) setErrorMessage(null);
                    }}
                    placeholderTextColor={COLORS.textLight}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Contact Number"
                    value={contactNumber}
                    onChangeText={(text) => {
                        const numbersOnly = text.replace(/[^0-9]/g, '');
                        if (numbersOnly.length <= 10) setContactNumber(numbersOnly);
                        if (errorMessage) setErrorMessage(null);
                    }}
                    placeholderTextColor={COLORS.textLight}
                    keyboardType="phone-pad"
                />

                {/* Record Sharing Section */}
                <View style={styles.recordSection}>
                    <TouchableOpacity
                        style={styles.recordHeader}
                        onPress={() => setShowRecords(!showRecords)}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <MaterialCommunityIcons name={showRecords ? "chevron-down" : "chevron-right"} size={20} color={COLORS.primary} />
                            <ThemedText style={styles.recordTitle}>Share Medical Records (Optional)</ThemedText>
                        </View>
                        {selectedRecords.length > 0 && (
                            <View style={styles.badge}>
                                <ThemedText style={styles.badgeText}>{selectedRecords.length} selected</ThemedText>
                            </View>
                        )}
                    </TouchableOpacity>

                    {showRecords && (
                        <View style={styles.recordList}>
                            {myRecords.length > 0 ? (
                                myRecords.map(record => (
                                    <TouchableOpacity
                                        key={record._id}
                                        style={[
                                            styles.recordItem,
                                            selectedRecords.includes(record._id) && styles.recordItemActive
                                        ]}
                                        onPress={() => toggleRecordSelection(record._id)}
                                    >
                                        <View style={{ flex: 1 }}>
                                            <ThemedText style={styles.recordType}>{record.type}</ThemedText>
                                            <ThemedText style={styles.recordDate}>
                                                {new Date(record.date).toLocaleDateString()} • {record.value} {record.unit}
                                            </ThemedText>
                                        </View>
                                        {selectedRecords.includes(record._id) && (
                                            <MaterialCommunityIcons name="check-circle" size={20} color={COLORS.primary} />
                                        )}
                                    </TouchableOpacity>
                                ))
                            ) : (
                                <ThemedText style={styles.noRecordsText}>No records found. Add records in your profile to share them here.</ThemedText>
                            )}
                        </View>
                    )}
                </View>
            </View>

            <View style={styles.footer}>
                <ThemedButton
                    title="Confirm Booking"
                    onPress={handleBooking}
                    isLoading={submitting}
                    disabled={submitting}
                    style={{ width: '100%' }}
                />
            </View>

            {/* Success Modal */}
            <Modal
                visible={showSuccessModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowSuccessModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <Animated.View
                        entering={ZoomIn.duration(500)}
                        style={styles.modalContent}
                    >
                        <LinearGradient
                            colors={[COLORS.primary, '#0ea5e9']}
                            style={styles.successIconContainer}
                        >
                            <MaterialCommunityIcons name="check-bold" size={48} color={COLORS.white} />
                        </LinearGradient>

                        <Animated.View entering={FadeInDown.delay(200).duration(500)} style={{ alignItems: 'center' }}>
                            <ThemedText style={styles.successTitle}>Booking Confirmed!</ThemedText>
                            <ThemedText style={styles.successSubtitle}>
                                Your bed has been successfully reserved.
                            </ThemedText>
                        </Animated.View>

                        <Animated.View entering={FadeInUp.delay(400).duration(500)} style={styles.detailsCard}>
                            <View style={styles.detailRow}>
                                <ThemedText style={styles.detailLabel}>Patient</ThemedText>
                                <ThemedText style={styles.detailValue}>{bookedInfo?.patient}</ThemedText>
                            </View>
                            <View style={styles.detailRow}>
                                <ThemedText style={styles.detailLabel}>Bed</ThemedText>
                                <ThemedText style={styles.detailValue}>{bookedInfo?.bed}</ThemedText>
                            </View>
                            <View style={styles.detailRow}>
                                <ThemedText style={styles.detailLabel}>Contact</ThemedText>
                                <ThemedText style={styles.detailValue}>+91 {bookedInfo?.contact}</ThemedText>
                            </View>
                            <View style={styles.detailRow}>
                                <ThemedText style={styles.detailLabel}>Hospital</ThemedText>
                                <ThemedText style={styles.detailValue}>{hospitalName}</ThemedText>
                            </View>
                        </Animated.View>

                        <Animated.View entering={FadeInUp.delay(600).duration(500)}>
                            <ThemedText style={styles.arrivalNote}>
                                Please arrive at the hospital within 2 hours to complete the admission process.
                            </ThemedText>

                            <ThemedButton
                                title="Return to Home"
                                variant="gradient"
                                onPress={() => {
                                    setShowSuccessModal(false);
                                    router.replace('/(tabs)');
                                }}
                                style={{ width: '100%' }}
                            />
                        </Animated.View>
                    </Animated.View>
                </View>
            </Modal>
        </SafeAreaView>

    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        backgroundColor: COLORS.white,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20,
        backgroundColor: COLORS.surface,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    content: {
        padding: 20,
    },
    hospitalCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        padding: 20,
        borderRadius: 16,
        gap: 16,
        marginBottom: 24,
        ...SHADOWS.small,
    },
    hospitalName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    hospitalId: {
        fontSize: 12,
        color: COLORS.textLight,
        marginTop: 4,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: COLORS.textLight,
        marginBottom: 20,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    bedCard: {
        width: '30%',
        aspectRatio: 1,
        backgroundColor: COLORS.white,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
        ...SHADOWS.small,
    },
    selectedBed: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    bedNumber: {
        marginTop: 8,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    selectedText: {
        color: COLORS.white,
    },
    emptyState: {
        alignItems: 'center',
        padding: 40,
        gap: 16,
    },
    emptyText: {
        color: COLORS.textLight,
        fontSize: 16,
    },
    footer: {
        padding: 20,
        backgroundColor: COLORS.white,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    bookButton: {
        backgroundColor: COLORS.primary,
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        ...SHADOWS.medium,
    },
    disabledButton: {
        backgroundColor: COLORS.textLight,
        opacity: 0.7,
    },
    bookButtonText: {
        color: COLORS.white,
        fontWeight: 'bold',
        fontSize: 16,
    },
    formSection: {
        padding: 20,
        backgroundColor: COLORS.white,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        gap: 12,
    },
    input: {
        backgroundColor: COLORS.background,
        padding: 16,
        borderRadius: 12,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    recordSection: {
        marginTop: 8,
        backgroundColor: COLORS.background,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    recordHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: COLORS.white,
    },
    recordTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
    },
    badge: {
        backgroundColor: COLORS.primary + '20',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    badgeText: {
        color: COLORS.primary,
        fontSize: 12,
        fontWeight: '600',
    },
    recordList: {
        padding: 12,
        gap: 8,
    },
    recordItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        backgroundColor: COLORS.white,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    recordItemActive: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.primary + '05',
    },
    recordType: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
    },
    recordDate: {
        fontSize: 12,
        color: COLORS.textLight,
        marginTop: 2,
    },
    noRecordsText: {
        fontSize: 14,
        color: COLORS.textLight,
        textAlign: 'center',
        padding: 16,
        fontStyle: 'italic',
    },
    modalContent: {
        backgroundColor: COLORS.white,
        borderRadius: 30,
        padding: 30,
        width: '100%',
        maxWidth: 400,
        alignItems: 'center',
        ...SHADOWS.medium,
    },
    successIconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        ...SHADOWS.medium,
    },
    successTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 8,
    },
    successSubtitle: {
        fontSize: 16,
        color: COLORS.textLight,
        textAlign: 'center',
        marginBottom: 24,
    },
    detailsCard: {
        width: '100%',
        backgroundColor: COLORS.background,
        borderRadius: 20,
        padding: 20,
        marginBottom: 24,
        gap: 12,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    detailLabel: {
        fontSize: 14,
        color: COLORS.textLight,
    },
    detailValue: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
    },
    arrivalNote: {
        fontSize: 14,
        color: COLORS.textLight,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 30,
        fontStyle: 'italic',
    },
    homeButton: {
        backgroundColor: COLORS.primary,
        width: '100%',
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        ...SHADOWS.small,
    },
    homeButtonText: {
        color: COLORS.white,
        fontSize: 18,
        fontWeight: 'bold',
    },
    bedCardSkeleton: {
        width: '30%',
        marginHorizontal: '1.5%',
        marginBottom: 12,
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
});
