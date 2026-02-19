import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Switch, Alert, Platform } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { ThemedButton } from './ui/ThemedButton';
import { COLORS, SHADOWS, FONTS } from '@/constants/theme';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface AuthFormProps {
    type: 'login' | 'signup';
    onSubmit: (data: any) => void;
    isLoading: boolean;
    onToggle: () => void;
}

export default function AuthForm({ type, onSubmit, isLoading, onToggle }: AuthFormProps) {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [isHospital, setIsHospital] = useState(false);
    const [hospitalName, setHospitalName] = useState('');
    const [profileImageUri, setProfileImageUri] = useState<string | null>(null);

    const pickImage = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                if (Platform.OS === 'web') {
                    // Browsers usually don't need explicit permission here, but good to check status
                } else {
                    Alert.alert('Permission needed', 'Sorry, we need camera roll permissions to select a photo.');
                    return;
                }
            }

            let result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.6, // Balanced quality
            });

            if (!result.canceled) {
                setProfileImageUri(result.assets[0].uri);
            }
        } catch (error) {
            console.error('Error picking image:', error);
            Alert.alert('Error', 'Failed to open image library');
        }
    };

    const handleRemoveImage = () => {
        setProfileImageUri(null);
    };

    const handleSubmit = () => {
        // Validation logic
        if (type === 'signup') {
            if (!name.trim()) {
                Alert.alert('Check Input', 'Please enter your full name.');
                return;
            }
            if (isHospital && !hospitalName.trim()) {
                Alert.alert('Check Input', 'Please enter the hospital name.');
                return;
            }
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email.trim() || !emailRegex.test(email)) {
            Alert.alert('Invalid Email', 'Please enter a valid email address.');
            return;
        }

        // Password validation
        if (password.length < 6) {
            Alert.alert('Weak Password', 'Password must be at least 6 characters long.');
            return;
        }

        onSubmit({
            email,
            password,
            name,
            hospitalName: isHospital ? hospitalName : undefined,
            role: isHospital ? 'admin' : 'user',
            profileImageUri
        });
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{type === 'login' ? 'Welcome Back' : 'Create Account'}</Text>

            {type === 'signup' && (
                <>
                    {/* Profile Picture Upload Section */}
                    <View style={styles.profileUploadSection}>
                        <View style={styles.avatarWrapper}>
                            <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
                                {profileImageUri ? (
                                    <Image source={{ uri: profileImageUri }} style={styles.avatar} contentFit="cover" />
                                ) : (
                                    <View style={styles.avatarPlaceholder}>
                                        <MaterialCommunityIcons name="camera-outline" size={32} color={COLORS.primary} />
                                    </View>
                                )}
                            </TouchableOpacity>
                            {profileImageUri && (
                                <TouchableOpacity
                                    style={styles.removeImageBtn}
                                    onPress={handleRemoveImage}
                                >
                                    <MaterialCommunityIcons name="close-circle" size={22} color={COLORS.error} />
                                </TouchableOpacity>
                            )}
                        </View>
                        <Text style={styles.profileLabel}>{profileImageUri ? 'Photo Selected' : 'Tap to set Profile Picture'}</Text>
                    </View>

                    <View style={styles.switchContainer}>
                        <Text style={styles.switchLabel}>Register as Hospital?</Text>
                        <Switch
                            trackColor={{ false: "#767577", true: COLORS.primary + '40' }}
                            thumbColor={isHospital ? COLORS.primary : "#f4f3f4"}
                            onValueChange={setIsHospital}
                            value={isHospital}
                        />
                    </View>

                    <TextInput
                        style={styles.input}
                        placeholder={isHospital ? "Admin Name" : "Full Name"}
                        value={name}
                        onChangeText={(text) => {
                            const lettersOnly = text.replace(/[^A-Za-z\s]/g, '');
                            setName(lettersOnly);
                        }}
                        autoCapitalize="words"
                    />

                    {isHospital && (
                        <TextInput
                            style={styles.input}
                            placeholder="Hospital Name"
                            value={hospitalName}
                            onChangeText={(text) => {
                                const filtered = text.replace(/[0-9]/g, '');
                                setHospitalName(filtered);
                            }}
                            autoCapitalize="words"
                        />
                    )}
                </>
            )}

            <TextInput
                style={styles.input}
                placeholder="Email Address"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
            />

            <TextInput
                style={styles.input}
                placeholder="Password"
                value={password}
                onChangeText={(text) => {
                    if (text.length <= 16) {
                        setPassword(text);
                    } else {
                        Alert.alert('Limit Reached', 'Password cannot exceed 16 characters');
                    }
                }}
                secureTextEntry
                maxLength={16}
            />

            {type === 'login' && (
                <TouchableOpacity
                    onPress={() => router.push('/forgot-password')}
                    style={styles.forgotPasswordContainer}
                >
                    <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </TouchableOpacity>
            )}

            <ThemedButton
                title={type === 'login' ? 'Login' : (isHospital ? 'Register Hospital' : 'Sign Up')}
                onPress={handleSubmit}
                isLoading={isLoading}
                variant={isHospital && type === 'signup' ? 'danger' : 'primary'}
                style={{ marginTop: 10 }}
            />

            <TouchableOpacity onPress={onToggle} style={styles.toggleContainer}>
                <Text style={styles.toggleText}>
                    {type === 'login'
                        ? "Don't have an account? Sign Up"
                        : "Already have an account? Login"}
                </Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        padding: 20,
        backgroundColor: '#fff',
        borderRadius: 12,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    title: {
        fontSize: 24,
        fontFamily: FONTS.semiBold,
        marginBottom: 20,
        textAlign: 'center',
        color: '#333',
    },
    profileUploadSection: {
        alignItems: 'center',
        marginBottom: 20,
    },
    avatarWrapper: {
        position: 'relative',
        width: 80,
        height: 80,
    },
    avatarContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: COLORS.background,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
        overflow: 'hidden',
    },
    removeImageBtn: {
        position: 'absolute',
        top: -5,
        right: -5,
        backgroundColor: COLORS.white,
        borderRadius: 11,
        zIndex: 1,
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
    avatarPlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileLabel: {
        marginTop: 8,
        fontSize: 12,
        color: COLORS.textLight,
        fontFamily: FONTS.medium,
    },
    input: {
        height: 52,
        borderColor: '#ddd',
        borderWidth: 1,
        borderRadius: 12,
        marginBottom: 15,
        paddingHorizontal: 15,
        fontSize: 16,
        fontFamily: FONTS.regular,
        backgroundColor: '#f9f9f9',
    },
    toggleContainer: {
        marginTop: 20,
        alignItems: 'center',
    },
    toggleText: {
        color: COLORS.primary,
        fontSize: 14,
        fontFamily: FONTS.medium,
    },
    switchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    switchLabel: {
        fontSize: 16,
        color: '#333',
        fontFamily: FONTS.medium,
    },
    forgotPasswordContainer: {
        alignSelf: 'flex-end',
        marginBottom: 15,
        marginTop: -5,
    },
    forgotPasswordText: {
        color: COLORS.primary,
        fontSize: 14,
        fontFamily: FONTS.medium,
    },
});

