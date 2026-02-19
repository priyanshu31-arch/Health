import { Stack, Redirect } from 'expo-router';
import { useAuth } from '../../context/AuthContext';

export default function AdminLayout() {
    const { user, isLoading } = useAuth();

    if (!isLoading && user?.role !== 'admin') {
        return <Redirect href="/login" />;
    }

    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="register-hospital" />
            <Stack.Screen name="manage-beds" />
            <Stack.Screen name="manage-ambulances" />
        </Stack>
    );
}
