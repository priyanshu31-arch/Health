import React, { useState } from 'react';
import { View, StyleSheet, Text, SafeAreaView, KeyboardAvoidingView, Platform, ImageBackground, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import AuthForm from '@/components/AuthForm';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/app/config/api.config';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { COLORS, FONTS } from '@/constants/theme';
import StatusModal from '@/components/StatusModal';

export default function SignupScreen() {
    const router = useRouter();
    const { login } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    // Status Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [modalType, setModalType] = useState<'success' | 'error'>('success');
    const [modalMessage, setModalMessage] = useState('');
    const [modalAction, setModalAction] = useState<(() => void) | undefined>(undefined);

    const showStatus = (type: 'success' | 'error', message: string, action?: () => void) => {
        setModalType(type);
        setModalMessage(message);
        setModalAction(() => action);
        setModalVisible(true);
    };

    const handleSignup = async (data: any) => {
        setIsLoading(true);
        try {
            let profilePhoto = '';

            // 1. Upload profile image if selected
            if (data.profileImageUri) {
                const formData = new FormData();
                if (Platform.OS === 'web') {
                    const response = await fetch(data.profileImageUri);
                    const blob = await response.blob();
                    formData.append('image', blob, 'profile.jpg');
                } else {
                    // @ts-ignore
                    formData.append('image', {
                        uri: data.profileImageUri,
                        name: 'profile.jpg',
                        type: 'image/jpeg',
                    });
                }

                try {
                    const uploadRes = await api.uploadFile(formData);
                    profilePhoto = uploadRes.url;
                } catch (uploadError: any) {
                    console.error('Image Upload Error:', uploadError);

                    // Ask user if they want to continue without image
                    const proceed = await new Promise((resolve) => {
                        Alert.alert(
                            'Upload Failed',
                            `We couldn't upload your profile picture: ${uploadError.message}. Create account anyway?`,
                            [
                                { text: 'Stop', onPress: () => resolve(false), style: 'cancel' },
                                { text: 'Continue without photo', onPress: () => resolve(true) }
                            ]
                        );
                    });

                    if (!proceed) return;
                }
            }

            // 2. Register user
            const res = await api.signup({
                name: data.name,
                email: data.email,
                password: data.password,
                hospitalName: data.hospitalName,
                profilePhoto // Pass the uploaded photo URL
            });

            if (res.token) {
                showStatus('success', 'Account created successfully', async () => {
                    await login(res.token, res.user);
                });
            }
        } catch (error: any) {
            console.error('Signup Error:', error);
            const msg = error.message || 'Signup failed';
            showStatus('error', msg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ImageBackground
                source={require('../assets/images/medical_auth_bg.png')}
                style={styles.backgroundImage}
                resizeMode="cover"
            >
                <LinearGradient
                    colors={['rgba(8, 145, 178, 0.7)', 'rgba(14, 116, 144, 0.85)', 'rgba(15, 23, 42, 0.9)']}
                    style={styles.gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >

                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={styles.keyboardView}
                    >
                        <View style={styles.content}>
                            <Animated.View
                                entering={FadeInDown.delay(200).duration(1000).springify()}
                                style={styles.header}
                            >
                                <Text style={styles.brand}>HealthBridge</Text>
                                <Text style={styles.subtitle}>Join Our Community</Text>
                            </Animated.View>

                            <Animated.View
                                entering={FadeInUp.delay(400).duration(1000).springify()}
                                style={styles.card}
                            >
                                <Text style={styles.welcomeText}>Create Account</Text>
                                <AuthForm
                                    type="signup"
                                    onSubmit={handleSignup}
                                    isLoading={isLoading}
                                    onToggle={() => router.push('/login')}
                                />
                            </Animated.View>
                        </View>
                    </KeyboardAvoidingView>
                </LinearGradient>
            </ImageBackground>

            <StatusModal
                visible={modalVisible}
                type={modalType}
                message={modalMessage}
                onClose={() => setModalVisible(false)}
                onAction={modalAction}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    backgroundImage: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    gradient: {
        flex: 1,
        paddingHorizontal: 20,
    },
    keyboardView: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    brand: {
        fontSize: 42,
        fontFamily: FONTS.semiBold,
        color: '#ffffff',
        marginBottom: 10,
        letterSpacing: 1,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    subtitle: {
        fontSize: 18,
        color: '#e0e0e0',
        fontFamily: FONTS.medium,
    },
    card: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 20,
        padding: 30,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 10,
        },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 15,
    },
    welcomeText: {
        fontSize: 24,
        fontWeight: '600',
        color: '#333',
        marginBottom: 20,
        textAlign: 'center',
    },
});
