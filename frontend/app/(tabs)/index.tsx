import { Image } from 'expo-image';
import { Link, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, View, Dimensions, Platform, Pressable, TextInput } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInRight, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import DoctorCard from '../../components/doctorcard';
import HospitalCard from '../../components/hospitalcard';
import { api } from '../config/api.config';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { COLORS, SHADOWS, FONTS } from '../../constants/theme';
import Shimmer from '../../components/Shimmer';

const { width } = Dimensions.get('window');

const hospitalImages = [
  require('@/assets/images/h5.png'),
  require('@/assets/images/hospital1.png'),
  require('@/assets/images/h4.png'),
  require('@/assets/images/hospital2.png'),
  require('@/assets/images/h5.png'),
];

// Fallback dummy doctors
const fallbackDoctors = [
  {
    id: 'd1',
    name: 'Dr. Sarah Jenkin',
    specialization: 'Cardiologist',
    rating: 4.9,
    image: require('@/assets/images/doctor_f1.png'),
  },
  {
    id: 'd2',
    name: 'Dr. Michael Thompson',
    specialization: 'Neurosurgeon',
    rating: 4.8,
    image: require('@/assets/images/doctor_m1.png'),
  },
  {
    id: 'd3',
    name: 'Dr. Srivathsavi Mallik',
    specialization: 'Orthopedic surgeon',
    rating: 4.7,
    image: require('@/assets/images/doctor_m2.png'),
  },
];

