import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';
import {
  Alert,
  Linking,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { COLORS, SHADOWS } from '../../constants/theme';
import * as ImagePicker from 'expo-image-picker';
import { api, API_BASE_URL } from '@/app/config/api.config';
import { ThemedText } from '@/components/themed-text';
import { LinearGradient } from 'expo-linear-gradient';

export default function ProfileScreen() {
  const { user, logout, refetchUser } = useAuth();
  const [logoutVisible, setLogoutVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetchUser();
    setRefreshing(false);
  };

  const confirmLogout = async () => {
    setLogoutVisible(false);
    await logout();
  };

  const handleInviteFriends = () => {
    Alert.alert(
      'Invite Friends',
      'Share HealthBridge with your friends and family!',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Share',
          onPress: () => {
            // In a real app, you'd use Share API
            Alert.alert('Share', 'Sharing functionality would go here');
          },
        },
      ]
    );
  };

  const handleHelp = () => {
    Alert.alert(
      'Help & Support',
      'Need assistance? Contact us:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Email Support',
          onPress: () => Linking.openURL('mailto:support@carespot.com'),
        },
        {
          text: 'Call Support',
          onPress: () => Linking.openURL('tel:+911234567890'),
        },
      ]
    );
  };

  const handleSettings = () => {
    Alert.alert('Settings', 'Settings screen coming soon!');
  };

  const handlePaymentMethods = () => {
    Alert.alert('Payment Methods', 'Payment management coming soon!');
  };

  if (!user) {
    return (
      <View style={styles.lockedContainer}>
        <View style={styles.lockedContent}>
          <LinearGradient
            colors={[COLORS.primary + '20', COLORS.primary + '05']}
            style={styles.lockIconCircle}
          >
            <MaterialCommunityIcons name="account-lock-outline" size={80} color={COLORS.primary} />
          </LinearGradient>

          <ThemedText style={styles.lockedTitle}>Profile Locked</ThemedText>
          <ThemedText style={styles.lockedSubtitle}>
            Please log in to view your profile, manage bookings, and access medical history.
          </ThemedText>

          <TouchableOpacity
            style={styles.loginBtn}
            onPress={() => router.push('/login')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[COLORS.primary, '#0ea5e9']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.loginGradient}
            >
              <MaterialCommunityIcons name="login" size={24} color="#FFF" />
              <Text style={styles.loginBtnText}>Login Now</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/signup')}
            style={styles.signupLink}
          >
            <Text style={styles.signupText}>
              Don't have an account? <Text style={styles.signupHighlight}>Sign Up</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerContainer}>
          <Text style={styles.header}>Profile</Text>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarWrapper}>
            <Image
              source={
                user?.profilePhoto
                  ? user.profilePhoto.startsWith('http')
                    ? { uri: user.profilePhoto }
                    : { uri: `${API_BASE_URL}${user.profilePhoto}` }
                  : { uri: 'https://i.pravatar.cc/300' }
              }
              style={styles.avatar}
              contentFit="cover"
              transition={1000}
              cachePolicy="none"
            />
          </View>

          <Text style={styles.name}>{user?.name || 'User'}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          {user?.role === 'admin' && (
            <View style={styles.adminBadge}>
              <MaterialCommunityIcons name="shield-star" size={14} color={COLORS.primary} />
              <Text style={styles.adminText}>Admin</Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => router.push('/profile/edit-profile')}
          >
            <MaterialCommunityIcons name="pencil" size={16} color="#FFF" />
            <Text style={styles.editBtnText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Personal Info */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <View style={styles.infoCard}>
            <InfoItem icon="calendar" label="Age" value={user?.age || 'Not set'} />
            <InfoItem icon="map-marker" label="Location" value={user?.location || 'Not set'} />
            <InfoItem icon="phone" label="Phone" value={user?.phone || 'Not set'} />
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="calendar-check" size={24} color={COLORS.primary} />
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Bookings</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="heart" size={24} color={COLORS.error} />
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Favorites</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="star" size={24} color="#FFB800" />
            <Text style={styles.statValue}>5.0</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
        </View>

        {/* Menu */}
        <View style={styles.menu}>
          <Text style={styles.sectionTitle}>Account</Text>
          <MenuItem
            icon="time-outline"
            label="Booking History"
            onPress={() => router.push('/profile/booking-history')}
          />
          <MenuItem
            icon="card-outline"
            label="Payment Methods"
            onPress={handlePaymentMethods}
          />

          <Text style={styles.sectionTitle}>General</Text>
          <MenuItem
            icon="person-add-outline"
            label="Invite Friends"
            onPress={handleInviteFriends}
          />
          <MenuItem
            icon="help-circle-outline"
            label="Help & Support"
            onPress={handleHelp}
          />
          <MenuItem
            icon="settings-outline"
            label="Settings"
            onPress={handleSettings}
          />

          <MenuItem
            icon="log-out-outline"
            label="Logout"
            danger
            onPress={() => setLogoutVisible(true)}
          />
        </View>

        {/* App Version */}
        <Text style={styles.version}>HealthBridge v1.0.0</Text>
      </ScrollView>

      {/* Logout Modal */}
      <Modal
        transparent
        animationType="fade"
        visible={logoutVisible}
        onRequestClose={() => setLogoutVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.logoutIcon}>
              <Ionicons name="log-out-outline" size={32} color={COLORS.primary} />
            </View>

            <Text style={styles.modalTitle}>Logout</Text>
            <Text style={styles.modalSub}>
              Are you sure you want to logout?
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setLogoutVisible(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.logoutBtn}
                onPress={confirmLogout}
              >
                <Text style={styles.logoutText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

function InfoItem({ icon, label, value }: { icon: any, label: string, value: string }) {
  return (
    <View style={styles.infoItem}>
      <View style={styles.infoIconContainer}>
        <MaterialCommunityIcons name={icon} size={20} color={COLORS.primary} />
      </View>
      <View style={styles.infoTextContainer}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

function MenuItem({
  icon,
  label,
  danger = false,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  danger?: boolean;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.menuItem}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <View style={[styles.iconContainer, danger && styles.dangerIconContainer]}>
        <Ionicons
          name={icon}
          size={20}
          color={danger ? COLORS.error : COLORS.primary}
        />
      </View>
      <Text style={[styles.menuText, danger && { color: COLORS.error }]}>
        {label}
      </Text>
      <Ionicons name="chevron-forward" size={20} color="#999" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  headerContainer: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: COLORS.white,
  },

  header: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
  },

  profileCard: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: COLORS.white,
    marginBottom: 16,
  },

  avatarWrapper: {
    position: 'relative',
    marginBottom: 16,
  },

  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: COLORS.primary,
  },

  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.success,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.white,
  },

  name: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4,
  },

  email: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 12,
  },

  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },

  adminText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },

  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    ...SHADOWS.small,
  },

  editBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 15,
  },

  statsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    marginBottom: 16,
    paddingVertical: 20,
    ...SHADOWS.small,
  },

  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },

  statDivider: {
    width: 1,
    backgroundColor: COLORS.border,
  },

  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: 8,
  },

  statLabel: {
    fontSize: 12,
    color: COLORS.textLight,
  },

  menu: {
    backgroundColor: COLORS.white,
    marginBottom: 16,
  },

  infoSection: {
    backgroundColor: COLORS.white,
    marginBottom: 16,
    paddingBottom: 20,
  },

  infoCard: {
    paddingHorizontal: 20,
    gap: 16,
  },

  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  infoIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
  },

  infoTextContainer: {
    flex: 1,
  },

  infoLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    marginBottom: 2,
  },

  infoValue: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '600',
  },

  cameraBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textLight,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  dangerIconContainer: {
    backgroundColor: COLORS.error + '15',
  },

  menuText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '600',
  },

  version: {
    textAlign: 'center',
    fontSize: 12,
    color: COLORS.textLight,
    paddingVertical: 20,
  },

  /* Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  modalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    ...SHADOWS.large,
  },

  logoutIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },

  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
    color: COLORS.text,
  },

  modalSub: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: 24,
  },

  modalActions: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },

  cancelBtn: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },

  cancelText: {
    color: COLORS.text,
    fontWeight: '700',
    fontSize: 15,
  },

  logoutBtn: {
    flex: 1,
    backgroundColor: COLORS.error,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },

  logoutText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 15,
  },

  /* Locked State Styles */
  lockedContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  lockedContent: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 40,
    borderRadius: 32,
    ...SHADOWS.medium,
  },
  lockIconCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  lockedTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.text,
    marginBottom: 12,
  },
  lockedSubtitle: {
    fontSize: 16,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  loginBtn: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  loginGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 12,
  },
  loginBtnText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '800',
  },
  signupLink: {
    marginTop: 24,
    padding: 10,
  },
  signupText: {
    fontSize: 15,
    color: COLORS.textLight,
  },
  signupHighlight: {
    color: COLORS.primary,
    fontWeight: '800',
  },
});
