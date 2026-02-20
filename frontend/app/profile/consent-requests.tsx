import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { api } from '../config/api.config';
import { COLORS, FONTS, SHADOWS } from '../../constants/theme';
import { Stack } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

interface ConsentRequest {
    _id: string;
    doctor: {
        _id: string;
        name: string;
        specialty: string;
        hospital: string; // ID or object depending on populate, assuming string or object with name
    };
    status: string;
    createdAt: string;
}

export default function ConsentRequestsScreen() {
    const [requests, setRequests] = useState<ConsentRequest[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const data = await api.getPendingRequests();
            setRequests(data);
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to fetch requests');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleRespond = async (id: string, status: 'approved' | 'rejected') => {
        try {
            await api.respondToRequest(id, status);
            Alert.alert('Success', `Request ${status} successfully`);
            fetchRequests(); // Refresh list
        } catch (error: any) {
            Alert.alert('Error', error.message || `Failed to ${status} request`);
        }
    };

    const renderItem = ({ item }: { item: ConsentRequest }) => (
        <View style={styles.card}>
            <View style={styles.header}>
                <MaterialCommunityIcons name="doctor" size={24} color={COLORS.primary} />
                <View style={styles.headerText}>
                    <Text style={styles.doctorName}>Dr. {item.doctor?.name || 'Unknown'}</Text>
                    <Text style={styles.specialty}>{item.doctor?.specialty || 'General'}</Text>
                </View>
            </View>

            <Text style={styles.message}>
                Requesting access to your medical records.
            </Text>

            <View style={styles.actions}>
                <TouchableOpacity
                    style={[styles.button, styles.rejectButton]}
                    onPress={() => handleRespond(item._id, 'rejected')}
                >
                    <Text style={[styles.buttonText, { color: COLORS.error }]}>Reject</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.button, styles.approveButton]}
                    onPress={() => handleRespond(item._id, 'approved')}
                >
                    <Text style={[styles.buttonText, { color: COLORS.white }]}>Approve</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <ThemedView style={styles.container}>
            <Stack.Screen options={{ title: 'Access Requests', headerBackTitle: 'Profile' }} />

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : requests.length === 0 ? (
                <View style={styles.center}>
                    <MaterialCommunityIcons name="check-circle-outline" size={64} color={COLORS.success} />
                    <ThemedText style={styles.emptyText}>No pending requests</ThemedText>
                </View>
            ) : (
                <FlatList
                    data={requests}
                    renderItem={renderItem}
                    keyExtractor={item => item._id}
                    contentContainerStyle={styles.list}
                />
            )}
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    list: {
        padding: 20,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        color: COLORS.textLight,
        fontFamily: FONTS.medium,
    },
    card: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        ...SHADOWS.medium,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    headerText: {
        marginLeft: 12,
    },
    doctorName: {
        fontSize: 18,
        fontFamily: FONTS.semiBold,
        color: COLORS.text,
    },
    specialty: {
        fontSize: 14,
        color: COLORS.textLight,
        fontFamily: FONTS.regular,
    },
    message: {
        fontSize: 14,
        color: COLORS.text,
        marginBottom: 20,
        fontFamily: FONTS.regular,
        lineHeight: 20,
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
    },
    button: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rejectButton: {
        backgroundColor: COLORS.error + '15',
        borderWidth: 1,
        borderColor: COLORS.error + '30',
    },
    approveButton: {
        backgroundColor: COLORS.primary,
    },
    buttonText: {
        fontFamily: FONTS.medium,
        fontSize: 15,
    },
});
