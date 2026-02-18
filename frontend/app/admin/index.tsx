import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, View, Image, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { COLORS, SHADOWS } from '../../constants/theme';
import { ThemedText } from '../../components/themed-text';
import { api } from '../config/api.config';
import { useAuth } from '../../context/AuthContext';

export default function AdminDashboard() {
    const router = useRouter();
    const { logout } = useAuth();
    const [hospital, setHospital] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHospitalData();
    }, []);

    const fetchHospitalData = async () => {
        try {
            setLoading(true);
            const data = await api.getMyHospital().catch(() => null);
            if (data && data.hospital) {
                setHospital({ ...data.hospital, beds: data.beds, ambulances: data.ambulances });
            } else {
                setHospital(null);
            }
        } catch (error) {
            console.log('No hospital found or error:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    if (!hospital) {
        return (
            <View style={styles.container}>
                <Animated.View entering={FadeInDown.duration(800)} style={styles.header}>
                    <LinearGradient
                        colors={[COLORS.primary, COLORS.accent]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={StyleSheet.absoluteFill}
                    />
                    <ThemedText style={styles.headerTitle}>Admin Dashboard</ThemedText>
                </Animated.View>

                <View style={styles.content}>
                    <Animated.View entering={FadeInUp.delay(200).duration(800)} style={styles.emptyState}>
                        <View style={styles.emptyIconContainer}>
                            <MaterialCommunityIcons name="hospital-building" size={60} color={COLORS.primary} />
                        </View>
                        <ThemedText style={styles.emptyTitle}>No Hospital Registered</ThemedText>
                        <ThemedText style={styles.emptyDesc}>Register your hospital to start managing beds and ambulances.</ThemedText>
                        <TouchableOpacity
                            style={styles.primaryButton}
                            onPress={() => router.push('/admin/register-hospital')}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={[COLORS.primary, COLORS.accent]}
                                style={styles.buttonGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                <ThemedText style={styles.buttonText}>Register Hospital</ThemedText>
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.logoutButton}
                            onPress={logout}
                        >
                            <ThemedText style={styles.logoutText}>Logout</ThemedText>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </View>
        );
    }

    const quickActions = [
        {
            title: 'Manage Beds',
            desc: 'Add, remove, or update bed availability.',
            icon: 'bed',
            color: COLORS.primary,
            bg: '#FFF1F2', // Light Red/Pink
            route: '/admin/manage-beds'
        },
        {
            title: 'Manage Ambulances',
            desc: 'Track and manage ambulance fleet.',
            icon: 'ambulance',
            color: COLORS.secondary,
            bg: '#F1F5F9', // Light Slate
            route: '/admin/manage-ambulances'
        },
        {
            title: 'Manage Bookings',
            desc: 'View and manage patient bookings.',
            icon: 'calendar-check',
            color: '#059669', // Emerald
            bg: '#ECFDF5', // Light Emerald
            route: '/admin/manage-bookings'
        },
        {
            title: 'Manage Profile',
            desc: 'Update hospital address and location.',
            icon: 'hospital-building',
            color: '#7C3AED', // Violet
            bg: '#F5F3FF', // Light Violet
            route: '/admin/profile'
        }
    ];

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <Animated.View entering={FadeInDown.duration(800)} style={styles.statsHeaderWrapper}>
                <LinearGradient
                    colors={[COLORS.primary, COLORS.accent]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.statsHeader}
                >
                    <View style={styles.hospitalInfo}>
                        <View style={styles.topRow}>
                            <View>
                                <ThemedText style={styles.welcomeText}>Welcome Admin</ThemedText>
                                <ThemedText style={styles.hospitalName}>{hospital.name}</ThemedText>
                            </View>
                            <TouchableOpacity
                                onPress={logout}
                                style={styles.headerLogoutBtn}
                            >
                                <MaterialCommunityIcons name="logout" size={20} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.statsRow}>
                        <View style={styles.statCard}>
                            <View style={styles.statIconCircle}>
                                <MaterialCommunityIcons name="bed-empty" size={24} color={COLORS.white} />
                            </View>
                            <View>
                                <ThemedText style={styles.statNumber}>{hospital.beds?.length || 0}</ThemedText>
                                <ThemedText style={styles.statLabel}>Total Beds</ThemedText>
                            </View>
                        </View>
                        <View style={styles.statLine} />
                        <View style={styles.statCard}>
                            <View style={styles.statIconCircle}>
                                <MaterialCommunityIcons name="ambulance" size={24} color={COLORS.white} />
                            </View>
                            <View>
                                <ThemedText style={styles.statNumber}>{hospital.ambulances?.length || 0}</ThemedText>
                                <ThemedText style={styles.statLabel}>Ambulances</ThemedText>
                            </View>
                        </View>
                    </View>
                </LinearGradient>
            </Animated.View>

            <View style={styles.actionGrid}>
                <ThemedText style={styles.sectionTitle}>Quick Actions</ThemedText>

                {quickActions.map((action, index) => (
                    <Animated.View
                        key={index}
                        entering={FadeInUp.delay(300 + (index * 100)).duration(600)}
                    >
                        <TouchableOpacity
                            style={styles.actionCard}
                            onPress={() => router.push(action.route as any)}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.iconBox, { backgroundColor: action.bg }]}>
                                <MaterialCommunityIcons name={action.icon as any} size={28} color={action.color} />
                            </View>
                            <View style={styles.actionInfo}>
                                <ThemedText style={styles.actionTitle}>{action.title}</ThemedText>
                                <ThemedText style={styles.actionDesc}>{action.desc}</ThemedText>
                            </View>
                            <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.textLight} />
                        </TouchableOpacity>
                    </Animated.View>
                ))}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        overflow: 'hidden',
        ...SHADOWS.medium,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginTop: 20,
    },
    content: {
        padding: 24,
        flex: 1,
    },
    emptyState: {
        backgroundColor: COLORS.white,
        borderRadius: 24,
        padding: 30,
        alignItems: 'center',
        ...SHADOWS.medium,
    },
    emptyIconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#FFF1F2',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 8,
    },
    emptyDesc: {
        fontSize: 15,
        color: COLORS.textLight,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
    },
    primaryButton: {
        width: '100%',
        borderRadius: 16,
        overflow: 'hidden',
        ...SHADOWS.small,
    },
    buttonGradient: {
        paddingVertical: 16,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    logoutButton: {
        marginTop: 16,
        paddingVertical: 12,
    },
    logoutText: {
        color: COLORS.error,
        fontWeight: '600',
        fontSize: 15,
    },

    // Dashboard Styles
    statsHeaderWrapper: {
        marginBottom: 10,
        ...SHADOWS.large,
    },
    statsHeader: {
        paddingTop: Platform.OS === 'ios' ? 60 : 50,
        paddingBottom: 40,
        paddingHorizontal: 24,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },
    hospitalInfo: {
        marginBottom: 30,
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    welcomeText: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 4,
    },
    hospitalName: {
        color: '#fff',
        fontSize: 26,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    headerLogoutBtn: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        padding: 10,
        borderRadius: 12,
        backdropFilter: 'blur(10px)',
    },
    statsRow: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    statCard: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    statLine: {
        width: 1,
        height: '80%',
        backgroundColor: 'rgba(255,255,255,0.3)',
        marginHorizontal: 15,
        alignSelf: 'center',
    },
    statIconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    statNumber: {
        color: '#fff',
        fontSize: 22,
        fontWeight: 'bold',
    },
    statLabel: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 12,
        marginTop: 2,
    },

    // Actions
    actionGrid: {
        padding: 24,
        gap: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: COLORS.text,
        marginBottom: 8,
    },
    actionCard: {
        backgroundColor: COLORS.white,
        padding: 16,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        ...SHADOWS.small,
    },
    iconBox: {
        width: 50,
        height: 50,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionInfo: {
        flex: 1,
    },
    actionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 4,
    },
    actionDesc: {
        fontSize: 13,
        color: COLORS.textLight,
        lineHeight: 18,
    },
});
