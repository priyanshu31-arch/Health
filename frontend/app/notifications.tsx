import React from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { COLORS, SHADOWS, FONTS } from '@/constants/theme';
import { useNotifications, Notification } from '@/context/NotificationContext';

export default function NotificationsScreen() {
    const router = useRouter();
    const { notifications, addNotification, markAsRead, markAllAsRead, clearNotifications } = useNotifications();

    const renderItem = ({ item, index }: { item: Notification, index: number }) => (
        <Animated.View
            entering={FadeInDown.delay(index * 100).duration(500)}
            style={[styles.itemContainer, item.isUnread && styles.unreadItem]}
        >
            <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => markAsRead(item.id)}
                style={styles.itemContent}
            >
                <View style={[styles.iconContainer, { backgroundColor: getIconBg(item.type) }]}>
                    <MaterialCommunityIcons
                        name={getIconName(item.type)}
                        size={24}
                        color={getIconColor(item.type)}
                    />
                </View>

                <View style={styles.textContainer}>
                    <ThemedText style={styles.itemTitle}>{item.title}</ThemedText>
                    <ThemedText style={styles.itemBody}>{item.body}</ThemedText>
                    <ThemedText style={styles.itemTime}>{formatTime(item.time)}</ThemedText>
                </View>

                {item.isUnread && <View style={styles.unreadDot} />}
            </TouchableOpacity>
        </Animated.View>
    );

    const getIconName = (type: string) => {
        switch (type) {
            case 'booking': return 'calendar-check';
            case 'chat': return 'message-text';
            default: return 'bell-ring';
        }
    };

    const getIconBg = (type: string) => {
        switch (type) {
            case 'booking': return COLORS.primary + '20';
            case 'chat': return COLORS.secondary + '20';
            default: return COLORS.accent + '20';
        }
    };

    const getIconColor = (type: string) => {
        switch (type) {
            case 'booking': return COLORS.primary;
            case 'chat': return COLORS.secondary;
            default: return COLORS.accent;
        }
    };

    const formatTime = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <MaterialCommunityIcons name="close" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <ThemedText style={styles.headerTitle}>Notifications</ThemedText>
                <TouchableOpacity onPress={markAllAsRead}>
                    <ThemedText style={styles.headerAction}>Mark All Read</ThemedText>
                </TouchableOpacity>
            </View>

            <FlatList
                data={notifications}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <MaterialCommunityIcons name="bell-off-outline" size={64} color={COLORS.textLight} />
                        <ThemedText style={styles.emptyText}>No notifications yet</ThemedText>
                    </View>
                }
            />

            {notifications.length > 0 && (
                <TouchableOpacity onPress={clearNotifications} style={styles.clearAllButton}>
                    <ThemedText style={styles.clearAllText}>Clear All History</ThemedText>
                </TouchableOpacity>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontFamily: FONTS.bold,
    },
    headerAction: {
        fontSize: 14,
        color: COLORS.primary,
        fontFamily: FONTS.semiBold,
    },
    listContent: {
        padding: 20,
        flexGrow: 1,
    },
    itemContainer: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        marginBottom: 12,
        ...SHADOWS.small,
        overflow: 'hidden',
    },
    unreadItem: {
        borderLeftWidth: 4,
        borderLeftColor: COLORS.primary,
    },
    itemContent: {
        flexDirection: 'row',
        padding: 16,
        alignItems: 'center',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    textContainer: {
        flex: 1,
    },
    itemTitle: {
        fontSize: 16,
        fontFamily: FONTS.bold,
        color: COLORS.text,
        marginBottom: 4,
    },
    itemBody: {
        fontSize: 14,
        color: COLORS.textLight,
        lineHeight: 18,
    },
    itemTime: {
        fontSize: 12,
        color: COLORS.textLight,
        marginTop: 6,
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.primary,
        marginLeft: 8,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 100,
    },
    emptyText: {
        fontSize: 16,
        color: COLORS.textLight,
        marginTop: 16,
    },
    clearAllButton: {
        margin: 20,
        padding: 16,
        borderRadius: 12,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        alignItems: 'center',
    },
    clearAllText: {
        color: COLORS.error,
        fontFamily: FONTS.semiBold,
    },
});
