import React, { useState } from 'react';
import { View, StyleSheet, Image, TouchableOpacity, ScrollView, Platform, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/themed-text';
import { COLORS, SHADOWS } from '../../constants/theme';
import Animated, { FadeInDown, FadeInUp, withSpring, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

type NavigationProp = {
  navigate: (screen: string) => void;
  goBack: () => void;
};

const DoctorInfoScreen = ({ navigation, doctorData }: { navigation: NavigationProp, doctorData?: any }) => {
  const [selectedDate, setSelectedDate] = useState('23');
  const [selectedTime, setSelectedTime] = useState('02:00 PM');

  // Fallback data
  const info = {
    name: doctorData?.name || 'Dr. Neha Viswanathan',
    specialty: doctorData?.specialization || 'Cardiovascular Technologist',
    rating: doctorData?.rating || '4.9',
    patients: '2.5k+',
    exp: '12yrs',
    image: doctorData?.image || require('../../assets/images/doctor_f1.png')
  };

  const dates = [
    { day: 'Mon', date: '21' },
    { day: 'Tue', date: '22' },
    { day: 'Wed', date: '23' },
    { day: 'Thu', date: '24' },
    { day: 'Fri', date: '25' },
    { day: 'Sat', date: '26' },
    { day: 'Sun', date: '27' },
  ];

  const times = [
    '09:00 AM', '10:00 AM', '11:00 AM',
    '01:00 PM', '02:00 PM', '03:00 PM',
    '04:00 PM', '07:00 PM', '08:00 PM',
  ];

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Premium Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="chevron-left" size={28} color={COLORS.text} />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>Appointment</ThemedText>
          <TouchableOpacity style={styles.favoriteButton}>
            <MaterialCommunityIcons name="heart-outline" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* Doctor Identity Profile */}
        <Animated.View entering={FadeInDown.duration(800)} style={styles.profileSection}>
          <View style={styles.imageWrapper}>
            <Image
              source={typeof info.image === 'string' ? { uri: info.image } : info.image}
              style={styles.doctorImage}
            />
            <View style={styles.activeBadge} />
          </View>
          <ThemedText style={styles.doctorName}>{info.name}</ThemedText>
          <ThemedText style={styles.doctorSpecialty}>{info.specialty}</ThemedText>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <MaterialCommunityIcons name="star" size={20} color="#FFB800" />
              <ThemedText style={styles.statValue}>4.9</ThemedText>
              <ThemedText style={styles.statLabel}>Rating</ThemedText>
            </View>
            <View style={[styles.statBox, styles.statDivider]}>
              <MaterialCommunityIcons name="account-group" size={20} color={COLORS.primary} />
              <ThemedText style={styles.statValue}>2.5k+</ThemedText>
              <ThemedText style={styles.statLabel}>Patients</ThemedText>
            </View>
            <View style={styles.statBox}>
              <MaterialCommunityIcons name="briefcase-variant" size={20} color="#10B981" />
              <ThemedText style={styles.statValue}>12yrs</ThemedText>
              <ThemedText style={styles.statLabel}>Exp.</ThemedText>
            </View>
          </View>
        </Animated.View>

        {/* About Section */}
        <View style={styles.sectionContainer}>
          <ThemedText style={styles.sectionTitle}>About Doctor</ThemedText>
          <ThemedText style={styles.aboutText}>
            Dr. Neha Viswanathan is a highly skilled cardiovascular technologist with over 12 years of experience in diagnosing and treating heart conditions. She specializes in advanced echocardiography and interventional cardiology procedures.
            <ThemedText style={styles.readMore}> Read more...</ThemedText>
          </ThemedText>
        </View>

        {/* Slot Selection - Date */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Select Date</ThemedText>
            <TouchableOpacity>
              <ThemedText style={styles.monthText}>October 2023</ThemedText>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateList}>
            {dates.map((item) => (
              <TouchableOpacity
                key={item.date}
                style={[
                  styles.dateCard,
                  selectedDate === item.date && styles.selectedDateCard
                ]}
                onPress={() => setSelectedDate(item.date)}
                activeOpacity={0.7}
              >
                <ThemedText style={[
                  styles.dayText,
                  selectedDate === item.date && styles.selectedDateText
                ]}>
                  {item.day}
                </ThemedText>
                <ThemedText style={[
                  styles.dateText,
                  selectedDate === item.date && styles.selectedDateText
                ]}>
                  {item.date}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Slot Selection - Time */}
        <Animated.View entering={FadeInUp.delay(400).duration(800)} style={styles.sectionContainer}>
          <ThemedText style={styles.sectionTitle}>Select Time</ThemedText>
          <View style={styles.timeGrid}>
            {times.map((time) => (
              <TouchableOpacity
                key={time}
                style={[
                  styles.timeSlot,
                  selectedTime === time && styles.selectedTimeSlot
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setSelectedTime(time);
                }}
                activeOpacity={0.7}
              >
                <ThemedText style={[
                  styles.timeText,
                  selectedTime === time && styles.selectedTimeText
                ]}>
                  {time}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Floating Action Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.bookButton}
          onPress={() => navigation.navigate('Payment')}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={[COLORS.primary, COLORS.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.bookGradient}
          >
            <ThemedText style={styles.bookButtonText}>Book Appointment</ThemedText>
            <View style={styles.priceBadge}>
              <ThemedText style={styles.priceText}>₹500</ThemedText>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default DoctorInfoScreen;

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
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF5F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
  },
  profileSection: {
    alignItems: 'center',
    padding: 20,
  },
  imageWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  doctorImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: COLORS.surface,
  },
  activeBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.success,
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  doctorName: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4,
  },
  doctorSpecialty: {
    fontSize: 15,
    color: COLORS.textLight,
    fontWeight: '500',
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 20,
    width: '100%',
    justifyContent: 'space-around',
    ...SHADOWS.small,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#E2E8F0',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    fontWeight: '600',
  },
  sectionContainer: {
    padding: 20,
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
  readMore: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  monthText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '700',
  },
  dateList: {
    gap: 12,
  },
  dateCard: {
    width: 64,
    height: 80,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  selectedDateCard: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    ...SHADOWS.small,
  },
  dayText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textLight,
    marginBottom: 4,
  },
  dateText: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  selectedDateText: {
    color: COLORS.white,
  },
  selectedTimeText: {
    color: COLORS.primary,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  timeSlot: {
    width: (width - 64) / 3,
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedTimeSlot: {
    backgroundColor: '#FFF5F7',
    borderColor: COLORS.primary,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  bookButton: {
    borderRadius: 24,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  bookGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
    gap: 12,
  },
  bookButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '800',
    flex: 1,
    textAlign: 'center',
    marginLeft: 40,
  },
  priceBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  priceText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 14,
  },
});
