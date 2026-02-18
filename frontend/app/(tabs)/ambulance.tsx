import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, View, TouchableOpacity, Image, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { COLORS, SHADOWS } from '../../constants/theme';
import Animated, { FadeInDown, FadeInUp, withSpring, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

const AmbulanceTabScreen = () => {
  const router = useRouter();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.push('/ambulance/select-hospital');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.iconCircle}>
          <MaterialCommunityIcons name="ambulance" size={80} color={COLORS.primary} />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).duration(600)}>
          <ThemedText style={styles.title}>Emergency Support</ThemedText>
          <ThemedText style={styles.subtitle}>
            Get immediate medical assistance at your doorstep. We are available 24/7.
          </ThemedText>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(600).duration(800)} style={{ width: '100%' }}>
          <TouchableOpacity
            style={[styles.button, animatedStyle]}
            onPressIn={() => (scale.value = withSpring(0.95))}
            onPressOut={() => (scale.value = withSpring(1))}
            onPress={handlePress}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[COLORS.primary, COLORS.accent]}
              style={styles.gradient}
            >
              <MaterialCommunityIcons name="map-marker-radius" size={24} color="white" />
              <ThemedText style={styles.buttonText}>Book an Ambulance</ThemedText>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(800).duration(1000)} style={styles.infoCard}>
          <MaterialCommunityIcons name="shield-check" size={24} color={COLORS.success} />
          <ThemedText style={styles.infoText}>Prioritized & Professional Care</ThemedText>
        </Animated.View>
      </View>
    </View>
  );
};

export default AmbulanceTabScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    padding: 24,
  },
  content: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#FFE4E6',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  button: {
    width: '100%',
    ...SHADOWS.large,
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 20,
    gap: 12,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.white,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 40,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    gap: 10,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '600',
  },
});
