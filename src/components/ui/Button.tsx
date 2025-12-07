import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TextStyle, TouchableOpacity, TouchableOpacityProps, ViewStyle } from 'react-native';

interface ButtonProps extends TouchableOpacityProps {
    title: string;
    variant?: 'primary' | 'outline' | 'ghost';
    size?: 'default' | 'sm' | 'lg';
    loading?: boolean;
    icon?: React.ReactNode;
}

export const Button = ({
    title,
    variant = 'primary',
    size = 'default',
    loading = false,
    style,
    icon,
    disabled,
    ...props
}: ButtonProps) => {
    const getContainerStyle = (): ViewStyle[] => {
        const stylesList: ViewStyle[] = [styles.container];

        // Variant
        if (variant === 'primary') stylesList.push(styles.primaryContainer);
        if (variant === 'outline') stylesList.push(styles.outlineContainer);
        if (variant === 'ghost') stylesList.push(styles.ghostContainer);

        // Size
        if (size === 'default') stylesList.push(styles.defaultSize);
        if (size === 'sm') stylesList.push(styles.smSize);
        if (size === 'lg') stylesList.push(styles.lgSize);

        // Disabled
        if (disabled || loading) stylesList.push(styles.disabledContainer);

        return stylesList;
    };

    const getTextStyle = (): TextStyle[] => {
        const stylesList: TextStyle[] = [styles.text];

        // Variant
        if (variant === 'primary') stylesList.push(styles.primaryText);
        if (variant === 'outline') stylesList.push(styles.outlineText);
        if (variant === 'ghost') stylesList.push(styles.ghostText);

        // Size
        if (size === 'sm') stylesList.push(styles.smText);
        if (size === 'lg') stylesList.push(styles.lgText);

        return stylesList;
    };

    return (
        <TouchableOpacity
            style={[getContainerStyle(), style]}
            disabled={disabled || loading}
            activeOpacity={0.8}
            {...props}
        >
            {loading ? (
                <ActivityIndicator color={variant === 'primary' ? '#FFFFFF' : '#2563EB'} />
            ) : (
                <>
                    {icon && typeof icon !== 'string' && icon}
                    <Text style={[getTextStyle(), icon && typeof icon !== 'string' ? { marginLeft: 8 } : {}]}>{title}</Text>
                </>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    // Sizes
    defaultSize: {
        height: 50,
        paddingHorizontal: 20,
    },
    smSize: {
        height: 36,
        paddingHorizontal: 12,
    },
    lgSize: {
        height: 56,
        paddingHorizontal: 24,
    },
    // Variants - Container
    primaryContainer: {
        backgroundColor: '#2563EB',
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    outlineContainer: {
        backgroundColor: 'transparent',
        borderColor: '#E5E7EB',
    },
    ghostContainer: {
        backgroundColor: 'transparent',
    },
    disabledContainer: {
        opacity: 0.6,
    },
    // Text Base
    text: {
        fontWeight: '600',
        fontSize: 16,
    },
    // Variants - Text
    primaryText: {
        color: '#FFFFFF',
    },
    outlineText: {
        color: '#374151',
    },
    ghostText: {
        color: '#2563EB',
    },
    // Sizes - Text
    smText: {
        fontSize: 14,
    },
    lgText: {
        fontSize: 18,
    },
});
