import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Platform, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/themed-text';
import { COLORS, SHADOWS } from '../../constants/theme';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

type NavigationProp = {
  navigate: (screen: string) => void;
  goBack: () => void;
};

const PaymentScreen = ({ navigation }: { navigation: NavigationProp }) => {
  const [selectedPayment, setSelectedPayment] = useState('Google Pay');

  const paymentOptions = [
    { name: 'Debit Card / Credit Card', icon: 'credit-card', color: '#3B82F6' },
    { name: 'Google Pay', icon: 'google', color: '#EA4335' },
    { name: 'Paytm', icon: 'wallet', color: '#00BAF2' },
    { name: 'Paypal', icon: 'paypal', color: '#003087' },
  ];

  const handlePayment = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    navigation.navigate('BookingConfirm');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <Animated.View entering={FadeInUp.duration(600)} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={COLORS.text} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Checkout</ThemedText>
        <View style={{ width: 44 }} />
      </Animated.View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Booking Summary */}
        <Animated.View entering={FadeInDown.delay(200).duration(800)} style={styles.summaryCard}>
          <ThemedText style={styles.summaryTitle}>Booking Summary</ThemedText>
          <View style={styles.summaryRow}>
            <ThemedText style={styles.summaryLabel}>Consultation Fee</ThemedText>
            <ThemedText style={styles.summaryValue}>₹500</ThemedText>
          </View>
          <View style={styles.summaryRow}>
            <ThemedText style={styles.summaryLabel}>Service Fee</ThemedText>
            <ThemedText style={styles.summaryValue}>₹50</ThemedText>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <ThemedText style={styles.totalLabel}>Total Amount</ThemedText>
            <ThemedText style={styles.totalValue}>₹550</ThemedText>
          </View>
        </Animated.View>

        <ThemedText style={styles.sectionTitle}>Select Payment Method</ThemedText>

        {paymentOptions.map((option, index) => (
          <Animated.View
            key={option.name}
            entering={FadeInDown.delay(400 + index * 100).duration(600)}
          >
            <TouchableOpacity
              activeOpacity={0.7}
              style={[
                styles.paymentOption,
                selectedPayment === option.name && styles.selectedOption
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                setSelectedPayment(option.name);
              }}
            >
              <View style={[styles.iconContainer, { backgroundColor: option.color + '15' }]}>
                <MaterialCommunityIcons name={option.icon as any} size={24} color={option.color} />
              </View>
              <ThemedText style={[
                styles.optionText,
                selectedPayment === option.name && styles.selectedOptionText
              ]}>{option.name}</ThemedText>
              <View style={[
                styles.radio,
                selectedPayment === option.name && styles.radioActive
              ]}>
                {selectedPayment === option.name && <View style={styles.radioInner} />}
              </View>
            </TouchableOpacity>
          </Animated.View>
        ))}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.payButton}
          onPress={handlePayment}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={[COLORS.primary, COLORS.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.payGradient}
          >
            <ThemedText style={styles.payButtonText}>Pay Now • ₹550</ThemedText>
            <MaterialCommunityIcons name="lock-outline" size={20} color={COLORS.white} />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default PaymentScreen;

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
  summaryCard: {
    backgroundColor: COLORS.surface,
    margin: 20,
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    color: COLORS.textLight,
    fontWeight: '500',
  },
  summaryValue: {
    fontWeight: '700',
    color: COLORS.text,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 16,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '800',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.primary,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginHorizontal: 24,
    marginBottom: 16,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...SHADOWS.small,
  },
  selectedOption: {
    borderColor: COLORS.primaryLight,
    backgroundColor: '#FFF5F7',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  selectedOptionText: {
    color: COLORS.primary,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioActive: {
    borderColor: COLORS.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 44 : 24,
    backgroundColor: COLORS.white,
    ...SHADOWS.large,
  },
  payButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  payGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 18,
    gap: 12,
  },
  payButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '800',
  },
});