interface Hospital {
  _id: string;
  name: string;
  bio?: string;
  rating?: number;
  photo?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const QuickActionItem = ({ item, handlePressAction }: { item: any; handlePressAction: (path: string) => void }) => {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  return (
    <AnimatedPressable
      style={[styles.actionItem, animatedStyle]}
      onPressIn={() => (scale.value = withSpring(0.92))}
      onPressOut={() => (scale.value = withSpring(1))}
      onPress={() => handlePressAction(item.path)}
    >
      <LinearGradient
        colors={[item.color, '#FFFFFF']}
        style={styles.actionIconContainer}
      >
        <MaterialCommunityIcons name={item.icon as any} size={26} color={item.iconColor} />
      </LinearGradient>

      <ThemedText style={styles.actionLabel}>{item.name}</ThemedText>
    </AnimatedPressable>
  );
};

const DoctorSkeleton = () => (
  <View style={styles.skeletonDoctorCard}>
    <Shimmer width="100%" height={120} borderRadius={16} />
    <View style={{ marginTop: 12 }}>
      <Shimmer width="80%" height={16} borderRadius={4} />
      <Shimmer width="60%" height={12} borderRadius={4} style={{ marginTop: 8 }} />
      <Shimmer width="40%" height={10} borderRadius={4} style={{ marginTop: 8 }} />
    </View>
  </View>
);

const HospitalSkeleton = () => (
  <View style={styles.skeletonHospitalCard}>
    <Shimmer width="100%" height={140} borderRadius={24} />
    <View style={{ padding: 16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Shimmer width="60%" height={18} borderRadius={4} />
        <Shimmer width="15%" height={18} borderRadius={4} />
      </View>
      <Shimmer width="80%" height={14} borderRadius={4} style={{ marginTop: 12 }} />
      <Shimmer width="100%" height={40} borderRadius={12} style={{ marginTop: 16 }} />
    </View>
  </View>
);

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { unreadCount } = useNotifications();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [hospitalsData, doctorsData] = await Promise.all([
          api.getHospitals(),
          api.getDoctors()
        ]);
        setHospitals(hospitalsData);
        setDoctors(doctorsData);
        setError(null);
      } catch (err: any) {
        console.error('Failed to fetch dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const displayHospitals = (hospitals.length > 0
    ? hospitals.map((h, index) => ({
      _id: h._id,
      name: h.name,
      location: h.bio || 'Location not available',
      rating: h.rating || 4.5,
      image: hospitalImages[index % hospitalImages.length],
    }))
    : [
      { _id: '1', name: 'Patel Orthopaedic', location: 'Seattle, WA', rating: 4.6, image: hospitalImages[0] },
      { _id: '2', name: 'ARC Max Hospital', location: 'Springfield, IL', rating: 4.9, image: hospitalImages[1] },
    ]).filter(h => h.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const displayDoctors = (doctors.length > 0 ? doctors : fallbackDoctors).filter(d =>
    (d.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.specialization || d.specialty || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePressAction = (path: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(path as any);
  };

  const handleDoctorPress = (doctor: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: '/doctor/[id]',
      params: { id: doctor.id, name: doctor.name, specialization: doctor.specialization, rating: doctor.rating }
    } as any);
  };

  const handleHospitalPress = (hospital: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: '/hospitals/[id]',
      params: { id: hospital._id, name: hospital.name, location: hospital.location, rating: hospital.rating }
    } as any);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} bounces={true}>
      {/* Premium Header */}
      <Animated.View
        entering={FadeInDown.duration(800).springify()}
        style={styles.headerContainer}
      >
        <LinearGradient
          colors={[COLORS.primary, COLORS.accent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerTop}>
            <View>
              <ThemedText style={styles.greetingText}>
                {user && user.name ? `Welcome, ${user.name.split(' ')[0]}!` : 'Welcome!'}
              </ThemedText>
              <ThemedText style={styles.subtitleText}>How are you feeling today?</ThemedText>
            </View>

            {user ? (
              <TouchableOpacity
                style={styles.notificationCircle}
                onPress={() => {
                  Haptics.selectionAsync();
                  router.push('/notifications');
                }}
              >
                <MaterialCommunityIcons name="bell-outline" size={24} color={COLORS.white} />
                {unreadCount > 0 && <View style={styles.notificationDot} />}
              </TouchableOpacity>
            ) : (
              <Link href="/login" asChild>
                <TouchableOpacity style={styles.loginButtonHeader}>
                  <ThemedText style={styles.loginButtonHeaderText}>Login</ThemedText>
                </TouchableOpacity>
              </Link>
            )}
          </View>

          <Animated.View entering={FadeInDown.delay(200).duration(800)} style={styles.searchBar}>
            <MaterialCommunityIcons name="magnify" size={22} color={COLORS.textLight} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for doctors, hospitals..."
              placeholderTextColor={COLORS.textLight}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCorrect={false}
            />
          </Animated.View>
        </LinearGradient>
      </Animated.View>

      <View style={styles.content}>
        {/* Quick Actions Grid */}
        <Animated.View
          entering={FadeInDown.delay(400).duration(800)}
          style={styles.section}
        >
          <View style={styles.quickActionsGrid}>
            {[
              { id: 'ambulance', name: 'Emergency', icon: 'ambulance', path: '/ambulance/select-hospital', color: '#FEF2F2', iconColor: '#EF4444' },
              { id: 'doctor', name: 'Doctors', icon: 'doctor', path: '/doctor', color: '#ECFEFF', iconColor: '#0891B2' },
              { id: 'hospitals', name: 'Hospitals', icon: 'hospital-building', path: '/hospitals', color: '#F0FDF4', iconColor: '#10B981' },
              { id: 'chat', name: 'Health AI', icon: 'robot', path: '/chat', color: '#F5F3FF', iconColor: '#8B5CF6' },
            ].map((item) => (
              <QuickActionItem
                key={item.id}
                item={item}
                handlePressAction={handlePressAction}
              />
            ))}
          </View>
        </Animated.View>

        {/* Dynamic Health Banner */}
        <Animated.View
          entering={FadeInDown.delay(600).duration(800)}
          style={styles.bannerSection}
        >
          <LinearGradient
            colors={['#1E293B', '#334155']}
            style={styles.bannerContainer}
          >
            <View style={styles.bannerContent}>
              <ThemedText style={styles.bannerTitle}>Checkup Promo!</ThemedText>
              <ThemedText style={styles.bannerDescription}>Get 50% off on your first home visit lab test.</ThemedText>
              <TouchableOpacity
                style={styles.bannerButton}
                onPress={() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)}
              >
                <ThemedText style={styles.bannerButtonText}>Claim Now</ThemedText>
              </TouchableOpacity>
            </View>
            <Image
              source={require('@/assets/images/doctor1.png')}
              style={styles.bannerImage}
            />
          </LinearGradient>
        </Animated.View>

        {/* Bottom Call Ambulance FAB Style */}
        <Animated.View entering={FadeInDown.delay(800).duration(800)}>
          <TouchableOpacity
            style={styles.ambulanceFab}
            onPress={() => handlePressAction('/ambulance/select-hospital')}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={[COLORS.primary, COLORS.accent]}
              style={styles.ambulanceFabGradient}
            >
              <MaterialCommunityIcons name="phone" size={24} color="white" />
              <ThemedText style={styles.ambulanceFabText}>Urgent Ambulance</ThemedText>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Top Doctors Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Top Specialists</ThemedText>
            <TouchableOpacity onPress={() => handlePressAction('/doctor')}>
              <ThemedText style={styles.seeAllText}>See all</ThemedText>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          >
            {loading ? (
              [1, 2, 3].map((_, i) => <DoctorSkeleton key={i} />)
            ) : (
              displayDoctors.map((doctor, index) => (
                <Animated.View
                  key={doctor.id}
                  entering={FadeInRight.delay(index * 100).duration(600)}
                >
                  <DoctorCard
                    doctor={doctor}
                    onPress={() => handleDoctorPress(doctor)}
                  />
                </Animated.View>
              ))
            )}
          </ScrollView>
          {displayDoctors.length === 0 && (
            <ThemedText style={styles.emptyText}>No doctors found matching "{searchQuery}"</ThemedText>
          )}
        </View>

        {/* Recommended Hospitals Section */}
        <View style={[styles.section, { marginBottom: 100 }]}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Recommended Hospitals</ThemedText>
            <TouchableOpacity onPress={() => handlePressAction('/hospitals')}>
              <ThemedText style={styles.seeAllText}>See all</ThemedText>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          >
            {loading ? (
              [1, 2].map((_, i) => <HospitalSkeleton key={i} />)
            ) : (
              displayHospitals.map((hospital, index) => (
                <Animated.View
                  key={hospital._id}
                  entering={FadeInRight.delay(index * 100).duration(600)}
                >
                  <HospitalCard
                    hospital={hospital}
                    onPress={() => handleHospitalPress(hospital)}
                  />
                </Animated.View>
              ))
            )}
          </ScrollView>
          {!loading && displayHospitals.length === 0 && (
            <ThemedText style={styles.emptyText}>No hospitals found matching "{searchQuery}"</ThemedText>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerContainer: {
    paddingBottom: 20,
  },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 35 : 25,
    paddingBottom: 20,
    paddingHorizontal: 12,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    ...SHADOWS.large,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greetingText: {
    fontSize: 26,
    fontFamily: FONTS.semiBold,
    color: COLORS.white,
  },
  subtitleText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
    fontFamily: FONTS.regular,
  },
  notificationCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 12,
    right: 13,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFD700',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  loginButtonHeader: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  loginButtonHeaderText: {
    color: COLORS.white,
    fontFamily: FONTS.medium,
    fontSize: 14,
  },
  searchBar: {
    height: 54,
    backgroundColor: COLORS.white,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
    ...SHADOWS.small,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    paddingVertical: 8,
    fontFamily: FONTS.regular,
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.textLight,
    marginTop: 20,
    fontSize: 14,
    fontStyle: 'italic',
  },
  searchPlaceholder: {
    color: COLORS.textLight,
    fontSize: 15,
  },
  content: {
    marginTop: -20,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: 24,
    ...SHADOWS.medium,
  },
  actionItem: {
    alignItems: 'center',
    gap: 8,
  },
  actionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionLabel: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: COLORS.text,
  },
  bannerSection: {
    marginVertical: 24,
    paddingHorizontal: 20,
  },
  bannerContainer: {
    borderRadius: 24,
    padding: 24,
    flexDirection: 'row',
    overflow: 'hidden',
    height: 160,
  },
  bannerContent: {
    flex: 1,
    zIndex: 1,
  },
  bannerTitle: {
    color: COLORS.white,
    fontSize: 22,
    fontFamily: FONTS.semiBold,
    marginBottom: 8,
  },
  bannerDescription: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginBottom: 16,
    lineHeight: 20,
    fontFamily: FONTS.regular,
  },
  bannerButton: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  bannerButtonText: {
    color: COLORS.secondary,
    fontFamily: FONTS.semiBold,
    fontSize: 13,
  },
  bannerImage: {
    width: 140,
    height: 180,
    position: 'absolute',
    right: -20,
    bottom: -20,
    opacity: 0.9,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 19,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
  },
  seeAllText: {
    color: COLORS.primary,
    fontFamily: FONTS.medium,
    fontSize: 14,
  },
  horizontalList: {
    paddingRight: 20,
    gap: 16,
    paddingBottom: 10,
  },
  ambulanceFab: {
    marginHorizontal: 20,
    marginBottom: 12,
  },
  ambulanceFabGradient: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    ...SHADOWS.medium,
  },
  ambulanceFabText: {
    color: COLORS.white,
    fontFamily: FONTS.semiBold,
    fontSize: 17,
  },
  skeletonDoctorCard: {
    width: 160,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 12,
    ...SHADOWS.small,
  },
  skeletonHospitalCard: {
    width: 280,
    backgroundColor: COLORS.white,
    borderRadius: 24,
    ...SHADOWS.small,
    overflow: 'hidden',
  },
});
