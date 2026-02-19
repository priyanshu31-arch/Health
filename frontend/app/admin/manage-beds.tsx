import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemedText } from '../../components/themed-text';
import { COLORS, SHADOWS } from '../../constants/theme';
import { api } from '../config/api.config';

export default function ManageBedsScreen() {
    const router = useRouter();
    const [beds, setBeds] = useState<any[]>([]);
    const [hospital, setHospital] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [newBedNumber, setNewBedNumber] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Offline Booking State
    const [offlineModalVisible, setOfflineModalVisible] = useState(false);
    const [patientName, setPatientName] = useState('');
    const [contactNumber, setContactNumber] = useState('');
    const [selectedBedId, setSelectedBedId] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const hospitalData = await api.getMyHospital();
            setHospital(hospitalData.hospital);
            setBeds(hospitalData.beds || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddBed = async () => {
        if (!newBedNumber) return;
        if (!hospital) {
            alert('Please register your hospital first from the dashboard.');
            return;
        }

        try {
            setSubmitting(true);
            await api.addBed({
                bedNumber: newBedNumber,
                isAvailable: true,
                hospital: hospital._id,
            });
            setModalVisible(false);
            setNewBedNumber('');
            fetchData(); // Refresh list
        } catch (error: any) {
            console.error(error);
            alert(error.message || 'Failed to add bed');
        } finally {
            setSubmitting(false);
        }
    };

    const deleteItem = async (id: string) => {
        try {
            await api.deleteBed(id);
            if (Platform.OS === 'web') {
                alert('Bed removed successfully');
            } else {
                Alert.alert('Success', 'Bed removed successfully');
            }
            fetchData();
        } catch (error) {
            console.error(error);
            if (Platform.OS === 'web') {
                alert('Failed to delete bed');
            } else {
                Alert.alert('Error', 'Failed to delete bed');
            }
        }
    };

    const handleDeleteBed = async (id: string) => {
        if (Platform.OS === 'web') {
            if (window.confirm('Are you sure you want to delete this bed?')) {
                await deleteItem(id);
            }
        } else {
            Alert.alert('Delete Bed', 'Are you sure you want to delete this bed?', [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => deleteItem(id)
                }
            ]);
        }
    };

    const handleFreeBed = async (id: string) => {
        try {
            await api.updateBedStatus(id, true);
            if (Platform.OS === 'web') alert('Bed is now available');
            else Alert.alert('Success', 'Bed is now available');
            fetchData();
        } catch (error) {
            console.error(error);
            if (Platform.OS === 'web') alert('Failed to update status');
            else Alert.alert('Error', 'Failed to update status');
        }
    };


    const handleBookOffline = (bedId: string) => {
        setSelectedBedId(bedId);
        setOfflineModalVisible(true);
    };

    const confirmOfflineBooking = async () => {
        if (!patientName || !contactNumber || !selectedBedId || !hospital) {
            alert('Please fill all fields');
            return;
        }

        try {
            setSubmitting(true);
            await api.bookBed({
                bookingType: 'bed',
                itemId: selectedBedId,
                hospital: hospital._id,
                patientName,
                contactNumber,
                isOffline: true,
            });

            if (Platform.OS === 'web') alert('Bed booked successfully (Offline)');
            else Alert.alert('Success', 'Bed booked successfully (Offline)');

            setOfflineModalVisible(false);
            setPatientName('');
            setContactNumber('');
            setSelectedBedId(null);
            fetchData();
        } catch (error: any) {
            console.error(error);
            alert(error.message || 'Failed to book bed');
        } finally {
            setSubmitting(false);
        }
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.card}>
            <View style={styles.cardContent}>
                <MaterialCommunityIcons name="bed" size={24} color={COLORS.primary} />
                <View style={{ flex: 1 }}>
                    <ThemedText style={styles.cardTitle}>{item.bedNumber}</ThemedText>
                    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                        <ThemedText style={[styles.statusParams, { color: item.isAvailable ? COLORS.success : COLORS.error }]}>
                            {item.isAvailable ? 'Available' : 'Occupied'}
                        </ThemedText>
                    </View>
                </View>
                {!item.isAvailable && (
                    <TouchableOpacity
                        style={styles.freeButton}
                        onPress={() => handleFreeBed(item._id)}
                    >
                        <MaterialCommunityIcons name="check-circle" size={24} color={COLORS.success} />
                    </TouchableOpacity>
                )}
                <Pressable
                    onPress={() => handleDeleteBed(item._id)}
                    style={({ pressed }) => [
                        styles.deleteButton,
                        { opacity: pressed ? 0.5 : 1 }
                    ]}
                >
                    <MaterialCommunityIcons name="delete" size={24} color={COLORS.error} />
                </Pressable>
                {item.isAvailable && (
                    <TouchableOpacity
                        style={styles.bookButton}
                        onPress={() => handleBookOffline(item._id)}
                    >
                        <MaterialCommunityIcons name="account-plus" size={24} color={COLORS.primary} />
                    </TouchableOpacity>
                )}
            </View>
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
                data={beds}
                renderItem={renderItem}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.list}
                ListEmptyComponent={<ThemedText style={styles.emptyText}>No beds added yet.</ThemedText>}
            />

            <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
                <MaterialCommunityIcons name="plus" size={32} color="#fff" />
            </TouchableOpacity>

            <Modal
                transparent={true}
                visible={modalVisible}
                animationType="slide"
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <ThemedText style={styles.modalTitle}>Add New Bed</ThemedText>

                        <TextInput
                            style={styles.input}
                            placeholder="Bed Number (e.g. B-101)"
                            value={newBedNumber}
                            onChangeText={setNewBedNumber}
                            placeholderTextColor={COLORS.textLight}
                        />


                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                                <ThemedText style={styles.cancelText}>Cancel</ThemedText>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.confirmButton} onPress={handleAddBed} disabled={submitting}>
                                {submitting ? <ActivityIndicator color="#fff" /> : <ThemedText style={styles.confirmText}>Add Bed</ThemedText>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Offline Booking Modal */}
            <Modal
                transparent={true}
                visible={offlineModalVisible}
                animationType="slide"
                onRequestClose={() => setOfflineModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <ThemedText style={styles.modalTitle}>Book Offline</ThemedText>
                        <ThemedText style={styles.subtitle}>Enter patient details for offline booking</ThemedText>

                        <TextInput
                            style={styles.input}
                            placeholder="Patient Name"
                            value={patientName}
                            onChangeText={setPatientName}
                            placeholderTextColor={COLORS.textLight}
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="Contact Number"
                            value={contactNumber}
                            onChangeText={setContactNumber}
                            placeholderTextColor={COLORS.textLight}
                            keyboardType="phone-pad"
                        />

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => {
                                    setOfflineModalVisible(false);
                                    setPatientName('');
                                    setContactNumber('');
                                    setSelectedBedId(null);
                                }}
                            >
                                <ThemedText style={styles.cancelText}>Cancel</ThemedText>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.confirmButton} onPress={confirmOfflineBooking} disabled={submitting}>
                                {submitting ? <ActivityIndicator color="#fff" /> : <ThemedText style={styles.confirmText}>Book Bed</ThemedText>}
                            </TouchableOpacity>
                        </View>
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
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    statusParams: {
        fontSize: 12,
        fontWeight: '600',
    },
    emptyText: {
        textAlign: 'center',
        color: COLORS.textLight,
        marginTop: 40,
    },
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 30,
        backgroundColor: COLORS.primary,
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.medium,
    },
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
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    input: {
        backgroundColor: COLORS.background,
        padding: 16,
        borderRadius: 12,
        fontSize: 16,
    },
    modalActions: {
        flexDirection: 'row',
        gap: 16,
        marginTop: 8,
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
    freeButton: {
        padding: 8,
    },
    deleteButton: {
        padding: 8,
    },
    bookButton: {
        padding: 8,
    },
    subtitle: {
        fontSize: 14,
        color: COLORS.textLight,
        marginBottom: 8,
    },
    cancelText: {
        fontWeight: '600',
        color: COLORS.text,
    },
    confirmText: {
        fontWeight: 'bold',
        color: '#fff',
    },
});
