import React, { useEffect } from 'react';
import { View, StyleSheet, DimensionValue } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, interpolate } from 'react-native-reanimated';

interface ShimmerProps {
    width: DimensionValue;
    height: DimensionValue;
    borderRadius?: number;
    style?: any;
}

const Shimmer = ({ width, height, borderRadius = 8, style }: ShimmerProps) => {
    const shimmerValue = useSharedValue(-1);
    const widthVal = typeof width === 'number' ? width : 400; // Estimate for percentage

    useEffect(() => {
        shimmerValue.value = withRepeat(
            withTiming(1, {
                duration: 1500,
                easing: Easing.linear,
            }),
            -1, // Infinite
            false // Do not reverse
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [
                {
                    translateX: interpolate(
                        shimmerValue.value,
                        [-1, 1],
                        [-widthVal, widthVal]
                    ),
                },
            ],
        };
    });

    return (
        <View
            style={[
                styles.container,
                { width: width as any, height: height as any, borderRadius },
                style,
            ]}
        >
            <Animated.View
                style={[
                    StyleSheet.absoluteFill,
                    { width: widthVal },
                    animatedStyle,
                ]}
            >
                <LinearGradient
                    colors={['transparent', 'rgba(255, 255, 255, 0.4)', 'transparent']}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={StyleSheet.absoluteFill}
                />
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#E1E9EE',
        overflow: 'hidden',
    },
});

export default Shimmer;
