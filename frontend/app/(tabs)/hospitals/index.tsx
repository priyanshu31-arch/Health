import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    ImageSourcePropType,
    Modal,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
    Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../../config/api.config';
import { ThemedText } from '@/components/themed-text';
import { COLORS, SHADOWS } from '../../../constants/theme';
import Animated, { FadeInDown, FadeInUp, withSpring, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

// Verified local hospital images
const hospitalImages = [
    require('@/assets/images/h5.png'),
    require('@/assets/images/hospital1.png'),
    require('@/assets/images/h4.png'),
    require('@/assets/images/hospital2.png'),
    require('@/assets/images/h5.png'),
];

interface Hospital {
    _id: string;
    name: string;
    bio?: string;
    rating?: number;
    photo?: string;
}

export default function HospitalScreen() {
    const router = useRouter();
    const [filterVisible, setFilterVisible] = useState(false);
    const [hospitals, setHospitals] = useState<Hospital[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeSpeciality, setActiveSpeciality] = useState<string | null>(null);
    const [activeFilters, setActiveFilters] = useState<string[]>([]);

    // Speciality categories
    const categories = [
        { name: 'Neuro', icon: 'brain', color: '#EFF6FF', iconColor: '#3B82F6' },
        { name: 'Cardio', icon: 'heart-pulse', color: '#FEF2F2', iconColor: '#EF4444' },
        { name: 'Dental', icon: 'tooth', color: '#F0FDF4', iconColor: '#22C55E' },
        { name: 'Ortho', icon: 'bone', color: '#FFFBEB', iconColor: '#F59E0B' },
        { name: 'Eye', icon: 'eye', color: '#F5F3FF', iconColor: '#8B5CF6' },
    ];

    // Fetch hospitals from API
    useEffect(() => {
        const fetchHospitals = async () => {
            try {
                setLoading(true);
                const data = await api.getHospitals();
                setHospitals(data);
                setError(null);
            } catch (err: any) {
                console.error('Failed to fetch hospitals:', err);
                setError('Failed to load hospitals');
            } finally {
                setLoading(false);
            }
        };

        fetchHospitals();
    }, []);

    const toggleFilter = (label: string) => {
        Haptics.selectionAsync();
        setActiveFilters(prev =>
            prev.includes(label) ? prev.filter(f => f !== label) : [...prev, label]
        );
    };

    const handleCategoryPress = (name: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setActiveSpeciality(activeSpeciality === name ? null : name);
    };

    // Filter hospitals based on search, speciality, and extra filters
    const filteredHospitals = hospitals.filter((h) => {
        const matchesSearch = h.name.toLowerCase().includes(searchQuery.toLowerCase());

        // Simulate speciality filtering (since bio often contains specialities in the mock data)
        const matchesSpeciality = activeSpeciality
            ? h.bio?.toLowerCase().includes(activeSpeciality.toLowerCase()) ||
            h.name.toLowerCase().includes(activeSpeciality.toLowerCase())
            : true;

        // Simulate extra filters (mock logic)
        const matchesExtraFilters = activeFilters.length > 0
            ? true // In a real app, you'd check specific flags on the hospital object
            : true;

        return matchesSearch && matchesSpeciality && matchesExtraFilters;
    });

    return (
        <View style={styles.container}>
            {/* Premium Header */}
            <Animated.View entering={FadeInUp.duration(600)} style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <MaterialCommunityIcons name="chevron-left" size={28} color={COLORS.text} />
                </TouchableOpacity>
                <ThemedText style={styles.headerTitle}>Hospitals</ThemedText>
                <TouchableOpacity style={styles.filterButton} onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setFilterVisible(true);
                }}>
                    <View style={activeFilters.length > 0 ? styles.filterBadge : null}>
                        <MaterialCommunityIcons name="tune-variant" size={22} color={COLORS.primary} />
                    </View>
                </TouchableOpacity>
            </Animated.View>

            <ScrollView
                style={styles.scrollContainer}
                contentContainerStyle={{ paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Search */}
                <View style={styles.searchBox}>
                    <MaterialCommunityIcons name="magnify" size={22} color={COLORS.textLight} />
                    <TextInput
                        placeholder="Search hospitals..."
                        placeholderTextColor={COLORS.textLight}
                        style={styles.searchInput}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                {/* Categories */}
                <ThemedText style={styles.sectionTitle}>Medical Specialities</ThemedText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
                    {categories.map((item, index) => (
                        <Animated.View
                            key={item.name}
                            entering={FadeInDown.delay(200 + index * 50).duration(600)}
                            style={styles.categoryItem}
                        >
                            <TouchableOpacity
                                onPress={() => handleCategoryPress(item.name)}
                                activeOpacity={0.7}
                            >
                                <View style={[
                                    styles.categoryIcon,
                                    { backgroundColor: activeSpeciality === item.name ? COLORS.primary : item.color }
                                ]}>
                                    <MaterialCommunityIcons
                                        name={item.icon as any}
                                        size={24}
                                        color={activeSpeciality === item.name ? COLORS.white : item.iconColor}
                                    />
                                </View>
                                <ThemedText style={[
                                    styles.categoryText,
                                    activeSpeciality === item.name && { color: COLORS.primary }
                                ]}>{item.name}</ThemedText>
                            </TouchableOpacity>
                        </Animated.View>
                    ))}
                </ScrollView>

                {/* Toggle between Doctor/Hospital */}
                <View style={styles.toggleContainer}>
                    <TouchableOpacity style={styles.toggleBtn} onPress={() => router.push('/doctor')}>
                        <ThemedText style={styles.toggleText}>Doctors</ThemedText>
                    </TouchableOpacity>
                    <View style={styles.toggleActiveWrapper}>
                        <LinearGradient
                            colors={[COLORS.primary, COLORS.accent]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.toggleActiveGradient}
                        >
                            <ThemedText style={styles.toggleTextActive}>Hospitals</ThemedText>
                        </LinearGradient>
                    </View>
                </View>

                {/* Hospital List */}
                <View style={styles.listHeader}>
                    <ThemedText style={styles.sectionTitle}>
                        {activeSpeciality ? `${activeSpeciality} Specialists` : 'Top Rated Hospitals'}
                    </ThemedText>
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color={COLORS.primary} style={{ marginVertical: 40 }} />
                ) : error ? (
                    <ThemedText style={styles.errorText}>{error}</ThemedText>
                ) : filteredHospitals.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <MaterialCommunityIcons name="hospital-marker" size={60} color={COLORS.surface} />
                        <ThemedText style={styles.emptyText}>No hospitals found matching your criteria</ThemedText>
                        <TouchableOpacity
                            onPress={() => {
                                setActiveSpeciality(null);
                                setActiveFilters([]);
                                setSearchQuery('');
                            }}
                            style={styles.resetSearchBtn}
                        >
                            <ThemedText style={styles.resetSearchText}>Reset all filters</ThemedText>
                        </TouchableOpacity>
                    </View>
                ) : (
                    filteredHospitals.map((hospital, index) => (
                        <HospitalListItem
                            key={hospital._id}
                            hospitalId={hospital._id}
                            name={hospital.name}
                            location={hospital.bio || 'Location not available'}
                            rating={hospital.rating?.toString() || '4.5'}
                            image={hospitalImages[index % hospitalImages.length]}
                        />
                    ))
                )}
            </ScrollView>

            {/* FILTER MODAL */}
            <Modal transparent animationType="fade" visible={filterVisible}>
                <View style={styles.modalOverlay}>
                    <View style={styles.filterModal}>
                        <View style={styles.modalHeader}>
                            <ThemedText style={styles.filterTitle}>Filter Search</ThemedText>
                            <TouchableOpacity onPress={() => setFilterVisible(false)}>
                                <MaterialCommunityIcons name="close" size={24} color={COLORS.text} />
                            </TouchableOpacity>
                        </View>

                        {[
                            { label: '24/7 Emergency', icon: 'clock-outline' },
                            { label: 'Nearest to Me', icon: 'map-marker-outline' },
                            { label: 'Multi-Speciality', icon: 'hospital-building' },
                            { label: 'Highly Reviewed', icon: 'star-outline' },
                            { label: 'Affordable Care', icon: 'currency-usd' },
                        ].map((item) => (
                            <TouchableOpacity
                                key={item.label}
                                style={styles.filterItem}
                                onPress={() => toggleFilter(item.label)}
                            >
                                <MaterialCommunityIcons
                                    name={item.icon as any}
                                    size={22}
                                    color={activeFilters.includes(item.label) ? COLORS.primary : COLORS.textLight}
                                />
                                <ThemedText style={[
                                    styles.filterText,
                                    activeFilters.includes(item.label) && { color: COLORS.primary }
                                ]}>{item.label}</ThemedText>
                                <View style={[
                                    styles.checkbox,
                                    activeFilters.includes(item.label) && styles.checkboxActive
                                ]}>
                                    {activeFilters.includes(item.label) && (
                                        <MaterialCommunityIcons name="check" size={14} color={COLORS.white} />
                                    )}
                                </View>
                            </TouchableOpacity>
                        ))}

                        <View style={styles.filterActions}>
                            <TouchableOpacity
                                style={styles.clearBtn}
                                onPress={() => {
                                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                                    setActiveFilters([]);
                                }}
                            >
                                <ThemedText style={{ color: COLORS.primary, fontWeight: '700' }}>Reset</ThemedText>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.applyBtn}
                                onPress={() => {
                                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                                    setFilterVisible(false);
                                }}
                            >
                                <LinearGradient
                                    colors={[COLORS.primary, COLORS.accent]}
                                    style={styles.applyGradient}
                                >
                                    <ThemedText style={{ color: '#fff', fontWeight: '700' }}>Apply Filters</ThemedText>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

