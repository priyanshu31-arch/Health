import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    View,
    Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemedText } from '../../components/themed-text';
import { COLORS, SHADOWS } from '../../constants/theme';
import { api } from '../config/api.config';

export default function ManageBookingsScreen() {
    const router = useRouter();
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const data = await api.getAllBookings();
            setBookings(data || []);
        } catch (error) {
            console.error(error);
            if (Platform.OS === 'web') alert('Failed to fetch bookings');
            else Alert.alert('Error', 'Failed to fetch bookings');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteBooking = async (id: string) => {
        const deleteAction = async () => {
            try {
                await api.deleteBooking(id);
                fetchData();
                if (Platform.OS === 'web') alert('Booking removed and resource freed');
                else Alert.alert('Success', 'Booking removed and resource freed');
            } catch (error) {
                console.error(error);
                if (Platform.OS === 'web') alert('Failed to delete booking');
                else Alert.alert('Error', 'Failed to delete booking');
            }
        };

        if (Platform.OS === 'web') {
            if (window.confirm('Are you sure you want to delete this booking? This will release the bed/ambulance.')) {
                await deleteAction();
            }
        } else {
            Alert.alert('Delete Booking', 'Are you sure you want to delete this booking? This will release the bed/ambulance.', [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: deleteAction
                }
            ]);
        }
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.card}>
            <View style={styles.cardContent}>
                <View style={[styles.iconBox, { backgroundColor: item.bookingType === 'bed' ? COLORS.primary + '15' : COLORS.secondary + '15' }]}>
                    <MaterialCommunityIcons
                        name={item.bookingType === 'bed' ? "bed" : "ambulance"}
                        size={24}
                        color={item.bookingType === 'bed' ? COLORS.primary : COLORS.secondary}
                    />
                </View>
                <View style={{ flex: 1 }}>
                    <ThemedText style={styles.cardTitle}>{item.patientName || 'Unknown Patient'}</ThemedText>
                    <ThemedText style={styles.subText}>{item.contactNumber}</ThemedText>
                    <ThemedText style={styles.metaText}>
                        {new Date(item.bookedAt).toLocaleDateString()} • {item.bookingType.toUpperCase()}
                    </ThemedText>
                    {item.hospital && <ThemedText style={styles.hospitalText}>{item.hospital.name}</ThemedText>}
                    {item.bookingType === 'ambulance' && (
                        <TouchableOpacity
                            style={styles.trackBtn}
                            onPress={() => router.push({
                                pathname: '/tracking',
                                params: {
                                    bookingId: item._id,
                                    patientName: item.patientName,
                                    role: 'admin'
                                }
                            })}
                        >
                            <ThemedText style={styles.trackText}>Track Live</ThemedText>
                        </TouchableOpacity>
                    )}
                </View>
                <TouchableOpacity onPress={() => handleDeleteBooking(item._id)}>
                    <MaterialCommunityIcons name="delete" size={24} color={COLORS.error} />
                </TouchableOpacity>
            </View>

            {item.sharedRecords && item.sharedRecords.length > 0 && (
                <TouchableOpacity
                    style={styles.recordsBtn}
                    onPress={() => {
                        if (Platform.OS === 'web') {
                            const records = item.sharedRecords.map((r: any) => `${r.type}: ${r.value} ${r.unit || ''}`).join('\n');
                            alert(`Shared Records:\n${records}`);
                        } else {
                            Alert.alert(
                                'Shared Medical Records',
                                item.sharedRecords.map((r: any) => `• ${r.type}: ${r.value} ${r.unit || ''} (${new Date(r.date).toLocaleDateString()})`).join('\n')
                            );
                        }
                    }}
                >
                    <MaterialCommunityIcons name="file-document-multiple" size={20} color={COLORS.primary} />
                    <ThemedText style={styles.recordsText}>{item.sharedRecords.length} Records Shared</ThemedText>
                </TouchableOpacity>
            )}
        </View>
    );

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={bookings}
                renderItem={renderItem}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.list}
                ListEmptyComponent={<ThemedText style={styles.emptyText}>No bookings found.</ThemedText>}
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
    list: {
        padding: 20,
        gap: 12,
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
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    subText: {
        fontSize: 14,
        color: COLORS.text,
        marginBottom: 2,
    },
    metaText: {
        fontSize: 12,
        color: COLORS.textLight,
        marginTop: 2,
    },
    hospitalText: {
        fontSize: 12,
        color: COLORS.primary,
        fontWeight: '600',
        marginTop: 2,
    },
    emptyText: {
        textAlign: 'center',
        color: COLORS.textLight,
        marginTop: 40,
    },
    trackBtn: {
        marginTop: 8,
        backgroundColor: COLORS.primary,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    trackText: {
        color: COLORS.white,
        fontSize: 12,
        fontWeight: 'bold',
    },
    recordsBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        marginRight: 8
    },
    recordsText: {
        fontSize: 12,
        color: COLORS.primary,
        fontWeight: '600'
    }
});
