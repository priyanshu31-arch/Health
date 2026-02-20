import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Link, useRouter, Stack } from 'expo-router';
import { api } from '../config/api.config';
import { COLORS, FONTS, SHADOWS } from '../../constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

interface HealthRecord {
    _id: string;
    type: string;
    value: string;
    unit?: string;
    notes?: string;
    date: string;
    file?: string;
}

export default function HealthRecordsScreen() {
    const router = useRouter();
    const [records, setRecords] = useState<HealthRecord[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchRecords = async () => {
        try {
            setLoading(true);
            const data = await api.getHealthRecords();
            setRecords(data);
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to fetch records');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRecords();
    }, []);

    const handleDelete = (id: string) => {
        Alert.alert(
            'Delete Record',
            'Are you sure you want to delete this record?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.deleteHealthRecord(id);
                            fetchRecords();
                        } catch (error: any) {
                            Alert.alert('Error', error.message || 'Failed to delete record');
                        }
                    },
                },
            ]
        );
    };

    const renderItem = ({ item }: { item: HealthRecord }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.typeContainer}>
                    <MaterialCommunityIcons name="file-document-outline" size={24} color={COLORS.primary} />
                    <Text style={styles.type}>{item.type}</Text>
                </View>
                <TouchableOpacity onPress={() => handleDelete(item._id)}>
                    <MaterialCommunityIcons name="trash-can-outline" size={20} color={COLORS.error} />
                </TouchableOpacity>
            </View>

            <View style={styles.valueContainer}>
                <Text style={styles.value}>{item.value}</Text>
                {item.unit && <Text style={styles.unit}>{item.unit}</Text>}
            </View>

            {item.notes && <Text style={styles.notes}>{item.notes}</Text>}

            <View style={styles.footer}>
                <Text style={styles.date}>{new Date(item.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</Text>
                {item.file && (
                    <TouchableOpacity style={styles.viewFileBtn} onPress={() => Alert.alert('File', 'File viewing not implemented yet')}>
                        <Text style={styles.viewFileText}>View File</Text>
                        <MaterialCommunityIcons name="arrow-right" size={14} color={COLORS.primary} />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );

    return (
        <ThemedView style={styles.container}>
            <Stack.Screen options={{ title: 'My Health Records', headerBackTitle: 'Profile' }} />

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : records.length === 0 ? (
                <View style={styles.center}>
                    <MaterialCommunityIcons name="folder-open-outline" size={64} color={COLORS.textLight} />
                    <ThemedText style={styles.emptyText}>No records found</ThemedText>
                    <Link href="/health-records/add" asChild>
                        <TouchableOpacity style={styles.addButtonEmpty}>
                            <Text style={styles.addButtonText}>Add First Record</Text>
                        </TouchableOpacity>
                    </Link>
                </View>
            ) : (
                <FlatList
                    data={records}
                    renderItem={renderItem}
                    keyExtractor={item => item._id}
                    contentContainerStyle={styles.list}
                />
            )}

            {records.length > 0 && (
                <Link href="/health-records/add" asChild>
                    <TouchableOpacity style={styles.fab}>
                        <MaterialCommunityIcons name="plus" size={32} color={COLORS.white} />
                    </TouchableOpacity>
                </Link>
            )}
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    list: {
        padding: 20,
        paddingBottom: 100,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        marginTop: 16,
        marginBottom: 24,
        fontSize: 16,
        color: COLORS.textLight,
        fontFamily: FONTS.medium,
    },
    card: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        ...SHADOWS.medium,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    typeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    type: {
        fontSize: 16,
        fontFamily: FONTS.semiBold,
        color: COLORS.text,
    },
    valueContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: 8,
        gap: 4,
    },
    value: {
        fontSize: 24,
        fontFamily: FONTS.bold,
        color: COLORS.primary,
    },
    unit: {
        fontSize: 16,
        color: COLORS.textLight,
        fontFamily: FONTS.medium,
    },
    notes: {
        fontSize: 14,
        color: COLORS.textLight,
        fontFamily: FONTS.regular,
        marginBottom: 12,
        fontStyle: 'italic',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    date: {
        fontSize: 12,
        color: COLORS.textLight,
        fontFamily: FONTS.regular,
    },
    viewFileBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    viewFileText: {
        fontSize: 12,
        color: COLORS.primary,
        fontFamily: FONTS.medium,
    },
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 20,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.large,
    },
    addButtonEmpty: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 24,
    },
    addButtonText: {
        color: COLORS.white,
        fontFamily: FONTS.medium,
        fontSize: 16,
    },
});
