import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../../contexts/ThemeContext';

interface WarehouseTileProps {
    title: string;
    icon: React.ReactNode;
    gradientColors: readonly [string, string, ...string[]];
    onPress: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const WarehouseTile: React.FC<WarehouseTileProps> = React.memo(
    ({ title, icon, gradientColors, onPress }) => {
        const { colors } = useTheme();
        const scale = useSharedValue(1);

        const animatedStyle = useAnimatedStyle(() => ({
            transform: [{ scale: scale.value }],
        }));

        const handlePressIn = React.useCallback(() => {
            scale.value = withSpring(0.95, {
                damping: 15,
                stiffness: 300,
            });
        }, [scale]);

        const handlePressOut = React.useCallback(() => {
            scale.value = withSpring(1, {
                damping: 15,
                stiffness: 300,
            });
        }, [scale]);

        return (
            <AnimatedPressable
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                style={[styles.container, animatedStyle]}
            >
                <LinearGradient
                    colors={gradientColors}
                    start={[0, 0]}
                    end={[1, 1]}
                    style={styles.gradient}
                >
                    {icon}
                    <Text style={[styles.title, { color: '#FFFFFF' }]}>{title}</Text>
                </LinearGradient>
            </AnimatedPressable>
        );
    }
);

WarehouseTile.displayName = 'WarehouseTile';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        minHeight: 140,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    gradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        gap: 12,
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        textAlign: 'center',
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
});
