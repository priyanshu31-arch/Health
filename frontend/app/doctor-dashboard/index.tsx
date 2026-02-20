import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { COLORS, FONTS, SHADOWS } from '../../constants/theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function DoctorDashboard() {
    const router = useRouter();

    const menuItems = [
        {
            id: 1,
            title: 'Request Patient Access',
            icon: 'account-key',
            color: '#0891B2',
            path: '/doctor-dashboard/request-access',
        },
        {
            id: 2,
            title: 'My Patients',
            icon: 'account-group',
            color: '#10B981',
            path: '/doctor-dashboard/my-patients', // Future feature
        },
    ];

    return (
        <ThemedView style={styles.container}>
            <Stack.Screen options={{ title: 'Doctor Dashboard', headerTitleStyle: { fontFamily: FONTS.semiBold } }} />

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.header}>
                    <ThemedText style={styles.welcomeText}>Welcome, Doctor</ThemedText>
                    <ThemedText style={styles.subtitle}>Manage your patients and access records.</ThemedText>
                </View>

                <View style={styles.grid}>
                    {menuItems.map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            style={styles.card}
                            onPress={() => router.push(item.path as any)}
                            activeOpacity={0.9}
                        >
                            <LinearGradient
                                colors={[item.color, item.color + 'CC']}
                                style={styles.cardGradient}
                            >
                                <MaterialCommunityIcons name={item.icon as any} size={32} color={COLORS.white} />
                                <ThemedText style={styles.cardTitle}>{item.title}</ThemedText>
                            </LinearGradient>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    content: {
        padding: 20,
    },
    header: {
        marginBottom: 24,
    },
    welcomeText: {
        fontSize: 24,
        fontFamily: FONTS.semiBold,
        color: COLORS.text,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 16,
        color: COLORS.textLight,
        fontFamily: FONTS.regular,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
    },
    card: {
        width: '47%',
        height: 140,
        borderRadius: 20,
        ...SHADOWS.medium,
        overflow: 'hidden',
    },
    cardGradient: {
        flex: 1,
        padding: 16,
        justifyContent: 'space-between',
    },
    cardTitle: {
        fontSize: 16,
        fontFamily: FONTS.medium,
        color: COLORS.white,
    },
});
