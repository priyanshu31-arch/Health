import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ActivityIndicator,
    View,
    TouchableOpacityProps,
    TextStyle,
} from 'react-native';
import { COLORS, SHADOWS, FONTS } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

interface ThemedButtonProps extends TouchableOpacityProps {
    title: string;
    variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'gradient';
    isLoading?: boolean;
    textStyle?: TextStyle;
    icon?: React.ReactNode;
}

export function ThemedButton({
    title,
    variant = 'primary',
    isLoading = false,
    style,
    textStyle,
    icon,
    disabled,
    ...props
}: ThemedButtonProps) {
    const getTextColor = () => {
        if (variant === 'outline') return COLORS.primary;
        return COLORS.white;
    };

    const content = isLoading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
    ) : (
        <>
            {icon}
            <Text style={[styles.text, { color: getTextColor() }, textStyle]}>{title}</Text>
        </>
    );

    // Primary and gradient both use gradient (matching home page style)
    if (variant === 'primary' || variant === 'gradient') {
        return (
            <TouchableOpacity
                disabled={disabled || isLoading}
                style={[styles.button, styles.noPadding, disabled && styles.disabled, style as any]}
                activeOpacity={0.85}
                {...props}
            >
                <LinearGradient
                    colors={[COLORS.primary, COLORS.accent]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gradientInner}
                >
                    <View style={styles.buttonContent}>{content}</View>
                </LinearGradient>
            </TouchableOpacity>
        );
    }

    if (variant === 'secondary') {
        return (
            <TouchableOpacity
                disabled={disabled || isLoading}
                style={[styles.button, styles.noPadding, disabled && styles.disabled, style as any]}
                activeOpacity={0.85}
                {...props}
            >
                <LinearGradient
                    colors={[COLORS.secondary, '#0F766E']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gradientInner}
                >
                    <View style={styles.buttonContent}>{content}</View>
                </LinearGradient>
            </TouchableOpacity>
        );
    }

    if (variant === 'danger') {
        return (
            <TouchableOpacity
                disabled={disabled || isLoading}
                style={[styles.button, { backgroundColor: COLORS.error }, disabled && styles.disabled, style as any]}
                activeOpacity={0.85}
                {...props}
            >
                <View style={styles.buttonContent}>{content}</View>
            </TouchableOpacity>
        );
    }

    // Outline variant
    return (
        <TouchableOpacity
            disabled={disabled || isLoading}
            style={[
                styles.button,
                {
                    backgroundColor: 'transparent',
                    borderWidth: 1.5,
                    borderColor: COLORS.primary,
                },
                disabled && styles.disabled,
                style as any,
            ]}
            activeOpacity={0.85}
            {...props}
        >
            <View style={styles.buttonContent}>{content}</View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        borderRadius: 8, // More classic radius for smaller buttons
        minHeight: 40, // Reduced from 44 for a sleeker profile
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        ...SHADOWS.small,
    },
    noPadding: {
        padding: 0,
    },
    gradientInner: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6, // Reduced gap slightly
        paddingVertical: 8, // Reduced from 10
        paddingHorizontal: 16, // Reduced from 20
    },
    text: {
        fontSize: 14, // Reduced from 15 for better balance with smaller button
        fontFamily: FONTS.medium,
        textAlign: 'center',
        letterSpacing: 0.3,
    },
    disabled: {
        opacity: 0.6,
    },
});
