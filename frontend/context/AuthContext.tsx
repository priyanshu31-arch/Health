import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useSegments } from 'expo-router';

interface AuthContextType {
    user: any;
    token: string | null;
    isLoading: boolean;
    login: (token: string, userData: any) => Promise<void>;
    logout: () => Promise<void>;
    updateUser: (userData: any) => Promise<void>;
    refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    token: null,
    isLoading: true,
    login: async () => { },
    logout: async () => { },
    updateUser: async () => { },
    refetchUser: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<any>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const segments = useSegments();

    useEffect(() => {
        const loadAuth = async () => {
            try {
                const storedToken = await AsyncStorage.getItem('token');
                const storedUser = await AsyncStorage.getItem('user');

                if (storedToken && storedUser) {
                    setToken(storedToken);
                    setUser(JSON.parse(storedUser));
                }
            } catch (error) {
                console.error('Failed to load auth', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadAuth();
    }, []);

    useEffect(() => {
        if (isLoading) return;

        const inAuthGroup = segments[0] === 'login' || segments[0] === 'signup';

        if (!token && !inAuthGroup) {
            // Allow guests to view the app
        } else if (token && inAuthGroup) {
            if (user?.role === 'admin') {
                router.replace('/admin');
            } else {
                router.replace('/(tabs)');
            }
        }
    }, [token, segments, isLoading, user]);

    const login = async (newToken: string, userData: any) => {
        try {
            await AsyncStorage.setItem('token', newToken);
            await AsyncStorage.setItem('user', JSON.stringify(userData));

            setToken(newToken);
            setUser(userData);

            if (userData.role === 'admin') {
                router.replace('/admin');
            } else {
                router.replace('/(tabs)');
            }
        } catch (error) {
            console.error('Login error', error);
        }
    };

    const logout = async () => {
        try {
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('user');
            setToken(null);
            setUser(null);
            // Optionally redirect to login or home
            router.replace('/login');
        } catch (error) {
            console.error('Logout error', error);
        }
    };

    const updateUser = async (updatedData: any) => {
        try {
            const newUser = { ...user, ...updatedData };
            await AsyncStorage.setItem('user', JSON.stringify(newUser));
            setUser(newUser);
        } catch (error) {
            console.error('Update user error', error);
        }
    };

    const refetchUser = async () => {
        try {
            const userData = await import('@/app/config/api.config').then(m => m.api.getProfile());
            await AsyncStorage.setItem('user', JSON.stringify(userData));
            setUser(userData);
        } catch (error: any) {
            console.error('Refetch user error:', error);
            if (error.message.includes('expired') || error.message.includes('login')) {
                logout();
            }
        }
    };

    return (
        <AuthContext.Provider value={{ user, token, isLoading, login, logout, updateUser, refetchUser }}>
            {children}
        </AuthContext.Provider>
    );
};
