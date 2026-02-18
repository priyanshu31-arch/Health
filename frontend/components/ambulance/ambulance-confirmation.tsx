import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

const AmbulanceConfirmationScreen = () => {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Booking confirmed content here */}

      <TouchableOpacity style={styles.homeButton} onPress={() => router.push('/(tabs)/ambulance')}>
        <Text style={styles.homeButtonText}>Back to Home</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.trackButton} onPress={() => {}}>
        <Text style={styles.trackButtonText}>Track Now</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  homeButton: {
    margin: 16,
    padding: 16,
    backgroundColor: '#E0F7FA',
    borderRadius: 8,
    alignItems: 'center',
  },
  homeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007E8B',
  },
  trackButton: {
    margin: 16,
    padding: 16,
    backgroundColor: '#007E8B',
    borderRadius: 8,
    alignItems: 'center',
  },
  trackButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
});

export default AmbulanceConfirmationScreen;
