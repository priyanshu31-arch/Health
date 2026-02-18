import React, { useState, useMemo } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, ScrollView, Platform, Dimensions, FlatList, Modal } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/themed-text';
import { COLORS, SHADOWS } from '../../constants/theme';
import Shimmer from '@/components/Shimmer';
import Animated, { FadeInDown, FadeInUp, FadeInRight, Layout, ZoomIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';

const { width, height } = Dimensions.get('window');

type NavigationProp = {
  navigate: (screen: string, params?: any) => void;
  goBack: () => void;
};

const DUMMY_DOCTORS = [
  {
    id: 'd1',
    name: 'Dr. Sarah Jenkin',
    specialization: 'Cardiologist',
    rating: 4.9,
    experience: '12 years',
    fees: 800,
    image: require('../../assets/images/doctor_f1.png'),
    availability: 'Available Today'
  },
  {
    id: 'd2',
    name: 'Dr. Michael Thompson',
    specialization: 'Neurosurgeon',
    rating: 4.8,
    experience: '15 years',
    fees: 1200,
    image: require('../../assets/images/doctor_m1.png'),
    availability: 'Tomorrow'
  },
  {
    id: 'd3',
    name: 'Dr. Srivathsavi Mallik',
    specialization: 'Orthopedic surgeon',
    rating: 4.7,
    experience: '8 years',
    fees: 600,
    image: require('../../assets/images/doctor_m2.png'),
    availability: 'Available Today'
  },
  {
    id: 'd4',
    name: 'Dr. Neha Viswanathan',
    specialization: 'Cardiovascular Technologist',
    rating: 4.9,
    experience: '10 years',
    fees: 500,
    image: require('../../assets/images/doctor_f2.png'),
    availability: 'Available Today'
  },
  {
    id: 'd5',
    name: 'Dr. James Wilson',
    specialization: 'Pediatrician',
    rating: 4.6,
    experience: '6 years',
    fees: 400,
    image: require('../../assets/images/doctor_m1.png'),
    availability: 'Thursday'
  }
];


const DoctorTabScreen = ({ navigation }: { navigation: NavigationProp }) => {
  const initialFilter = 'Earliest available any location';
  const [selectedFilter, setSelectedFilter] = useState(initialFilter);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  const filters = [
    { name: 'Earliest available any location', icon: 'calendar-clock' },
    { name: 'Nearest first', icon: 'map-marker' },
    { name: 'Most experienced', icon: 'trophy' },
    { name: 'Fees: High to Low', icon: 'sort-ascending' },
    { name: 'Fees: Low to High', icon: 'sort-descending' },
  ];

  const filteredDoctors = useMemo(() => {
    let result = [...DUMMY_DOCTORS];

    // Search filter
    if (searchQuery) {
      result = result.filter(d =>
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.specialization.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort filter
    if (selectedFilter === 'Most experienced') {
      result.sort((a, b) => parseInt(b.experience) - parseInt(a.experience));
    } else if (selectedFilter === 'Fees: High to Low') {
      result.sort((a, b) => b.fees - a.fees);
    } else if (selectedFilter === 'Fees: Low to High') {
      result.sort((a, b) => a.fees - b.fees);
    }

    return result;
  }, [searchQuery, selectedFilter]);


  const DoctorItem = ({ item, index, navigation }: { item: any, index: number, navigation: NavigationProp }) => (
    <Animated.View
      entering={FadeInDown.delay(index * 100).duration(600)}
      style={styles.doctorCard}
    >
      <TouchableOpacity
        style={styles.doctorContent}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          navigation.navigate('DoctorInfo', {
            id: item.id,
            name: item.name,
            specialization: item.specialization,
            rating: item.rating,
            image: item.image
          });
        }}
        activeOpacity={0.9}
      >
        <Image source={item.image} style={styles.doctorImage} />
        <View style={styles.doctorInfo}>
          <View style={styles.doctorHeaderRow}>
            <ThemedText style={styles.doctorName}>{item.name}</ThemedText>
            <View style={styles.ratingBox}>
              <MaterialCommunityIcons name="star" size={14} color="#FFB800" />
              <ThemedText style={styles.ratingText}>{item.rating}</ThemedText>
            </View>
          </View>
          <ThemedText style={styles.specialtyText}>{item.specialization}</ThemedText>

          <View style={styles.doctorStats}>
            <View style={styles.statLine}>
              <MaterialCommunityIcons name="briefcase-variant-outline" size={14} color={COLORS.textLight} />
              <ThemedText style={styles.statText}>{item.experience} exp.</ThemedText>
            </View>
          </View>

          <View style={styles.availabilityBadge}>
            <View style={[styles.dot, { backgroundColor: item.availability === 'Available Today' ? COLORS.success : COLORS.warning }]} />
            <ThemedText style={[styles.availabilityText, { color: item.availability === 'Available Today' ? COLORS.success : COLORS.warning }]}>
              {item.availability}
            </ThemedText>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  const DoctorItemSkeleton = () => (
    <View style={styles.doctorCard}>
      <View style={styles.doctorContent}>
        <Shimmer width={100} height={100} borderRadius={20} />
        <View style={styles.doctorInfo}>
          <View style={styles.doctorHeaderRow}>
            <Shimmer width="60%" height={20} borderRadius={4} />
            <Shimmer width="15%" height={20} borderRadius={4} />
          </View>
          <Shimmer width="40%" height={16} borderRadius={4} style={{ marginTop: 8 }} />
          <View style={[styles.doctorStats, { marginTop: 12 }]}>
            <Shimmer width="30%" height={14} borderRadius={4} />
          </View>
          <Shimmer width="50%" height={14} borderRadius={4} style={{ marginTop: 8 }} />
        </View>
      </View>
    </View>
  );



  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[COLORS.primary, '#0ea5e9']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.premiumHeader}
      >
        <ThemedText style={styles.premiumHeaderTitle}>Specialists</ThemedText>
        <ThemedText style={styles.premiumHeaderSubtitle}>Find the best care for you</ThemedText>

        <View style={styles.searchRow}>
          <View style={styles.premiumSearchBox}>
            <MaterialCommunityIcons name="magnify" size={24} color={COLORS.textLight} />
            <TextInput
              style={styles.premiumSearchInput}
              placeholder="Search specialists..."
              placeholderTextColor={COLORS.textLight}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity
            style={styles.filterIconButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setIsFilterModalVisible(true);
            }}
          >
            <MaterialCommunityIcons name="tune" size={24} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <FlatList
        data={(loading ? [1, 2, 3, 4] : filteredDoctors) as any[]}
        renderItem={({ item, index }) => loading ? <DoctorItemSkeleton /> : <DoctorItem item={item as any} index={index} navigation={navigation} />}
        keyExtractor={(item, index) => loading ? `skeleton-${index}` : (item as any).id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="magnify-close" size={64} color={COLORS.textLight} />
              <ThemedText style={styles.emptyStateText}>No specialists found</ThemedText>
            </View>
          ) : null
        }
      />

      {/* Filter Modal */}
      <Modal
        visible={isFilterModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsFilterModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsFilterModalVisible(false)}
        >
          <Animated.View entering={FadeInUp.duration(400)} style={styles.filterModalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Sort & Filter</ThemedText>
              <TouchableOpacity onPress={() => setIsFilterModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            {filters.map((filter) => (
              <TouchableOpacity
                key={filter.name}
                style={[
                  styles.modalFilterOption,
                  selectedFilter === filter.name && styles.modalFilterOptionSelected
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setSelectedFilter(filter.name);
                }}
              >
                <MaterialCommunityIcons
                  name={filter.icon as any}
                  size={20}
                  color={selectedFilter === filter.name ? COLORS.primary : COLORS.textLight}
                />
                <ThemedText style={[
                  styles.modalFilterText,
                  selectedFilter === filter.name && styles.modalFilterTextSelected
                ]}>
                  {filter.name}
                </ThemedText>
                {selectedFilter === filter.name && (
                  <MaterialCommunityIcons name="check" size={20} color={COLORS.primary} />
                )}
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.applyFilterButton}
              onPress={() => setIsFilterModalVisible(false)}
            >
              <ThemedText style={styles.applyFilterButtonText}>Apply Filters</ThemedText>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const HospitalDetailSkeleton = () => (
  <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
    <View style={styles.imageContainer}>
      <Shimmer width="100%" height={260} borderRadius={0} />
    </View>
    <View style={styles.contentContainer}>
      <View style={styles.statsContainer}>
        <Shimmer width="45%" height={60} borderRadius={16} />
        <Shimmer width="45%" height={60} borderRadius={16} />
      </View>

      <View style={[styles.sectionHeader, { marginTop: 24 }]}>
        <Shimmer width="40%" height={24} borderRadius={4} />
        <Shimmer width="30%" height={16} borderRadius={4} style={{ marginTop: 8 }} />
      </View>

      <View style={styles.grid}>
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={styles.card}>
            <Shimmer width="100%" height={100} borderRadius={12} />
          </View>
        ))}
      </View>
    </View>
  </ScrollView>
);

export default function HospitalDetailsScreen(props: any) {
  const dummyNav = { navigate: () => { }, goBack: () => { } };
  return <DoctorTabScreen navigation={props.navigation || dummyNav} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  premiumHeader: {
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingHorizontal: 24,
    paddingBottom: 30,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    ...SHADOWS.large,
  },
  premiumHeaderTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.white,
    marginBottom: 4,
  },
  premiumHeaderSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 24,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  premiumSearchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 18,
    paddingHorizontal: 16,
    height: 54,
    ...SHADOWS.small,
  },
  premiumSearchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    color: COLORS.text,
  },
  filterIconButton: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  listContainer: {
    padding: 20,
    paddingTop: 10,
  },
  doctorCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    marginBottom: 16,
    ...SHADOWS.small,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    overflow: 'hidden',
  },
  doctorContent: {
    flexDirection: 'row',
    padding: 16,
  },
  doctorImage: {
    width: 100,
    height: 100,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
  },
  doctorInfo: {
    flex: 1,
    marginLeft: 16,
  },
  doctorHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  doctorName: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.text,
    flex: 1,
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#D97706',
  },
  specialtyText: {
    fontSize: 14,
    color: COLORS.textLight,
    fontWeight: '500',
    marginBottom: 12,
  },
  doctorStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  statLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: COLORS.textLight,
    fontWeight: '600',
  },
  feeText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '800',
  },
  availabilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  availabilityText: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyStateText: {
    fontSize: 16,
    color: COLORS.textLight,
    fontWeight: '500',
    marginTop: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  filterModalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
  },
  modalFilterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 16,
  },
  modalFilterOptionSelected: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    marginLeft: -12,
    marginRight: -12,
    borderRadius: 12,
  },
  modalFilterText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
  },
  modalFilterTextSelected: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  applyFilterButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 24,
    ...SHADOWS.medium,
  },
  applyFilterButtonText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '800',
  },
  // Additional styles for skeleton (unused but kept for consistency)
  imageContainer: {
    width: '100%',
    height: 260,
  },
  contentContainer: {
    padding: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionHeader: {
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    width: '48%',
    height: 100,
  },
});
