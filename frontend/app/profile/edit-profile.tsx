import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/context/AuthContext';
import { api, API_BASE_URL } from '@/app/config/api.config';
import { COLORS, SHADOWS } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function EditProfile() {
  const { user, updateUser } = useAuth();

  // State for form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [age, setAge] = useState('');
  const [location, setLocation] = useState('');
  const [phone, setPhone] = useState('');
  const [profilePhoto, setProfilePhoto] = useState('');

  const [isInitializing, setIsInitializing] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [localImageUri, setLocalImageUri] = useState<string | null>(null);

  // Robust initialization: Force load from Storage and Context
  useEffect(() => {
    const initializeData = async () => {
      try {
        // First try the context data
        let userData = user;

        // If context isn't ready, try reading directly from storage
        if (!userData) {
          const storedUser = await AsyncStorage.getItem('user');
          if (storedUser) {
            userData = JSON.parse(storedUser);
          }
        }

        if (userData) {
          setName(userData.name || '');
          setEmail(userData.email || '');
          setAge(userData.age ? userData.age.toString() : '');
          setLocation(userData.location || '');
          setPhone(userData.phone || '');
          setProfilePhoto(userData.profilePhoto || '');
        }
      } catch (e) {
        console.error('Initialization error:', e);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeData();
  }, [user]);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Sorry, we need camera roll permissions to select a photo.');
        return;
      }

      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled) {
        setLocalImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !email.trim()) {
      Alert.alert('Error', 'Name and Email are required.');
      return;
    }

    setIsLoading(true);
    let finalPhoto = profilePhoto;

    try {
      // 1. Upload new photo if selected
      if (localImageUri) {
        setUploading(true);
        const formData = new FormData();

        if (Platform.OS === 'web') {
          const response = await fetch(localImageUri);
          const blob = await response.blob();
          formData.append('image', blob, 'profile.jpg');
        } else {
          // @ts-ignore
          formData.append('image', {
            uri: localImageUri,
            name: 'profile.jpg',
            type: 'image/jpeg',
          });
        }

        const uploadRes = await api.uploadImage(formData);
        finalPhoto = uploadRes.url;
        setProfilePhoto(finalPhoto);
        setUploading(false);
      }

      // 2. Submit all changes to backend
      const updateData = {
        name: name.trim(),
        email: email.trim(),
        profilePhoto: finalPhoto,
        age: age.toString(),
        location: location.trim(),
        phone: phone.trim(),
      };

      const updatedUserRes = await api.updateProfile(updateData);

      // 3. Update global AuthContext and return to profile
      await updateUser(updatedUserRes);

      Alert.alert('Success', 'Profile updated successfully!', [
        { text: 'OK', onPress: () => router.push('/(tabs)/profile') }
      ]);
    } catch (error: any) {
      console.error('Save Error:', error);
      Alert.alert('Error', error.msg || error.message || 'Failed to save profile. Please check your connection.');
    } finally {
      setIsLoading(false);
      setUploading(false);
    }
  };

  if (isInitializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading Profile...</Text>
      </View>
    );
  }

  const displayImageUri = localImageUri
    ? { uri: localImageUri }
    : profilePhoto
      ? { uri: `${API_BASE_URL}${profilePhoto}` }
      : { uri: 'https://i.pravatar.cc/300' };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar backgroundColor="#fff" barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Profile</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.avatarWrapper}>
          <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
            <Image source={displayImageUri} style={styles.avatar} contentFit="cover" transition={500} />
            {(isLoading || uploading) ? (
              <View style={[styles.avatarOverlay, { backgroundColor: 'rgba(0,0,0,0.3)' }]}>
                <ActivityIndicator color={COLORS.white} />
              </View>
            ) : (
              <View style={styles.cameraIcon}>
                <Ionicons name="camera" size={20} color={COLORS.white} />
              </View>
            )}
          </TouchableOpacity>
          <Text style={styles.changeText}>Update Photo</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={(text) => {
              const lettersOnly = text.replace(/[^A-Za-z\s]/g, '');
              setName(lettersOnly);
            }}
            placeholder="Your Name"
            placeholderTextColor="#999"
          />

          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Your Email"
            placeholderTextColor="#999"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Age</Text>
              <TextInput
                style={styles.input}
                value={age}
                onChangeText={(text) => {
                  const numbersOnly = text.replace(/[^0-9]/g, '');
                  if (text !== numbersOnly && text.length > 0) {
                    Alert.alert('Invalid Input', 'Please enter numbers only');
                  }
                  if (numbersOnly.length <= 3) {
                    setAge(numbersOnly);
                  } else {
                    Alert.alert('Limit Reached', 'Age cannot exceed 3 digits');
                  }
                }}
                placeholder="Age"
                placeholderTextColor="#999"
                keyboardType="numeric"
              />
            </View>
            <View style={{ width: 15 }} />
            <View style={{ flex: 2 }}>
              <Text style={styles.label}>Phone</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={(text) => {
                  const numbersOnly = text.replace(/[^0-9]/g, '');
                  if (text !== numbersOnly && text.length > 0) {
                    Alert.alert('Invalid Input', 'Please enter numbers only');
                  }
                  if (numbersOnly.length <= 10) {
                    setPhone(numbersOnly);
                  } else {
                    Alert.alert('Limit Reached', 'Phone number cannot exceed 10 digits');
                  }
                }}
                placeholder="Phone Number"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <Text style={styles.label}>Location</Text>
          <TextInput
            style={styles.input}
            value={location}
            onChangeText={setLocation}
            placeholder="City, Country"
            placeholderTextColor="#999"
          />
        </View>

        <TouchableOpacity
          style={[styles.doneBtn, (isLoading || uploading) && styles.disabledBtn]}
          onPress={handleSave}
          disabled={isLoading || uploading}
        >
          {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.doneText}>Save Changes</Text>}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  loadingText: { marginTop: 10, color: COLORS.textLight, fontSize: 16 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  scrollContent: { padding: 20 },
  avatarWrapper: { alignItems: 'center', marginBottom: 30 },
  avatarContainer: { position: 'relative' },
  avatar: { width: 140, height: 140, borderRadius: 70, borderWidth: 3, borderColor: COLORS.primary + '30' },
  avatarOverlay: { ...StyleSheet.absoluteFillObject, borderRadius: 70, justifyContent: 'center', alignItems: 'center' },
  cameraIcon: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    padding: 8,
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  changeText: { marginTop: 10, color: COLORS.primary, fontWeight: '600' },
  form: { marginBottom: 30 },
  row: { flexDirection: 'row', alignItems: 'center' },
  label: { fontSize: 13, fontWeight: '700', color: COLORS.textLight, marginBottom: 8, marginLeft: 5 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: COLORS.surface,
    color: '#000',
  },
  doneBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 18,
    borderRadius: 15,
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  disabledBtn: { opacity: 0.6 },
  doneText: { color: COLORS.white, fontWeight: '800', fontSize: 16 },
});
