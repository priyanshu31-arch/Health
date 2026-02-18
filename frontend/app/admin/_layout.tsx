import { Stack, Redirect } from 'expo-router';
import { useAuth } from '../../context/AuthContext';

export default function AdminLayout() {
    const { user, isLoading } = useAuth();

    if (!isLoading && user?.role !== 'admin') {
        return <Redirect href="/login" />;
    }

    return (
        <Stack>
            <Stack.Screen name="index" options={{ title: 'Admin Dashboard', headerShown: false }} />
            <Stack.Screen name="register-hospital" options={{ title: 'Register Hospital', headerBackTitle: 'Dashboard' }} />
            <Stack.Screen name="manage-beds" options={{ title: 'Manage Beds', headerBackTitle: 'Dashboard' }} />
            <Stack.Screen name="manage-ambulances" options={{ title: 'Manage Ambulances', headerBackTitle: 'Dashboard' }} />
        </Stack>
    );
}
