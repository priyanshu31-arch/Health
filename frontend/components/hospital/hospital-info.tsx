import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Platform, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/themed-text';
import { COLORS, SHADOWS } from '../../constants/theme';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

type NavigationProp = {
    navigate: (screen: string, params?: any) => void;
    goBack: () => void;
};

const HospitalInfoScreen = ({ navigation, hospitalData }: { navigation: NavigationProp, hospitalData?: any }) => {
    // Fallback data
    const info = {
        name: hospitalData?.name || 'Patel Orthopaedic',
        location: hospitalData?.location || 'Seattle, WA',
        rating: hospitalData?.rating || '4.6',
        about: 'Providing world-class healthcare services with state-of-the-art facilities and a team of dedicated professionals.',
        image: hospitalData?.image || require('@/assets/images/h3.png')
    };

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Premium Header */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <MaterialCommunityIcons name="chevron-left" size={28} color={COLORS.text} />
                    </TouchableOpacity>
                    <ThemedText style={styles.headerTitle}>Hospital Details</ThemedText>
                    <TouchableOpacity style={styles.favoriteButton}>
                        <MaterialCommunityIcons name="heart-outline" size={24} color={COLORS.primary} />
                    </TouchableOpacity>
                </View>

                {/* Hospital Hero Section */}
                <Animated.View entering={FadeInDown.duration(800)} style={styles.heroSection}>
                    <Image source={info.image} style={styles.heroImage} contentFit="cover" />
                    <View style={styles.heroOverlay}>
                        <LinearGradient
                            colors={['transparent', 'rgba(0,0,0,0.8)']}
                            style={styles.heroGradient}
                        >
                            <ThemedText style={styles.hospitalName}>{info.name}</ThemedText>
                            <View style={styles.locationRow}>
                                <MaterialCommunityIcons name="map-marker" size={16} color={COLORS.white} />
                                <ThemedText style={styles.locationText}>{info.location}</ThemedText>
                            </View>
                        </LinearGradient>
                    </View>
                </Animated.View>

                {/* Stats Row */}
                <View style={styles.statsContainer}>
                    <View style={styles.statBox}>
                        <ThemedText style={styles.statValue}>{info.rating}</ThemedText>
                        <ThemedText style={styles.statLabel}>Rating</ThemedText>
                    </View>
                    <View style={[styles.statBox, styles.statDivider]}>
                        <ThemedText style={styles.statValue}>24/7</ThemedText>
                        <ThemedText style={styles.statLabel}>Emergency</ThemedText>
                    </View>
                    <View style={styles.statBox}>
                        <ThemedText style={styles.statValue}>500+</ThemedText>
                        <ThemedText style={styles.statLabel}>Beds</ThemedText>
                    </View>
                </View>

                {/* About Section */}
                <View style={styles.section}>
                    <ThemedText style={styles.sectionTitle}>About Hospital</ThemedText>
                    <ThemedText style={styles.aboutText}>{info.about}</ThemedText>
                </View>

                {/* Services Section */}
                <View style={styles.section}>
                    <ThemedText style={styles.sectionTitle}>Our Services</ThemedText>
                    <View style={styles.servicesGrid}>
                        {['Cardiology', 'Orthopaedics', 'Neurology', 'Dental Care', 'Eye Care'].map(service => (
                            <View key={service} style={styles.serviceBadge}>
                                <ThemedText style={styles.serviceText}>{service}</ThemedText>
                            </View>
                        ))}
                    </View>
                </View>

                <View style={{ height: 120 }} />
            </ScrollView>

            {/* Footer Action */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.enquireButton}
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        navigation.navigate('Enquiry' as any, { hospitalId: hospitalData?.id, hospitalName: info.name });
                    }}
                >
                    <LinearGradient
                        colors={[COLORS.primary, COLORS.accent]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.buttonGradient}
                    >
                        <ThemedText style={styles.buttonText}>Book Consultation</ThemedText>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default HospitalInfoScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: Platform.OS === 'ios' ? 60 : 50,
        paddingHorizontal: 20,
        paddingBottom: 16,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.small,
    },
    favoriteButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.small,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: COLORS.text,
        backgroundColor: 'rgba(255,255,255,0.7)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    heroSection: {
        height: 350,
        width: '100%',
    },
    heroImage: {
        width: '100%',
        height: '100%',
    },
    heroOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 150,
    },
    heroGradient: {
        width: '100%',
        height: '100%',
        justifyContent: 'flex-end',
        padding: 24,
    },
    hospitalName: {
        fontSize: 28,
        fontWeight: '800',
        color: COLORS.white,
        marginBottom: 8,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    locationText: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.9)',
        fontWeight: '500',
    },
    statsContainer: {
        flexDirection: 'row',
        backgroundColor: COLORS.white,
        marginHorizontal: 20,
        marginTop: -30,
        borderRadius: 24,
        padding: 24,
        ...SHADOWS.medium,
    },
    statBox: {
        flex: 1,
        alignItems: 'center',
    },
    statDivider: {
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderColor: '#F1F5F9',
    },
    statValue: {
        fontSize: 20,
        fontWeight: '800',
        color: COLORS.primary,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: COLORS.textLight,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    section: {
        padding: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: COLORS.text,
        marginBottom: 12,
    },
    aboutText: {
        fontSize: 15,
        lineHeight: 24,
        color: '#64748B',
        fontWeight: '500',
    },
    servicesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    serviceBadge: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 14,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    serviceText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
        backgroundColor: COLORS.white,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    enquireButton: {
        height: 60,
        borderRadius: 22,
        overflow: 'hidden',
        ...SHADOWS.medium,
    },
    buttonGradient: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        color: COLORS.white,
        fontSize: 18,
        fontWeight: '800',
    },
});
