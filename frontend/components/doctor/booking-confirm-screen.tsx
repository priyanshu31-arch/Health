import React, { useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/themed-text';
import { COLORS, SHADOWS } from '../../constants/theme';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

type NavigationProp = {
  navigate: (screen: string) => void;
};

const BookingConfirmScreen = ({ navigation }: { navigation: NavigationProp }) => {
  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View entering={ZoomIn.duration(800)} style={styles.successCard}>
        <View style={styles.iconCircle}>
          <MaterialCommunityIcons name="check-bold" size={50} color={COLORS.white} />
        </View>

        <Animated.View entering={FadeInDown.delay(400).duration(600)}>
          <ThemedText style={styles.title}>Booking Confirmed!</ThemedText>
          <ThemedText style={styles.subtitle}>
            Your appointment has been successfully scheduled. Connect with your doctor at the selected time.
          </ThemedText>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(600).duration(800)} style={styles.detailsBox}>
          <View style={styles.detailRow}>
            <ThemedText style={styles.label}>Doctor</ThemedText>
            <ThemedText style={styles.value}>Dr. Neha Viswanathan</ThemedText>
          </View>

          <View style={styles.detailRow}>
            <ThemedText style={styles.label}>Date & Time</ThemedText>
            <ThemedText style={styles.value}>Wed, 23 Oct • 02:00 PM</ThemedText>
          </View>

          <View style={styles.detailRow}>
            <ThemedText style={styles.label}>Consultation</ThemedText>
            <ThemedText style={styles.value}>Online Chat</ThemedText>
          </View>

          <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
            <ThemedText style={styles.totalLabel}>Grand Total</ThemedText>
            <ThemedText style={styles.totalValue}>₹550</ThemedText>
          </View>
        </Animated.View>

        <TouchableOpacity
          style={styles.homeButton}
          onPress={() => navigation.navigate('Home')}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={[COLORS.primary, COLORS.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.homeGradient}
          >
            <ThemedText style={styles.homeButtonText}>Return to Home</ThemedText>
            <MaterialCommunityIcons name="home-outline" size={24} color={COLORS.white} />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

export default BookingConfirmScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    padding: 24,
  },
  successCard: {
    backgroundColor: COLORS.white,
    borderRadius: 32,
    padding: 32,
    alignItems: 'center',
    ...SHADOWS.large,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    ...SHADOWS.medium,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    paddingHorizontal: 10,
  },
  detailsBox: {
    width: '100%',
    backgroundColor: COLORS.surface,
    padding: 20,
    borderRadius: 24,
    marginBottom: 32,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  label: {
    color: COLORS.textLight,
    fontWeight: '600',
    fontSize: 14,
  },
  value: {
    color: COLORS.text,
    fontWeight: '700',
    fontSize: 14,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.primary,
  },
  homeButton: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  homeGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 18,
    gap: 12,
  },
  homeButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '800',
  },
});
