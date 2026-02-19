import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    View,
    RefreshControl
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/themed-text';
import { COLORS, SHADOWS, FONTS } from '../../constants/theme';
import { api } from '../config/api.config';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import { ThemedButton } from '@/components/ui/ThemedButton';

export default function BookingsScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchBookings = async () => {
        try {
            const data = await api.getMyBookings();
            setBookings(data);
        } catch (error) {
            console.error('Failed to fetch bookings:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchBookings();
        } else {
            setLoading(false);
        }
    }, [user]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchBookings();
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={[styles.iconBox, { backgroundColor: item.bookingType === 'bed' ? '#EFF6FF' : '#FEF2F2' }]}>
                    <MaterialCommunityIcons
                        name={item.bookingType === 'bed' ? "bed" : "ambulance"}
                        size={24}
                        color={item.bookingType === 'bed' ? COLORS.primary : COLORS.secondary}
                    />
                </View>
                <View style={{ flex: 1 }}>
                    <ThemedText style={styles.hospitalName}>
                        {item.hospital?.name || 'HealthBridge Service'}
                    </ThemedText>
                    <ThemedText style={styles.date}>
                        {new Date(item.bookedAt).toLocaleDateString()} at {new Date(item.bookedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </ThemedText>
                </View>
                <View style={styles.statusBadge}>
                    <ThemedText style={styles.statusText}>Confirmed</ThemedText>
                </View>
            </View>

            <View style={styles.cardBody}>
                <View style={styles.row}>
                    <ThemedText style={styles.label}>Patient:</ThemedText>
                    <ThemedText style={styles.value}>{item.patientName || 'N/A'}</ThemedText>
                </View>
                <View style={styles.row}>
                    <ThemedText style={styles.label}>Resource:</ThemedText>
                    <ThemedText style={styles.value}>
                        {item.bookingType === 'bed'
                            ? (item.itemId?.bedNumber ? `Bed ${item.itemId.bedNumber}` : 'Bed Booking')
                            : (item.itemId?.ambulanceNumber ? `Ambulance ${item.itemId.ambulanceNumber}` : 'Ambulance Booking')}
                    </ThemedText>
                </View>
                {item.contactNumber && (
                    <View style={styles.row}>
                        <ThemedText style={styles.label}>Contact:</ThemedText>
                        <ThemedText style={styles.value}>{item.contactNumber}</ThemedText>
                    </View>
                )}
            </View>
        </View>
    );

    if (!user) {
        return (
            <View style={styles.center}>
                <MaterialCommunityIcons name="account-lock" size={64} color={COLORS.textLight} />
                <ThemedText style={styles.message}>Please login to view your bookings</ThemedText>
                <ThemedButton
                    title="Login Now"
                    onPress={() => router.push('/login')}
                    style={{ width: 200, marginTop: 8 }}
                />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[COLORS.primary, COLORS.accent]}
                style={styles.header}
            >
                <ThemedText style={styles.headerTitle}>My Bookings</ThemedText>
            </LinearGradient>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : (
                <FlatList
                    data={bookings}
                    renderItem={renderItem}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <MaterialCommunityIcons name="calendar-blank" size={64} color={COLORS.textLight} />
                            <ThemedText style={styles.emptyText}>No bookings found</ThemedText>
                            <ThemedButton
                                title="Book Now"
                                onPress={() => router.push('/hospitals')}
                                variant="secondary"
                                style={{ width: 160, marginTop: 8 }}
                            />
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        marginBottom: 10,
        ...SHADOWS.medium,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '600',
        color: COLORS.white,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        gap: 16,
    },
    list: {
        padding: 20,
        gap: 16,
        paddingBottom: 40,
    },
    card: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 16,
        ...SHADOWS.small,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    hospitalName: {
        fontSize: 16,
        fontFamily: FONTS.semiBold,
        color: COLORS.text,
    },
    date: {
        fontSize: 12,
        color: COLORS.textLight,
        marginTop: 2,
    },
    statusBadge: {
        backgroundColor: '#ECFDF5',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        color: '#059669',
        fontSize: 12,
        fontFamily: FONTS.medium,
    },
    cardBody: {
        gap: 8,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    label: {
        color: COLORS.textLight,
        fontSize: 14,
    },
    value: {
        color: COLORS.text,
        fontFamily: FONTS.medium,
        fontSize: 14,
    },
    message: {
        color: COLORS.textLight,
        fontSize: 16,
        textAlign: 'center',
    },
    loginButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 32,
        paddingVertical: 12,
        borderRadius: 12,
    },
    loginButtonText: {
        color: COLORS.white,
        fontWeight: '500',
        fontSize: 16,
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
    bookButton: {
        marginTop: 10,
        backgroundColor: COLORS.secondary,
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: 12,
    },
    bookButtonText: {
        color: COLORS.white,
        fontWeight: '500',
    },
});
