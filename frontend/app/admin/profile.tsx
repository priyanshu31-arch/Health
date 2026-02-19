import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Platform, Image } from 'react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
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
    const [photo, setPhoto] = useState('');
    const [newImage, setNewImage] = useState<any>(null);
    const [locationLoading, setLocationLoading] = useState(false);

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
                setAddress(data.hospital.address || '');
                setLatitude(data.hospital.latitude ? data.hospital.latitude.toString() : '');
                setLongitude(data.hospital.longitude ? data.hospital.longitude.toString() : '');
                setBio(data.hospital.bio || '');
                setPhoto(data.hospital.photo || '');
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to fetch hospital details');
        } finally {
            setLoading(false);
        }
    };

    const handleUseCurrentLocation = async () => {
        try {
            setLocationLoading(true);
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                if (Platform.OS === 'web') alert('Permission to access location was denied');
                else Alert.alert('Permission Denied', 'Permission to access location was denied');
                return;
            }

            const location = await Location.getCurrentPositionAsync({});
            const { latitude, longitude } = location.coords;

            setLatitude(latitude.toString());
            setLongitude(longitude.toString());

            // Reverse Geocode
            const reverseGeocode = await Location.reverseGeocodeAsync({ latitude, longitude });
            if (reverseGeocode.length > 0) {
                const addr = reverseGeocode[0];
                const formattedAddress = `${addr.name || ''} ${addr.street || ''}, ${addr.city || ''}, ${addr.region || ''} ${addr.postalCode || ''}`.trim().replace(/\s+/g, ' ');
                setAddress(formattedAddress);
            }

            if (Platform.OS === 'web') alert('Location updated!');
            else Alert.alert('Success', 'Location, Coordinates and Address Updated!');

        } catch (error) {
            console.error(error);
            if (Platform.OS === 'web') alert('Failed to fetch location');
            else Alert.alert('Error', 'Failed to fetch location');
        } finally {
            setLocationLoading(false);
        }
    };

    const pickImage = async () => {
        // No permissions request is necessary for launching the image library
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.5,
        });

        if (!result.canceled) {
            setNewImage(result.assets[0]);
            setPhoto(result.assets[0].uri);
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
            let photoUrl = photo;

            if (newImage) {
                // Upload new image
                const formData = new FormData();
                if (Platform.OS === 'web') {
                    // For web, we need to convert the URI to a Blob/File
                    const response = await fetch(newImage.uri);
                    const blob = await response.blob();
                    formData.append('image', blob, 'profile.jpg');
                } else {
                    // For native
                    formData.append('image', {
                        uri: newImage.uri,
                        type: 'image/jpeg',
                        name: 'profile.jpg',
                    } as any);
                }

                const uploadResponse = await api.uploadImage(formData);
                if (uploadResponse && uploadResponse.url) {
                    photoUrl = uploadResponse.url;
                }
            }

            const updates = {
                name,
                address,
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude),
                bio,
                photo: photoUrl
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
                    {/* Image Picker */}
                    <View style={styles.imageContainer}>
                        <TouchableOpacity onPress={pickImage}>
                            {photo ? (
                                <Image source={{ uri: photo }} style={styles.profileImage} />
                            ) : (
                                <View style={styles.placeholderImage}>
                                    <Ionicons name="camera" size={40} color={COLORS.textLight} />
                                    <Text style={styles.uploadText}>Upload Photo</Text>
                                </View>
                            )}
                            <View style={styles.editIcon}>
                                <Ionicons name="pencil" size={16} color="#fff" />
                            </View>
                        </TouchableOpacity>
                    </View>

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

                    <TouchableOpacity
                        style={styles.locationBtn}
                        onPress={handleUseCurrentLocation}
                        disabled={locationLoading}
                    >
                        {locationLoading ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <>
                                <Ionicons name="location" size={20} color="#fff" />
                                <ThemedText style={styles.locationBtnText}>Use Current Location</ThemedText>
                            </>
                        )}
                    </TouchableOpacity>

                    <View style={styles.row}>
                        <View style={[styles.inputGroup, { flex: 1 }]}>
                            <ThemedText style={styles.label}>Latitude</ThemedText>
                            <TextInput
                                style={styles.input}
                                value={latitude}
                                onChangeText={setLatitude}
                                placeholder="e.g. 30.7333"
                                keyboardType="numeric"
                            />
                        </View>
                        <View style={[styles.inputGroup, { flex: 1 }]}>
                            <ThemedText style={styles.label}>Longitude</ThemedText>
                            <TextInput
                                style={styles.input}
                                value={longitude}
                                onChangeText={setLongitude}
                                placeholder="e.g. 76.7794"
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
    imageContainer: {
        alignItems: 'center',
        marginBottom: 10,
    },
    profileImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 2,
        borderColor: COLORS.primary,
    },
    placeholderImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#cbd5e1',
        borderStyle: 'dashed',
    },
    uploadText: {
        fontSize: 10,
        color: COLORS.textLight,
        marginTop: 4,
    },
    editIcon: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: COLORS.primary,
        padding: 6,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#fff',
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
    },
    locationBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.secondary, // Blue/Gray
        padding: 12,
        borderRadius: 12,
        marginVertical: 8,
        gap: 8
    },
    locationBtnText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14
    }
});
