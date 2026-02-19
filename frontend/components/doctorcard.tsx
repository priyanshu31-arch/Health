import { Image } from 'expo-image';
import { StyleSheet, View, TouchableOpacity, Dimensions } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SHADOWS, FONTS } from '../constants/theme';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const { width: screenWidth } = Dimensions.get('window');

interface DoctorCardProps {
  doctor: {
    id?: string;
    name: string;
    specialization?: string;
    specialty?: string;
    rating: number;
    image: any;
  };
  onPress?: () => void;
}

export default function DoctorCard({ doctor, onPress }: DoctorCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  return (
    <Animated.View entering={FadeInDown.springify().duration(600)}>
      <TouchableOpacity
        style={[styles.card, animatedStyle]}
        activeOpacity={0.9}
        onPressIn={() => (scale.value = withSpring(0.95))}
        onPressOut={() => (scale.value = withSpring(1))}
        onPress={handlePress}
      >
        <View style={styles.imageContainer}>
          <Image source={doctor.image} style={styles.image} contentFit="cover" />

          {/* Verified Badge */}
          <View style={styles.verifiedBadge}>
            <MaterialCommunityIcons name="check-decagram" size={16} color={COLORS.primary} />
          </View>

          {/* Rating Badge */}
          <View style={styles.ratingBadge}>
            <MaterialCommunityIcons name="star" size={12} color="#FFD700" />
            <ThemedText style={styles.ratingText}>{doctor.rating}</ThemedText>
          </View>
        </View>

        <View style={styles.info}>
          <ThemedText style={styles.name} numberOfLines={1}>{doctor.name}</ThemedText>

          <View style={styles.specializationRow}>
            <MaterialCommunityIcons name="stethoscope" size={12} color={COLORS.primary} />
            <ThemedText style={styles.specialization} numberOfLines={1}>
              {doctor.specialization || doctor.specialty || 'General Physician'}
            </ThemedText>
          </View>

          {/* Availability */}
          <View style={styles.availabilityRow}>
            <View style={styles.availabilityDot} />
            <ThemedText style={styles.availabilityText}>Available Today</ThemedText>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    width: 160,
    ...SHADOWS.medium,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  image: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
  },
  verifiedBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 4,
    ...SHADOWS.small,
  },
  ratingBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 2,
  },
  ratingText: {
    color: COLORS.white,
    fontSize: 10,
    fontFamily: FONTS.medium,
  },
  info: {
    alignItems: 'flex-start',
  },
  name: {
    fontSize: 15,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
    marginBottom: 6,
  },
  specializationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  specialization: {
    fontSize: 11,
    color: COLORS.textLight,
    flex: 1,
  },
  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 10,
  },
  availabilityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.success,
  },
  availabilityText: {
    fontSize: 10,
    color: COLORS.success,
    fontFamily: FONTS.medium,
  },
});
