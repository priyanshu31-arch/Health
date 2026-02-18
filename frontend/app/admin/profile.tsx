import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../../constants/theme';
import { ThemedText } from '../../components/themed-text';
import { api } from '../config/api.config';
import { LinearGradient } from 'expo-linear-gradient';

export default function ManageProfile() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [hospital, setHospital] = useState<any>(null);

    // Form State
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [latitude, setLatitude] = useState('');
    const [longitude, setLongitude] = useState('');
    const [bio, setBio] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const data = await api.getMyHospital();
            if (data && data.hospital) {
                setHospital(data.hospital);
                setName(data.hospital.name);
                setAddress(data.hospital.address || ''); // New field
                setLatitude(data.hospital.latitude ? data.hospital.latitude.toString() : ''); // New field
                setLongitude(data.hospital.longitude ? data.hospital.longitude.toString() : ''); // New field
                setBio(data.hospital.bio || '');
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to fetch hospital details');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!name || !address || !latitude || !longitude) {
            if (Platform.OS === 'web') window.alert('Please fill all required fields');
            else Alert.alert('Error', 'Please fill all required fields (Name, Address, Lat, Lon)');
            return;
        }

        try {
            setSubmitting(true);
            const updates = {
                name,
                address,
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude),
                bio
            };

            await api.updateHospital(hospital._id, updates);

            if (Platform.OS === 'web') window.alert('Profile Updated Successfully!');
            else Alert.alert('Success', 'Profile Updated Successfully!');

            router.back();
        } catch (error: any) {
            console.error(error);
            if (Platform.OS === 'web') window.alert('Error: ' + error.message);
            else Alert.alert('Error', error.message || 'Failed to update profile');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <ThemedText style={styles.headerTitle}>Manage Hospital Profile</ThemedText>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.card}>
                    <View style={styles.inputGroup}>
                        <ThemedText style={styles.label}>Hospital Name</ThemedText>
                        <TextInput
                            style={styles.input}
                            value={name}
                            onChangeText={setName}
                            placeholder="e.g. HealthBridge Hospital"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <ThemedText style={styles.label}>Address</ThemedText>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={address}
                            onChangeText={setAddress}
                            placeholder="Full street address"
                            multiline
                        />
                    </View>

                    <View style={styles.row}>
                        <View style={[styles.inputGroup, { flex: 1 }]}>
                            <ThemedText style={styles.label}>Latitude</ThemedText>
                            <TextInput
                                style={styles.input}
                                value={latitude}
                                onChangeText={setLatitude}
                                placeholder="e.g. 12.9716"
                                keyboardType="numeric"
                            />
                        </View>
                        <View style={[styles.inputGroup, { flex: 1 }]}>
                            <ThemedText style={styles.label}>Longitude</ThemedText>
                            <TextInput
                                style={styles.input}
                                value={longitude}
                                onChangeText={setLongitude}
                                placeholder="e.g. 77.5946"
                                keyboardType="numeric"
                            />
                        </View>
                    </View>
                    <ThemedText style={styles.hint}>Used for live tracking drop location.</ThemedText>

                    <View style={styles.inputGroup}>
                        <ThemedText style={styles.label}>Bio / Description</ThemedText>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={bio}
                            onChangeText={setBio}
                            placeholder="Brief description of services..."
                            multiline
                        />
                    </View>

                    <TouchableOpacity
                        style={styles.saveBtn}
                        onPress={handleSave}
                        disabled={submitting}
                    >
                        {submitting ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <ThemedText style={styles.saveBtnText}>Save Changes</ThemedText>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
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
        fontWeight: 'bold',
        color: COLORS.text,
    },
    content: {
        padding: 20,
    },
    card: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 20,
        ...SHADOWS.small,
        gap: 16
    },
    inputGroup: {
        gap: 8
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
        marginLeft: 4
    },
    input: {
        backgroundColor: COLORS.background,
        padding: 16,
        borderRadius: 12,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        color: COLORS.text,
    },
    textArea: {
        minHeight: 80,
        textAlignVertical: 'top'
    },
    row: {
        flexDirection: 'row',
        gap: 16
    },
    hint: {
        fontSize: 12,
        color: COLORS.textLight,
        fontStyle: 'italic',
        marginTop: -8,
        marginLeft: 4
    },
    saveBtn: {
        backgroundColor: COLORS.primary,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 8
    },
    saveBtnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16
    }
});
