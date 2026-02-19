import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, View, TextInput, Modal, Alert, Platform, Button } from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SHADOWS, FONTS } from '../../constants/theme';
import { ThemedText } from '../../components/themed-text';
import { api } from '../config/api.config';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { scheduleBookingNotification } from '../../utils/notifications';
import { useNotifications } from '@/context/NotificationContext';
import Shimmer from '@/components/Shimmer';
import { ThemedButton } from '@/components/ui/ThemedButton';

interface Bed {
    _id: string;
    bedNumber: string;
    isAvailable: boolean;
    hospital: string;
}

interface Ambulance {
    _id: string;
    ambulanceNumber: string;
    isAvailable: boolean;
    hospital: string;
    status?: string;
}

interface HospitalDetails {
    hospital: {
        _id: string;
        name: string;
        photo?: string;
        bio?: string;
        rating?: number;
    };
    beds: Bed[];
    ambulances: Ambulance[];
}

const HospitalDetailSkeleton = () => (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.imageContainer}>
            <Shimmer width="100%" height={250} borderRadius={0} />
        </View>
        <View style={styles.contentContainer}>
            <View style={styles.statsContainer}>
                <Shimmer width="45%" height={60} borderRadius={16} />
                <Shimmer width="45%" height={60} borderRadius={16} />
            </View>

            <View style={[styles.sectionHeader, { marginTop: 24 }]}>
                <Shimmer width="40%" height={24} borderRadius={4} />
                <Shimmer width="30%" height={16} borderRadius={4} style={{ marginTop: 8 }} />
            </View>

            <View style={styles.grid}>
                {[1, 2, 3, 4].map((i) => (
                    <View key={i} style={styles.card}>
                        <Shimmer width="100%" height={80} borderRadius={12} />
                    </View>
                ))}
            </View>
        </View>
    </ScrollView>
);

