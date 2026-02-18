import { ScrollView, Text, StyleSheet, View, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { api } from '@/app/config/api.config';

export default function BookingHistory() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const data = await api.getMyBookings();
      setBookings(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons
          name="chevron-back"
          size={24}
          color="#000"
          onPress={() => router.back()}
        />
        <Text style={styles.title}>Booking history</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#FF0000" />
        </View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No booking history found.</Text>
          }
          renderItem={({ item }) => (
            <HistoryCard
              name={item.hospital?.name || 'Unknown Hospital'}
              type={item.bookingType.toUpperCase()}
              date={new Date(item.bookedAt).toLocaleDateString()}
              status="Confirmed"
              showTrack={item.bookingType === 'ambulance'}
              onTrack={() => router.push({
                pathname: '/tracking',
                params: {
                  bookingId: item._id,
                  vehicleNumber: item.itemId?.vehicleNumber || 'Unknown',
                  role: 'user'
                }
              })}
            />
          )}
        />
      )}
    </View>
  );
}

function HistoryCard({
  name,
  type,
  date,
  status,
  showTrack,
  onTrack,
}: {
  name: string;
  type: string;
  date: string;
  status: string;
  showTrack?: boolean;
  onTrack?: () => void;
}) {
  return (
    <View style={styles.card}>
      <View style={[styles.iconBox, { backgroundColor: type === 'BED' ? '#E3F2FD' : '#FFEEEE' }]}>
        <Ionicons
          name={type === 'BED' ? "bed-outline" : "car-outline"}
          size={24}
          color={type === 'BED' ? "#1976D2" : "#D32F2F"}
        />
      </View>

      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{name}</Text>
        <View style={styles.ratingRow}>
          <Text style={styles.ratingText}>{date} • {type}</Text>
        </View>
        {showTrack && (
          <TouchableOpacity style={styles.trackBtn} onPress={onTrack}>
            <Text style={styles.trackText}>Track Live</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.statusBadge}>
        <Text style={styles.statusText}>{status}</Text>
      </View>
    </View>
  );
}

/* Styles — MATCH PROFILE THEME */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 32,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },

  title: {
    fontSize: 20,
    fontWeight: '800',
    marginLeft: 12,
    color: '#000',
  },

  section: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 24,
    marginBottom: 12,
    color: '#000',
  },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },

  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
    color: '#000',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 13,
    color: '#777',
    marginLeft: 4,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: '#777',
    marginTop: 40,
    fontSize: 16,
  },
  statusBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    color: '#2E7D32',
    fontWeight: '700',
    fontSize: 12,
  },
  trackBtn: {
    backgroundColor: '#FF5252',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  trackText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
});
