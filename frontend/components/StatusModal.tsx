import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '@/constants/theme';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';

interface StatusModalProps {
    visible: boolean;
    type: 'success' | 'error';
    title?: string;
    message: string;
    onClose: () => void;
    actionText?: string;
    onAction?: () => void;
}

export default function StatusModal({
    visible,
    type,
    title,
    message,
    onClose,
    actionText = 'OK',
    onAction
}: StatusModalProps) {

    const isSuccess = type === 'success';
    const iconName = isSuccess ? 'checkmark-circle' : 'alert-circle';
    const color = isSuccess ? COLORS.success : COLORS.error;
    const defaultTitle = isSuccess ? 'Success' : 'Error';

    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <Animated.View
                    entering={ZoomIn.duration(300)}
                    style={styles.container}
                >
                    <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
                        <Ionicons name={iconName} size={48} color={color} />
                    </View>

                    <Text style={styles.title}>{title || defaultTitle}</Text>
                    <Text style={styles.message}>{message}</Text>

                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: color }]}
                        onPress={() => {
                            if (onAction) onAction();
                            onClose();
                        }}
                    >
                        <Text style={styles.buttonText}>{actionText}</Text>
                    </TouchableOpacity>
                </Animated.View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    container: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 32,
        alignItems: 'center',
        width: '100%',
        maxWidth: 340,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 10,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 22,
        fontFamily: FONTS.bold,
        color: '#000',
        marginBottom: 10,
        textAlign: 'center',
    },
    message: {
        fontSize: 15,
        color: '#666',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
        fontFamily: FONTS.regular,
    },
    button: {
        width: '100%',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontFamily: FONTS.bold,
    },
});
