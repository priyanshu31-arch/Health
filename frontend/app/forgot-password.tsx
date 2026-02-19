import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from './config/api.config';
import { COLORS, SHADOWS, FONTS } from '../constants/theme';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import StatusModal from '@/components/StatusModal';
import { ThemedButton } from '@/components/ui/ThemedButton';

type Step = 'EMAIL' | 'OTP' | 'RESET';

export default function ForgotPasswordScreen() {
    const router = useRouter();
    const [step, setStep] = useState<Step>('EMAIL');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
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

    const handleRequestOTP = async () => {
        if (!email.trim() || !email.includes('@')) {
            showStatus('error', 'Please enter a valid email address.');
            return;
        }

        setIsLoading(true);
        console.log('📨 Requesting OTP for:', email);
        try {
            const res = await api.forgotPassword(email);
            console.log('✅ OTP API Response:', res);

            showStatus('success', res.msg);
            setStep('OTP');
        } catch (error: any) {
            console.error('❌ OTP Request Failed:', error);
            showStatus('error', error.message || 'Failed to send OTP');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOTP = async () => {
        if (otp.length !== 6) {
            Alert.alert('Invalid OTP', 'Please enter the 6-digit OTP sent to your email.');
            return;
        }

        setIsLoading(true);
        console.log('🔢 Verifying OTP:', otp, 'for', email);
        try {
            const res = await api.verifyOTP(email, otp);
            console.log('✅ OTP Verification Success:', res);
            setStep('RESET');
        } catch (error: any) {
            console.error('❌ OTP Verification Failed:', error);
            showStatus('error', error.message || 'Invalid or expired OTP');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (newPassword.length < 6 || newPassword.length > 16) {
            showStatus('error', 'Password must be between 6 and 16 characters.');
            return;
        }

        if (newPassword !== confirmPassword) {
            showStatus('error', 'Passwords do not match.');
            return;
        }

        setIsLoading(true);
        try {
            await api.resetPassword({ email, otp, newPassword });
            showStatus('success', 'Your password has been reset successfully.', () => {
                router.push('/login');
            });
        } catch (error: any) {
            console.error('❌ Reset Password Failed:', error);
            showStatus('error', error.message || 'Failed to reset password');
        } finally {
            setIsLoading(false);
        }
    };

    const renderStep = () => {
        switch (step) {
            case 'EMAIL':
                return (
                    <Animated.View entering={FadeInDown.duration(600)} style={styles.stepContainer}>
                        <MaterialCommunityIcons name="email-lock" size={80} color={COLORS.primary} style={styles.icon} />
                        <Text style={styles.stepTitle}>Forgot Password?</Text>
                        <Text style={styles.stepSubtitle}>Enter your registered email to receive a 6-digit verification code.</Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Email Address"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />

                        <ThemedButton
                            title="Send OTP"
                            onPress={handleRequestOTP}
                            isLoading={isLoading}
                            disabled={isLoading}
                            style={{ width: '100%', marginTop: 10 }}
                        />
                    </Animated.View>
                );
            case 'OTP':
                return (
                    <Animated.View entering={FadeInDown.duration(600)} style={styles.stepContainer}>
                        <MaterialCommunityIcons name="shield-check" size={80} color={COLORS.primary} style={styles.icon} />
                        <Text style={styles.stepTitle}>Verify OTP</Text>
                        <Text style={styles.stepSubtitle}>A 6-digit code has been sent to {email}.</Text>

                        <TextInput
                            placeholder="Enter 6-digit OTP"
                            value={otp}
                            onChangeText={setOtp}
                            keyboardType="number-pad"
                            maxLength={6}
                            style={[styles.input, { letterSpacing: 8, textAlign: 'center', fontSize: 24, fontWeight: 'bold' }]}
                        />

                        <ThemedButton
                            title="Verify Code"
                            onPress={handleVerifyOTP}
                            isLoading={isLoading}
                            disabled={isLoading}
                            style={{ width: '100%', marginTop: 10 }}
                        />

                        <TouchableOpacity onPress={handleRequestOTP} style={styles.resendContainer}>
                            <Text style={styles.resendText}>Didn't receive code? <Text style={styles.resendLink}>Resend</Text></Text>
                        </TouchableOpacity>
                    </Animated.View>
                );
            case 'RESET':
                return (
                    <Animated.View entering={FadeInDown.duration(600)} style={styles.stepContainer}>
                        <MaterialCommunityIcons name="lock-reset" size={80} color={COLORS.primary} style={styles.icon} />
                        <Text style={styles.stepTitle}>Reset Password</Text>
                        <Text style={styles.stepSubtitle}>Create a new secure password for your account.</Text>

                        <TextInput
                            style={styles.input}
                            placeholder="New Password (6-16 chars)"
                            value={newPassword}
                            onChangeText={setNewPassword}
                            secureTextEntry
                            maxLength={16}
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="Confirm New Password"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry
                            maxLength={16}
                        />

                        <ThemedButton
                            title="Reset Password"
                            onPress={handleResetPassword}
                            isLoading={isLoading}
                            disabled={isLoading}
                            style={{ width: '100%', marginTop: 10 }}
                        />
                    </Animated.View>
                );
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient colors={[COLORS.primary + '10', COLORS.white]} style={styles.gradient}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.text} />
                    </TouchableOpacity>
                </View>

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <ScrollView contentContainerStyle={styles.scrollContent}>
                        {renderStep()}
                    </ScrollView>
                </KeyboardAvoidingView>
            </LinearGradient>

            <StatusModal
                visible={modalVisible}
                type={modalType}
                message={modalMessage}
                onClose={() => setModalVisible(false)}
                onAction={modalAction}
                actionText={modalType === 'success' && step === 'RESET' ? 'Login Now' : 'OK'}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    gradient: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.small,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 30,
    },
    stepContainer: {
        alignItems: 'center',
        backgroundColor: COLORS.white,
        borderRadius: 30,
        padding: 30,
        ...SHADOWS.medium,
    },
    icon: {
        marginBottom: 20,
    },
    stepTitle: {
        fontSize: 24,
        fontFamily: FONTS.bold,
        color: COLORS.text,
        marginBottom: 10,
    },
    stepSubtitle: {
        fontSize: 14,
        color: COLORS.textLight,
        textAlign: 'center',
        marginBottom: 30,
        lineHeight: 20,
        fontFamily: FONTS.regular,
    },
    input: {
        width: '100%',
        height: 55,
        backgroundColor: COLORS.background,
        borderRadius: 15,
        paddingHorizontal: 20,
        fontSize: 16,
        fontFamily: FONTS.regular,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    button: {
        width: '100%',
        height: 55,
        backgroundColor: COLORS.primary,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        ...SHADOWS.small,
    },
    buttonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: 'bold',
    },
    resendContainer: {
        marginTop: 20,
    },
    resendText: {
        fontSize: 14,
        color: COLORS.textLight,
        fontFamily: FONTS.regular,
    },
    resendLink: {
        color: COLORS.primary,
        fontFamily: FONTS.bold,
    },
});
