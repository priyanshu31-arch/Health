import { useState } from 'react';
import { View, StyleSheet, TextInput, Alert, ScrollView, TouchableOpacity, Text, Image, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { api } from '../config/api.config';
import { COLORS, FONTS, SHADOWS } from '../../constants/theme';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedButton } from '@/components/ui/ThemedButton';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';

export default function AddHealthRecordScreen() {
    const router = useRouter();
    const [type, setType] = useState('');
    const [value, setValue] = useState('');
    const [unit, setUnit] = useState('');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);

    const recordTypes = ['Blood Pressure', 'Blood Sugar', 'Heart Rate', 'Weight', 'Prescription', 'Lab Report', 'Other'];

    const handleFilePick = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['image/*', 'application/pdf'],
                copyToCacheDirectory: true,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                setSelectedFile(result.assets[0]);
            }
        } catch (err) {
            console.error('Error picking document:', err);
            Alert.alert('Error', 'Failed to pick document');
        }
    };

    const handleSubmit = async () => {
        if (!type || !value) {
            Alert.alert('Error', 'Please fill in the Type and Value fields');
            return;
        }

        try {
            setLoading(true);
            let fileUrl = '';

            if (selectedFile) {
                const formData = new FormData();

                if (Platform.OS === 'web') {
                    // Fetch the blob from the URI (which is a blob URL on web)
                    const response = await fetch(selectedFile.uri);
                    const blob = await response.blob();
                    formData.append('image', blob, selectedFile.name || 'upload.pdf');
                } else {
                    formData.append('image', {
                        uri: selectedFile.uri,
                        name: selectedFile.name || 'upload.jpg',
                        type: selectedFile.mimeType || 'application/octet-stream',
                    } as any);
                }

                // Assuming backend route /api/upload handles 'image' field for both images and pdfs
                const uploadRes = await api.uploadFile(formData);
                fileUrl = uploadRes.url;
            }

            await api.addHealthRecord({
                type,
                value,
                unit,
                notes,
                file: fileUrl,
            });

            Alert.alert('Success', 'Health record added successfully', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error: any) {
            console.error(error);
            Alert.alert('Error', error.message || 'Failed to add record');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ThemedView style={styles.container}>
            <Stack.Screen options={{ title: 'Add Record' }} />

            <ScrollView contentContainerStyle={styles.content}>
                <ThemedText style={styles.label}>Record Type</ThemedText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}>
                    {recordTypes.map((t) => (
                        <TouchableOpacity
                            key={t}
                            style={[styles.typeChip, type === t && styles.typeChipActive]}
                            onPress={() => setType(t)}
                        >
                            <Text style={[styles.typeChipText, type === t && styles.typeChipTextActive]}>{t}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
                <TextInput
                    style={styles.input}
                    placeholder="Or type custom..."
                    value={type}
                    onChangeText={setType}
                    placeholderTextColor={COLORS.textLight}
                />

                <ThemedText style={styles.label}>Value</ThemedText>
                <TextInput
                    style={styles.input}
                    placeholder="e.g. 120/80, 95, Normal"
                    value={value}
                    onChangeText={setValue}
                    placeholderTextColor={COLORS.textLight}
                />

                <ThemedText style={styles.label}>Unit (Optional)</ThemedText>
                <TextInput
                    style={styles.input}
                    placeholder="e.g. mmHg, mg/dL, kg"
                    value={unit}
                    onChangeText={setUnit}
                    placeholderTextColor={COLORS.textLight}
                />

                <ThemedText style={styles.label}>Notes (Optional)</ThemedText>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Add any additional details..."
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                    numberOfLines={4}
                    placeholderTextColor={COLORS.textLight}
                />

                <ThemedText style={styles.label}>Attachment</ThemedText>
                <TouchableOpacity style={styles.uploadBox} onPress={handleFilePick}>
                    {selectedFile ? (
                        <View style={styles.filePreview}>
                            {selectedFile.mimeType?.startsWith('image/') ? (
                                <Image source={{ uri: selectedFile.uri }} style={styles.previewImage} />
                            ) : (
                                <MaterialCommunityIcons name="file-pdf-box" size={48} color={COLORS.error} />
                            )}
                            <Text style={styles.fileName} numberOfLines={1}>
                                {selectedFile.name}
                            </Text>
                            <View style={styles.changeFileOverlay}>
                                <Text style={styles.changeFileText}>Change</Text>
                            </View>
                        </View>
                    ) : (
                        <View style={styles.uploadPlaceholder}>
                            <MaterialCommunityIcons name="cloud-upload-outline" size={32} color={COLORS.primary} />
                            <Text style={styles.uploadText}>Upload Image or PDF</Text>
                        </View>
                    )}
                </TouchableOpacity>

                <ThemedButton
                    title={loading ? 'Saving...' : 'Save Record'}
                    onPress={handleSubmit}
                    style={styles.button}
                    disabled={loading}
                />
            </ScrollView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    content: {
        padding: 20,
    },
    label: {
        fontSize: 16,
        fontFamily: FONTS.medium,
        marginBottom: 8,
        color: COLORS.text,
        marginTop: 16,
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
        color: COLORS.text,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    typeScroll: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    typeChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: COLORS.surface,
        marginRight: 8,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    typeChipActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    typeChipText: {
        color: COLORS.text,
        fontSize: 14,
        fontFamily: FONTS.medium,
    },
    typeChipTextActive: {
        color: COLORS.white,
    },
    uploadBox: {
        height: 150,
        backgroundColor: COLORS.white,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        marginBottom: 24,
    },
    uploadPlaceholder: {
        alignItems: 'center',
        gap: 8,
    },
    uploadText: {
        color: COLORS.textLight,
        fontSize: 14,
        fontFamily: FONTS.regular,
    },
    filePreview: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 10,
    },
    previewImage: {
        width: '100%',
        height: '100%',
        position: 'absolute',
        opacity: 0.5,
    },
    fileName: {
        marginTop: 8,
        fontSize: 14,
        fontFamily: FONTS.medium,
        color: COLORS.text,
        zIndex: 1,
    },
    changeFileOverlay: {
        position: 'absolute',
        bottom: 10,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    changeFileText: {
        color: COLORS.white,
        fontSize: 12,
        fontFamily: FONTS.medium,
    },
    button: {
        marginTop: 8,
        marginBottom: 40,
    },
});
