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
    Modal,
    Linking,
    ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemedText } from '../../components/themed-text';
import { COLORS, SHADOWS } from '../../constants/theme';
import { api } from '../config/api.config';

export default function ManageBookingsScreen() {
    const router = useRouter();
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRecords, setSelectedRecords] = useState<any[] | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        // ... existing fetchData ...
    };

    const handleDeleteBooking = async (id: string) => {
        Alert.alert(
            "Delete Booking",
            "Are you sure you want to delete this booking?",
            [
                {
                    text: "Cancel",
                    style: "cancel",
                },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            setLoading(true);
                            await api.deleteBooking(id);
                            setBookings(prev => prev.filter(item => item._id !== id));
                            Alert.alert('Success', 'Booking deleted successfully');
                        } catch (error: any) {
                            Alert.alert('Error', error.message || 'Failed to delete booking');
                        } finally {
                            setLoading(false);
                        }
                    },
                },
            ]
        );
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.card}>
            {/* ... existing card content ... */}
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
                    onPress={() => setSelectedRecords(item.sharedRecords)}
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

            {/* Shared Records Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={!!selectedRecords}
                onRequestClose={() => setSelectedRecords(null)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <ThemedText style={styles.modalTitle}>Shared Medical Records</ThemedText>
                            <TouchableOpacity onPress={() => setSelectedRecords(null)}>
                                <MaterialCommunityIcons name="close" size={24} color={COLORS.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.recordsList} contentContainerStyle={{ gap: 12 }}>
                            {selectedRecords?.map((record, index) => (
                                <View key={index} style={styles.recordItem}>
                                    <View style={styles.recordHeaderInfo}>
                                        <MaterialCommunityIcons
                                            name={record.file ? (record.file.endsWith('.pdf') ? "file-pdf-box" : "image") : "file-document-outline"}
                                            size={24}
                                            color={COLORS.primary}
                                        />
                                        <View style={{ flex: 1 }}>
                                            <ThemedText style={styles.recordType}>{record.type}</ThemedText>
                                            <ThemedText style={styles.recordDate}>
                                                {new Date(record.date).toLocaleDateString()} • {record.value} {record.unit}
                                            </ThemedText>
                                        </View>
                                    </View>

                                    {record.notes ? <ThemedText style={styles.recordNotes}>{record.notes}</ThemedText> : null}

                                    {record.file && (
                                        <TouchableOpacity
                                            style={styles.viewFileBtn}
                                            onPress={() => Linking.openURL(record.file)}
                                        >
                                            <ThemedText style={styles.viewFileText}>View Attached File</ThemedText>
                                            <MaterialCommunityIcons name="open-in-new" size={16} color={COLORS.white} />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            ))}
                        </ScrollView>
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
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    modalContent: {
        width: '100%',
        maxHeight: '80%',
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 20,
        ...SHADOWS.medium
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0'
    },
    modalTitle: {
        fontSize: 18,
        fontFamily: 'Outfit-SemiBold',
        color: COLORS.text
    },
    recordsList: {
        marginBottom: 8
    },
    recordItem: {
        backgroundColor: COLORS.background,
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0'
    },
    recordHeaderInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 8
    },
    recordType: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text
    },
    recordDate: {
        fontSize: 12,
        color: COLORS.textLight
    },
    recordNotes: {
        fontSize: 14,
        color: COLORS.text,
        marginBottom: 8,
        fontStyle: 'italic'
    },
    viewFileBtn: {
        backgroundColor: COLORS.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: 10,
        borderRadius: 8,
        marginTop: 4
    },
    viewFileText: {
        color: COLORS.white,
        fontWeight: '500',
        fontSize: 14
    }
});
