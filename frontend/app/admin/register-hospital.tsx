import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { ThemedText } from '../../components/themed-text';
import { COLORS } from '../../constants/theme';
import { api } from '../config/api.config';

export default function RegisterHospitalScreen() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [photo, setPhoto] = useState('');
    const [bio, setBio] = useState('');
    const [rating, setRating] = useState('4.5');
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        if (!name || !bio) {
            Alert.alert('Missing Fields', 'Please fill in the hospital name and bio.');
            return;
        }

        try {
            setLoading(true);
            await api.registerHospital({
                name,
                photo: photo || undefined, // Send undefined if empty to let backend handle default or omit
                bio,
                rating: parseFloat(rating) || 4.5
            });
            Alert.alert('Success', 'Hospital registered successfully!');
            router.replace('/admin'); // Reload dashboard
        } catch (error: any) {
            console.error('Register hospital error:', error);
            const errorMessage = error.response?.data?.msg || error.message || 'Failed to register hospital.';
            Alert.alert('Error', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.form}>
                    <ThemedText style={styles.label}>Hospital Name</ThemedText>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. City General Hospital"
                        value={name}
                        onChangeText={setName}
                        placeholderTextColor={COLORS.textLight}
                    />

                    <ThemedText style={styles.label}>Bio / Description</ThemedText>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Brief description about the hospital..."
                        value={bio}
                        onChangeText={setBio}
                        placeholderTextColor={COLORS.textLight}
                        multiline
                        numberOfLines={4}
                    />

                    <ThemedText style={styles.label}>Photo URL</ThemedText>
                    <TextInput
                        style={styles.input}
                        placeholder="https://example.com/image.jpg"
                        value={photo}
                        onChangeText={setPhoto}
                        placeholderTextColor={COLORS.textLight}
                        autoCapitalize="none"
                    />

                    <ThemedText style={styles.label}>Initial Rating (0-5)</ThemedText>
                    <TextInput
                        style={styles.input}
                        placeholder="4.5"
                        value={rating}
                        onChangeText={setRating}
                        placeholderTextColor={COLORS.textLight}
                        keyboardType="numeric"
                    />

                    <TouchableOpacity
                        style={styles.submitButton}
                        onPress={handleRegister}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <ThemedText style={styles.submitButtonText}>Register Hospital</ThemedText>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scrollContent: {
        flexGrow: 1,
        padding: 20,
    },
    form: {
        gap: 16,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: -8,
    },
    input: {
        backgroundColor: COLORS.white,
        padding: 16,
        borderRadius: 12,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    submitButton: {
        backgroundColor: COLORS.primary,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 20,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
