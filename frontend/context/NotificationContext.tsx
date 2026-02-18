import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Notification {
    id: string;
    title: string;
    body: string;
    time: string;
    isUnread: boolean;
    type: 'booking' | 'system' | 'chat';
}

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    addNotification: (title: string, body: string, type?: Notification['type']) => void;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    useEffect(() => {
        loadNotifications();
    }, []);

    const loadNotifications = async () => {
        try {
            const saved = await AsyncStorage.getItem('notifications');
            if (saved) {
                setNotifications(JSON.parse(saved));
            }
        } catch (error) {
            console.error('Failed to load notifications', error);
        }
    };

    const saveNotifications = async (updated: Notification[]) => {
        try {
            await AsyncStorage.setItem('notifications', JSON.stringify(updated));
        } catch (error) {
            console.error('Failed to save notifications', error);
        }
    };

    const addNotification = (title: string, body: string, type: Notification['type'] = 'system') => {
        const newNotification: Notification = {
            id: Date.now().toString(),
            title,
            body,
            time: new Date().toISOString(),
            isUnread: true,
            type,
        };

        setNotifications(prev => {
            const updated = [newNotification, ...prev].slice(0, 50);
            saveNotifications(updated);
            return updated;
        });
    };

    const markAsRead = (id: string) => {
        setNotifications(prev => {
            const updated = prev.map(n => n.id === id ? { ...n, isUnread: false } : n);
            saveNotifications(updated);
            return updated;
        });
    };

    const markAllAsRead = () => {
        setNotifications(prev => {
            const updated = prev.map(n => ({ ...n, isUnread: false }));
            saveNotifications(updated);
            return updated;
        });
    };

    const clearNotifications = () => {
        setNotifications([]);
        saveNotifications([]);
    };

    const unreadCount = notifications.filter(n => n.isUnread).length;

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            addNotification,
            markAsRead,
            markAllAsRead,
            clearNotifications
        }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};
