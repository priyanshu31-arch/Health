import { useState } from 'react';
import { View, StyleSheet, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { COLORS, FONTS } from '../../constants/theme';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedButton } from '@/components/ui/ThemedButton';
import { api } from '../config/api.config';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function RequestAccessScreen() {
    const [patientId, setPatientId] = useState('');
    const [loading, setLoading] = useState(false);

    // In a real app, this should search by Email or Phone, then show ID to confirm.
    // Since our backend takes user ID directly for now, we will simulate a "Search & Request" 
    // by just taking the ID. A better UX would be "Enter Patient Email" -> Backend finds ID.
    // For this prototype, let's assume the doctor keys in the Patient ID (found via an admin search or provided by patient).

    // Actually, let's make it better. Let's assume the backend 'requestAccess' 
    // expects 'patientId'. Frontend should probably ask for Email if ID is unknown. 
    // But let's stick to the current backend implementation where it expects ID.

    const handleRequest = async () => {
        if (!patientId.trim()) {
            Alert.alert('Error', 'Please enter a Patient ID');
            return;
        }

        try {
            setLoading(true);
            await api.requestAccess(patientId.trim());
            Alert.alert('Success', 'Access request sent to patient!');
            setPatientId('');
        } catch (error: any) {
            console.error(error);
            Alert.alert('Error', error.message || 'Failed to send request');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ThemedView style={styles.container}>
            <Stack.Screen options={{ title: 'Request Access' }} />

            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <MaterialCommunityIcons name="account-search" size={60} color={COLORS.primary} />
                </View>

                <ThemedText style={styles.label}>Enter Patient ID</ThemedText>
                <ThemedText style={styles.description}>
                    Ask the patient for their User ID (found in Profile) to request access to their medical records.
                </ThemedText>

                <TextInput
                    style={styles.input}
                    placeholder="e.g. 64f1..."
                    placeholderTextColor={COLORS.textLight}
                    value={patientId}
                    onChangeText={setPatientId}
                    autoCapitalize="none"
                />

                <ThemedButton
                    title={loading ? 'Sending...' : 'Send Request'}
                    onPress={handleRequest}
                    style={styles.button}
                    disabled={loading}
                />
            </View>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    content: {
        padding: 24,
        marginTop: 40,
    },
    iconContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    label: {
        fontSize: 18,
        fontFamily: FONTS.semiBold,
        marginBottom: 8,
        color: COLORS.text,
    },
    description: {
        fontSize: 14,
        fontFamily: FONTS.regular,
        color: COLORS.textLight,
        marginBottom: 24,
        lineHeight: 20,
    },
    input: {
        backgroundColor: COLORS.white,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 12,
        fontSize: 16,
        fontFamily: FONTS.regular,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginBottom: 24,
        color: COLORS.text,
    },
    button: {
        marginTop: 8,
    },
});
