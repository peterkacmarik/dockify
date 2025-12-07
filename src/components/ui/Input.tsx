import { Eye, EyeOff, Lock, Mail, User } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
    icon?: 'mail' | 'lock' | 'user';
    isPassword?: boolean;
}

export const Input = React.forwardRef<TextInput, InputProps>(
    ({ label, error, icon, isPassword, style, ...props }, ref) => {
        const [isPasswordVisible, setIsPasswordVisible] = React.useState(false);
        const [isFocused, setIsFocused] = React.useState(false);
        const { colors, theme } = useTheme();
        const isDark = theme === 'dark';

        const getIcon = () => {
            const color = colors.textSecondary;
            const size = 20;
            switch (icon) {
                case 'mail': return <Mail color={color} size={size} />;
                case 'lock': return <Lock color={color} size={size} />;
                case 'user': return <User color={color} size={size} />;
                default: return null;
            }
        };

        return (
            <View style={styles.container}>
                {label && <Text style={[styles.label, { color: colors.text }]}>{label}</Text>}

                <View style={[
                    styles.inputContainer,
                    {
                        backgroundColor: isDark ? '#1F2937' : '#F9FAFB',
                        borderColor: error ? colors.error : (isFocused ? colors.primary : colors.border)
                    }
                ]}>
                    {icon && <View style={styles.iconContainer}>{getIcon()}</View>}

                    <TextInput
                        ref={ref}
                        style={[
                            styles.input,
                            icon && styles.inputWithIcon,
                            { color: colors.text }
                        ]}
                        placeholderTextColor={colors.textSecondary}
                        onFocus={(e) => {
                            setIsFocused(true);
                            props.onFocus?.(e);
                        }}
                        onBlur={(e) => {
                            setIsFocused(false);
                            props.onBlur?.(e);
                        }}
                        {...props}
                        secureTextEntry={isPassword && !isPasswordVisible}
                    />

                    {isPassword && (
                        <TouchableOpacity
                            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                            style={styles.eyeIcon}
                        >
                            {isPasswordVisible ?
                                <EyeOff color={colors.textSecondary} size={20} /> :
                                <Eye color={colors.textSecondary} size={20} />
                            }
                        </TouchableOpacity>
                    )}
                </View>

                {error && <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>}
            </View>
        );
    }
);

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
        width: '100%',
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 6,
        marginLeft: 4,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 12,
        height: 50,
    },
    iconContainer: {
        paddingLeft: 12,
        paddingRight: 8,
    },
    input: {
        flex: 1,
        fontSize: 16,
        height: '100%',
        paddingHorizontal: 12,
    },
    inputWithIcon: {
        paddingLeft: 0,
    },
    eyeIcon: {
        paddingHorizontal: 12,
    },
    errorText: {
        fontSize: 12,
        marginTop: 4,
        marginLeft: 4,
    },
});