/* Hospital List Item Component */
function HospitalListItem({
    hospitalId,
    name,
    location,
    rating,
    image,
}: {
    hospitalId: string;
    name: string;
    location: string;
    rating: string;
    image: ImageSourcePropType;
}) {
    const router = useRouter();
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const handlePress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push({
            pathname: '/hospitals/[id]',
            params: { id: hospitalId, name, location, rating }
        } as any);
    };

    return (
        <Animated.View entering={FadeInDown.duration(600)}>
            <TouchableOpacity
                style={[styles.card, animatedStyle]}
                activeOpacity={0.9}
                onPressIn={() => (scale.value = withSpring(0.97))}
                onPressOut={() => (scale.value = withSpring(1))}
                onPress={handlePress}
            >
                <Image
                    source={image}
                    style={styles.cardImage}
                    contentFit="cover"
                />

                <View style={styles.cardContent}>
                    <ThemedText style={styles.cardTitle} numberOfLines={1}>{name}</ThemedText>
                    <View style={styles.locationRow}>
                        <MaterialCommunityIcons name="map-marker" size={14} color={COLORS.textLight} />
                        <ThemedText style={styles.cardSub} numberOfLines={1}>{location}</ThemedText>
                    </View>
                    <View style={styles.ratingRow}>
                        <MaterialCommunityIcons name="star" size={16} color="#FFD700" />
                        <ThemedText style={styles.ratingValue}>{rating}</ThemedText>
                    </View>
                </View>

                <View style={styles.infoIcon}>
                    <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.border} />
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
}

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
        paddingBottom: 20,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.surface,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: COLORS.text,
    },
    filterButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContainer: {
        flex: 1,
        paddingHorizontal: 20,
    },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderRadius: 18,
        paddingHorizontal: 16,
        height: 56,
        marginBottom: 24,
        ...SHADOWS.small,
    },
    searchInput: {
        flex: 1,
        marginLeft: 12,
        fontSize: 15,
        color: COLORS.text,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 16,
        color: COLORS.text,
    },
    categoriesContainer: {
        marginBottom: 24,
    },
    categoryItem: {
        alignItems: 'center',
        marginRight: 20,
    },
    categoryIcon: {
        width: 60,
        height: 60,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    categoryText: {
        fontSize: 12,
        fontWeight: '700',
        color: COLORS.text,
    },
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: COLORS.surface,
        padding: 6,
        borderRadius: 16,
        marginBottom: 32,
    },
    toggleBtn: {
        flex: 1,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    toggleActiveWrapper: {
        flex: 1,
    },
    toggleActiveGradient: {
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    filterBadge: {
        position: 'relative',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 15,
        color: COLORS.textLight,
        textAlign: 'center',
        marginTop: 16,
        marginBottom: 24,
        paddingHorizontal: 40,
    },
    resetSearchBtn: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: COLORS.primaryLight,
    },
    resetSearchText: {
        color: COLORS.primary,
        fontWeight: '700',
        fontSize: 14,
    },
    toggleText: {
        fontSize: 14,
        color: COLORS.textLight,
        fontWeight: '700',
    },
    toggleTextActive: {
        fontSize: 14,
        color: COLORS.white,
        fontWeight: '700',
    },
    listHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    card: {
        flexDirection: 'row',
        backgroundColor: COLORS.white,
        borderRadius: 24,
        padding: 12,
        marginBottom: 16,
        ...SHADOWS.medium,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    cardImage: {
        width: 90,
        height: 90,
        borderRadius: 18,
        marginRight: 16,
    },
    cardContent: {
        flex: 1,
        justifyContent: 'center',
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: COLORS.text,
        marginBottom: 6,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 8,
    },
    cardSub: {
        fontSize: 13,
        color: COLORS.textLight,
        flex: 1,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    ratingValue: {
        fontSize: 13,
        fontWeight: '700',
        color: COLORS.text,
    },
    infoIcon: {
        justifyContent: 'center',
    },
    errorText: {
        textAlign: 'center',
        color: COLORS.error,
        marginVertical: 40,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.4)',
        justifyContent: 'flex-end',
    },
    filterModal: {
        backgroundColor: COLORS.white,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
        ...SHADOWS.large,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    filterTitle: {
        fontSize: 20,
        fontWeight: '800',
    },
    filterItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    filterText: {
        flex: 1,
        marginLeft: 16,
        fontSize: 15,
        fontWeight: '600',
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#E2E8F0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    filterActions: {
        flexDirection: 'row',
        marginTop: 32,
        gap: 16,
    },
    clearBtn: {
        flex: 1,
        height: 54,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    applyBtn: {
        flex: 2,
        height: 54,
    },
    applyGradient: {
        height: '100%',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
