import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../../contexts/ThemeContext';

export type IntakeStep = 'upload' | 'mapping' | 'preview';

interface Props {
    currentStep: IntakeStep;
}

export const IntakeStepper = ({ currentStep }: Props) => {
    const { colors } = useTheme();

    const steps: { key: IntakeStep; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
        { key: 'upload', label: 'Nahrať', icon: 'cloud-upload' },
        { key: 'mapping', label: 'Mapovať', icon: 'list' },
        { key: 'preview', label: 'Kontrola', icon: 'checkmark-circle' },
    ];

    const getStepState = (stepKey: IntakeStep) => {
        const stepOrder = ['upload', 'mapping', 'preview'];
        const currentIndex = stepOrder.indexOf(currentStep);
        const stepIndex = stepOrder.indexOf(stepKey);

        if (stepIndex < currentIndex) return 'completed';
        if (stepIndex === currentIndex) return 'active';
        return 'inactive';
    };

    return (
        <View style={styles.container}>
            {steps.map((step, index) => {
                const state = getStepState(step.key);
                const isActive = state === 'active';
                const isCompleted = state === 'completed';

                let iconColor = colors.textSecondary;
                let textColor = colors.textSecondary;
                let bgColor = colors.card;
                let borderColor = colors.border;

                if (isActive) {
                    iconColor = '#fff';
                    textColor = colors.primary;
                    bgColor = colors.primary;
                    borderColor = colors.primary;
                } else if (isCompleted) {
                    iconColor = colors.primary;
                    textColor = colors.primary;
                    bgColor = colors.card;
                    borderColor = colors.primary;
                }

                return (
                    <View key={step.key} style={styles.stepWrapper}>
                        {/* Connecting Line */}
                        {index > 0 && (
                            <View
                                style={[
                                    styles.connector,
                                    { backgroundColor: isCompleted || isActive ? colors.primary : colors.border },
                                ]}
                            />
                        )}

                        <View style={styles.stepContainer}>
                            <View
                                style={[
                                    styles.iconCircle,
                                    {
                                        backgroundColor: bgColor,
                                        borderColor: borderColor,
                                    },
                                ]}
                            >
                                <Ionicons
                                    name={isCompleted ? 'checkmark' : step.icon}
                                    size={16}
                                    color={iconColor}
                                />
                            </View>
                            <Text
                                style={[
                                    styles.label,
                                    {
                                        color: textColor,
                                        fontWeight: isActive ? '700' : '500',
                                    },
                                ]}
                            >
                                {step.label}
                            </Text>
                        </View>
                    </View>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    stepWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    connector: {
        height: 2,
        flex: 1,
        marginHorizontal: 8,
        borderRadius: 1,
        // absolute positioning to place it behind could be better, but flex works if structured well
        // For simplicity in this layout, we might need a different structure if lines need to be perfectly behind
        // But let's try this simple flex Row approach
        position: 'absolute',
        left: -50, // Hacky, let's rely on standard layout or absolute
        right: 50,
        top: 15,
        zIndex: -1,
        display: 'none', // Disabling line for now as simpler discrete steps look cleaner securely
    },
    stepContainer: {
        alignItems: 'center',
        gap: 6,
        flex: 1, // Distribute space
    },
    iconCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    label: {
        fontSize: 12,
    },
});