export default function HospitalDetailsScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const [details, setDetails] = useState<HospitalDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [bookingType, setBookingType] = useState<'bed' | 'ambulance' | null>(null);
    const [selectedItem, setSelectedItem] = useState<Bed | Ambulance | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [bookingSuccess, setBookingSuccess] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [patientName, setPatientName] = useState('');
    const [contactNumber, setContactNumber] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const { addNotification } = useNotifications();

    useEffect(() => {
        if (id) {
            fetchDetails();
        }
    }, [id]);

    const fetchDetails = async (showLoading = true) => {
        try {
            if (showLoading) setLoading(true);
            const data = await api.getHospitalDetails(id as string);
            setDetails(data);
        } catch (error) {
            console.error('Failed to fetch hospital details:', error);
            // Non-blocking, just log
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    const handleBookPress = (item: Bed | Ambulance, type: 'bed' | 'ambulance') => {
        if (type === 'ambulance') {
            router.push({
                pathname: '/ambulance/pickup',
                params: { hospitalId: id as string, ambulanceId: item._id }
            });
            return;
        }
        setSelectedItem(item);
        setBookingType(type);
        setBookingSuccess(false);
        setErrorMessage(null); // Reset error
        setModalVisible(true);
        Haptics.selectionAsync();
    };

    const submitBooking = async () => {
        setErrorMessage(null);
        if (!patientName.trim() || !contactNumber.trim()) {
            setErrorMessage('Please fill in all patient details to proceed.');
            return;
        }

        try {
            setSubmitting(true);
            const bookingData = {
                hospitalName: details?.hospital.name || '',
                date: new Date().toISOString().split('T')[0],
                time: new Date().toLocaleTimeString(),
                price: bookingType === 'bed' ? 500 : 200,
                // @ts-ignore
                itemId: selectedItem?._id,
                hospital: details?.hospital._id,
                bookingType: bookingType || 'bed',
                patientName,
                contactNumber,
                bedType: bookingType === 'bed' ? 'Standard' : 'Ambulance'
            };

            await api.bookBed(bookingData as any);

            // Show success view with haptic feedback
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            // Trigger notification
            await scheduleBookingNotification(bookingType === 'bed' ? 'Bed Booking' : 'Ambulance Booking', patientName);

            // Add to in-app notification context
            const typeLabel = bookingType === 'bed' ? 'Bed' : 'Ambulance';
            addNotification(
                'Booking Confirmed! ✅',
                `Your ${typeLabel} booking for ${patientName} at ${details?.hospital.name} is confirmed.`,
                'booking'
            );

            setBookingSuccess(true);
            setPatientName('');
            setContactNumber('');

            // Background refresh moved to Done button to keep success view visible
            // fetchDetails(false);

        } catch (error: any) {
            console.error(error);
            setErrorMessage(error.message || 'Booking failed. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };


    if (loading) {
        return <HospitalDetailSkeleton />;
    }

    if (!details) {
        return (
            <View style={styles.loadingContainer}>
                <ThemedText>Hospital not found.</ThemedText>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Header Image */}
                <View style={styles.imageContainer}>
                    <Image
                        source={details.hospital.photo && details.hospital.photo.startsWith('http') ? { uri: details.hospital.photo } : require('@/assets/images/hospital1.png')}
                        style={styles.hospitalImage}
                        contentFit="cover"
                    />
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.8)']}
                        style={styles.imageOverlay}
                    />
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
                    </TouchableOpacity>
                    <View style={styles.headerInfo}>
                        <ThemedText style={styles.hospitalName}>{details.hospital.name}</ThemedText>
                        <ThemedText style={styles.hospitalBio}>{details.hospital.bio || 'Multi-speciality Hospital'}</ThemedText>
                        <View style={styles.ratingContainer}>
                            <MaterialCommunityIcons name="star" size={16} color="#FFD700" />
                            <ThemedText style={styles.ratingText}>{details.hospital.rating || 4.5}</ThemedText>
                        </View>
                    </View>
                </View>

                <View style={styles.contentContainer}>
                    {/* Stats Overview */}
                    <View style={styles.statsContainer}>
                        <View style={styles.statItem}>
                            <MaterialCommunityIcons name="bed" size={28} color={COLORS.primary} />
                            <View>
                                <ThemedText style={styles.statNumber}>{details.beds.length}</ThemedText>
                                <ThemedText style={styles.statLabel}>Total Beds</ThemedText>
                            </View>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.statItem}>
                            <MaterialCommunityIcons name="ambulance" size={28} color={COLORS.secondary} />
                            <View>
                                <ThemedText style={styles.statNumber}>{details.ambulances.length}</ThemedText>
                                <ThemedText style={styles.statLabel}>Ambulances</ThemedText>
                            </View>
                        </View>
                    </View>

                    {/* Beds Section */}
                    <View style={styles.sectionHeader}>
                        <ThemedText style={styles.sectionTitle}>Select a Bed</ThemedText>
                        <ThemedText style={styles.sectionSubtitle}>{details.beds.filter(b => b.isAvailable).length} Available Now</ThemedText>
                    </View>

                    <View style={styles.grid}>
                        {details.beds.map((bed) => (
                            <View key={bed._id} style={[styles.card, !bed.isAvailable && styles.cardDisabled]}>
                                <MaterialCommunityIcons name="bed" size={24} color={bed.isAvailable ? COLORS.primary : COLORS.textLight} />
                                <ThemedText style={styles.cardTitle}>{bed.bedNumber}</ThemedText>
                                {bed.isAvailable ? (
                                    <ThemedButton
                                        title="Book"
                                        onPress={() => handleBookPress(bed, 'bed')}
                                        style={{ width: '100%', minHeight: 36 }}
                                        textStyle={{ fontSize: 13 }}
                                    />
                                ) : (
                                    <View style={styles.bookedBadge}>
                                        <ThemedText style={styles.bookedText}>Occupied</ThemedText>
                                    </View>
                                )}
                            </View>
                        ))}
                        {details.beds.length === 0 && (
                            <View style={styles.emptyContainer}>
                                <MaterialCommunityIcons name="bed-empty" size={40} color={COLORS.textLight} />
                                <ThemedText style={styles.emptyText}>No beds information available.</ThemedText>
                            </View>
                        )}
                    </View>

                    {/* Ambulances Section */}
                    <View style={[styles.sectionHeader, { marginTop: 32 }]}>
                        <ThemedText style={styles.sectionTitle}>Select an Ambulance</ThemedText>
                        <ThemedText style={styles.sectionSubtitle}>{details.ambulances.filter(a => a.isAvailable).length} Available Now</ThemedText>
                    </View>

                    <View style={styles.list}>
                        {details.ambulances.map((amb) => (
                            <View key={amb._id} style={[styles.listCard, !amb.isAvailable && styles.cardDisabled]}>
                                <View style={[styles.listIcon, !amb.isAvailable && { backgroundColor: '#F1F5F9' }]}>
                                    <MaterialCommunityIcons name="ambulance" size={24} color={amb.isAvailable ? COLORS.secondary : COLORS.textLight} />
                                </View>
                                <View style={styles.listInfo}>
                                    <ThemedText style={styles.cardTitle}>{amb.ambulanceNumber}</ThemedText>
                                    <ThemedText style={styles.statusText}>{amb.isAvailable ? 'Ready for dispatch' : 'Currently on mission'}</ThemedText>
                                </View>
                                {amb.isAvailable ? (
                                    <ThemedButton
                                        title="Book"
                                        variant="secondary"
                                        onPress={() => handleBookPress(amb, 'ambulance')}
                                        style={{ minHeight: 40, paddingHorizontal: 20 }}
                                        textStyle={{ fontSize: 13 }}
                                    />
                                ) : (
                                    <View style={styles.bookedBadge}>
                                        <ThemedText style={styles.bookedText}>Busy</ThemedText>
                                    </View>
                                )}
                            </View>
                        ))}
                        {details.ambulances.length === 0 && (
                            <View style={styles.emptyContainer}>
                                <MaterialCommunityIcons name="ambulance" size={40} color={COLORS.textLight} />
                                <ThemedText style={styles.emptyText}>No ambulance information available.</ThemedText>
                            </View>
                        )}
                    </View>
                </View>
            </ScrollView>

            {/* Booking Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        {!bookingSuccess ? (
                            <>
                                <ThemedText style={styles.modalTitle}>Confirm Booking</ThemedText>
                                <ThemedText style={styles.modalSubtitle}>
                                    Booking {bookingType === 'bed' ? 'Bed' : 'Ambulance'} {bookingType === 'bed' ? (selectedItem as Bed)?.bedNumber : (selectedItem as Ambulance)?.ambulanceNumber}
                                </ThemedText>

                                {errorMessage && (
                                    <View style={styles.errorContainer}>
                                        <MaterialCommunityIcons name="alert-circle" size={16} color="#DC2626" />
                                        <ThemedText style={styles.errorText}>{errorMessage}</ThemedText>
                                    </View>
                                )}

                                <TextInput
                                    style={styles.input}
                                    placeholder="Patient Name"
                                    placeholderTextColor={COLORS.textLight}
                                    value={patientName}
                                    onChangeText={(text) => {
                                        const alphabetOnly = text.replace(/[^a-zA-Z\s]/g, '');
                                        setPatientName(alphabetOnly);
                                    }}
                                />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Contact Number"
                                    placeholderTextColor={COLORS.textLight}
                                    value={contactNumber}
                                    onChangeText={(text) => {
                                        const numbersOnly = text.replace(/[^0-9]/g, '');
                                        if (text !== numbersOnly && text.length > 0) {
                                            Alert.alert('Invalid Input', 'Please enter numbers only');
                                        }
                                        if (numbersOnly.length <= 10) {
                                            setContactNumber(numbersOnly);
                                        } else {
                                            Alert.alert('Limit Reached', 'Contact number cannot exceed 10 digits');
                                        }
                                    }}
                                    keyboardType="phone-pad"
                                />

                                <View style={styles.modalButtons}>
                                    <ThemedButton
                                        title="Cancel"
                                        variant="outline"
                                        onPress={() => setModalVisible(false)}
                                        style={{ flex: 1 }}
                                    />
                                    <ThemedButton
                                        title={submitting ? '...' : 'Confirm'}
                                        onPress={submitBooking}
                                        isLoading={submitting}
                                        disabled={submitting}
                                        style={{ flex: 1 }}
                                    />
                                </View>
                            </>
                        ) : (
                            // Success View
                            <Animated.View
                                entering={ZoomIn.duration(400).springify()}
                                style={styles.successContainer}
                            >
                                <View style={styles.successIconCircle}>
                                    <MaterialCommunityIcons name="check" size={40} color="#fff" />
                                </View>
                                <ThemedText style={styles.successTitle}>Booking Confirmed!</ThemedText>
                                <ThemedText style={styles.successMessage}>
                                    Your {bookingType} has been successfully booked.
                                </ThemedText>

                                <ThemedButton
                                    title="Done"
                                    onPress={() => {
                                        setModalVisible(false);
                                        fetchDetails(false);
                                    }}
                                    style={{ width: '100%', marginTop: 8 }}
                                />
                            </Animated.View>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        paddingBottom: 40,
    },
    imageContainer: {
        height: 250,
        width: '100%',
        position: 'relative',
    },
    hospitalImage: {
        width: '100%',
        height: '100%',
    },
    imageOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    backButton: {
        position: 'absolute',
        top: 50,
        left: 20,
        padding: 8,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 20,
    },
    headerInfo: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
    },
    hospitalName: {
        color: '#fff',
        fontSize: 24,
        fontFamily: FONTS.semiBold,
    },
    hospitalBio: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        marginTop: 4,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    ratingText: {
        color: '#fff',
        fontWeight: '500',
        fontSize: 12,
    },
    contentContainer: {
        padding: 20,
        marginTop: -20,
        backgroundColor: COLORS.background,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontFamily: FONTS.semiBold,
    },
    badge: {
        backgroundColor: COLORS.success + '20',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeText: {
        color: COLORS.success,
        fontSize: 12,
        fontWeight: '600',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    card: {
        width: '30%',
        backgroundColor: COLORS.white,
        padding: 12,
        borderRadius: 12,
        alignItems: 'center',
        gap: 8,
        ...SHADOWS.small,
    },
    cardTitle: {
        fontSize: 14,
        fontFamily: FONTS.medium,
    },
    bookButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        width: '100%',
        alignItems: 'center',
    },
    bookButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '500',
    },
    unavailableText: {
        color: COLORS.textLight,
        fontSize: 12,
        fontStyle: 'italic',
    },
    emptyText: {
        color: COLORS.textLight,
        fontStyle: 'italic',
        width: '100%',
        textAlign: 'center',
        marginVertical: 10,
    },
    list: {
        gap: 12,
    },
    listCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        padding: 12,
        borderRadius: 12,
        gap: 12,
        ...SHADOWS.small,
    },
    listIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: COLORS.secondary + '10',
        justifyContent: 'center',
        alignItems: 'center',
    },
    listInfo: {
        flex: 1,
    },
    statusText: {
        fontSize: 12,
        color: COLORS.textLight,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        width: '100%',
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        ...SHADOWS.medium,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 8,
    },
    modalSubtitle: {
        fontSize: 14,
        color: COLORS.textLight,
        marginBottom: 24,
    },
    input: {
        width: '100%',
        backgroundColor: COLORS.background,
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
        fontSize: 16,
        color: COLORS.text,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 16,
        width: '100%',
        marginTop: 8,
    },
    cancelButton: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        backgroundColor: COLORS.background,
        alignItems: 'center',
    },
    confirmButton: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: COLORS.text,
        fontWeight: '500',
    },
    statsContainer: {
        flexDirection: 'row',
        backgroundColor: COLORS.white,
        padding: 20,
        borderRadius: 12,
        marginBottom: 24,
        ...SHADOWS.medium,
        alignItems: 'center',
    },
    statItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        justifyContent: 'center',
    },
    statNumber: {
        fontSize: 20,
        fontFamily: FONTS.semiBold,
        color: COLORS.text,
    },
    statLabel: {
        fontSize: 12,
        color: COLORS.textLight,
    },
    divider: {
        width: 1,
        height: 40,
        backgroundColor: '#E2E8F0',
        marginHorizontal: 10,
    },
    sectionSubtitle: {
        fontSize: 14,
        color: COLORS.primary,
        fontWeight: '500',
    },
    cardDisabled: {
        opacity: 0.7,
        backgroundColor: '#F8FAFC',
    },
    bookedBadge: {
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    bookedText: {
        fontSize: 11,
        color: COLORS.textLight,
        fontWeight: '500',
    },
    emptyContainer: {
        width: '100%',
        alignItems: 'center',
        padding: 20,
        gap: 8,
    },
    confirmButtonText: {
        color: '#fff',
        fontWeight: '500',
    },
    // Success State Styles
    successContainer: {
        alignItems: 'center',
        padding: 16,
        gap: 12,
        width: '100%'
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
        fontFamily: FONTS.semiBold,
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
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF2F2',
        padding: 10,
        borderRadius: 8,
        marginBottom: 16,
        gap: 8,
        width: '100%'
    },
    errorText: {
        color: '#DC2626',
        fontSize: 14,
        flex: 1
    },
});
