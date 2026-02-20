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
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
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
    const [uploading, setUploading] = useState(false);

    const pickImage = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                if (Platform.OS === 'web') alert('Permission needed to access photo library');
                else Alert.alert('Permission needed', 'Sorry, we need camera roll permissions to select a photo.');
                return;
            }

            let result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.5,
            });

            if (!result.canceled) {
                await handleImageUpload(result.assets[0]);
            }
        } catch (error) {
            console.error('Error picking image:', error);
            if (Platform.OS === 'web') alert('Failed to select image');
            else Alert.alert('Error', 'Failed to select image');
        }
    };

    const handleImageUpload = async (asset: any) => {
        setUploading(true);
        try {
            const formData = new FormData();

            if (Platform.OS === 'web') {
                const response = await fetch(asset.uri);
                const blob = await response.blob();
                formData.append('image', blob, 'hospital.jpg');
            } else {
                // @ts-ignore
                formData.append('image', {
                    uri: asset.uri,
                    name: 'hospital.jpg',
                    type: 'image/jpeg',
                });
            }

            const uploadRes = await api.uploadImage(formData);
            if (uploadRes && uploadRes.url) {
                setPhoto(uploadRes.url);
                if (Platform.OS === 'web') alert('Image Uploaded!');
            }
        } catch (error: any) {
            console.error('Image Upload Error:', error);
            if (Platform.OS === 'web') alert('Upload Failed: ' + error.message);
            else Alert.alert('Upload Failed', error.message || 'Could not upload image');
        } finally {
            setUploading(false);
        }
    };

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

                    <View style={styles.imageContainer}>
                        <ThemedText style={styles.label}>Hospital Photo</ThemedText>
                        <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
                            {photo ? (
                                <View style={styles.previewContainer}>
                                    <Image
                                        source={{ uri: photo }}
                                        style={styles.previewImage}
                                        contentFit="cover"
                                        transition={500}
                                    />
                                    <View style={styles.editBadge}>
                                        <Ionicons name="pencil" size={16} color="#fff" />
                                    </View>
                                </View>
                            ) : (
                                <View style={styles.placeholderContainer}>
                                    <Ionicons name="camera" size={32} color={COLORS.primary} />
                                    <ThemedText style={styles.uploadText}>Tap to Upload Photo</ThemedText>
                                </View>
                            )}
                        </TouchableOpacity>
                        {uploading && (
                            <View style={styles.uploadingOverlay}>
                                <ActivityIndicator color={COLORS.primary} />
                                <ThemedText style={styles.uploadingText}>Uploading...</ThemedText>
                            </View>
                        )}
                    </View>

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
                        style={[styles.submitButton, (loading || uploading) && styles.disabledBtn]}
                        onPress={handleRegister}
                        disabled={loading || uploading}
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
    disabledBtn: {
        opacity: 0.7,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    imageContainer: {
        gap: 8,
        marginVertical: 4
    },
    imagePicker: {
        height: 200,
        backgroundColor: COLORS.white,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderContainer: {
        alignItems: 'center',
        gap: 8,
    },
    uploadText: {
        color: COLORS.primary,
        fontWeight: '600',
    },
    previewContainer: {
        width: '100%',
        height: '100%',
        position: 'relative',
    },
    previewImage: {
        width: '100%',
        height: '100%',
    },
    editBadge: {
        position: 'absolute',
        bottom: 10,
        right: 10,
        backgroundColor: COLORS.primary,
        padding: 8,
        borderRadius: 20,
    },
    uploadingOverlay: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 4,
    },
    uploadingText: {
        fontSize: 12,
        color: COLORS.textLight,
    },
});
