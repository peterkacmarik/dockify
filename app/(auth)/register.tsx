import { zodResolver } from '@hookform/resolvers/zod';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, router } from 'expo-router';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';

import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { useTheme } from '../../src/contexts/ThemeContext';
import { supabase } from '../../src/lib/supabase';
import { performGoogleLogin } from '../../src/lib/oauth';

export default function RegisterScreen() {
    const { t } = useTranslation();
    const { colors, theme } = useTheme();
    const isDark = theme === 'dark';
    const [loading, setLoading] = useState(false);

    // Validation Schema with translations
    const registerSchema = z.object({
        email: z.string().email(t('auth.invalidEmail')),
        password: z.string().min(6, t('auth.passwordTooShort')),
        confirmPassword: z.string(),
    }).refine((data) => data.password === data.confirmPassword, {
        message: t('auth.passwordsDontMatch'),
        path: ["confirmPassword"],
    });

    type RegisterSchema = z.infer<typeof registerSchema>;

    const { control, handleSubmit, formState: { errors } } = useForm<RegisterSchema>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            email: '',
            password: '',
            confirmPassword: '',
        },
    });

    const onRegister = async (data: RegisterSchema) => {
        setLoading(true);
        const { error } = await supabase.auth.signUp({
            email: data.email,
            password: data.password,
        });

        if (error) {
            Alert.alert(t('auth.registrationFailed'), error.message);
        } else {
            Alert.alert(t('common.success'), t('auth.checkEmail'));
            router.replace('/(auth)/login');
        }
        setLoading(false);
    };

    const onGoogleSignIn = async () => {
        try {
            setLoading(true);
            const session = await performGoogleLogin();
            if (session) {
                router.replace('/');
            }
        } catch (error: any) {
            if (error) {
                Alert.alert('Google Login Error', error.message || 'Unknown error');
            }
        } finally {
            setLoading(false);
        }
    };

    const gradientColors = isDark
        ? (['#1F2937', '#374151', '#4B5563'] as const)
        : (['#667eea', '#764ba2', '#f093fb'] as const);

    return (
        <LinearGradient
            colors={gradientColors}
            style={styles.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
        >
            <SafeAreaView style={styles.safeArea}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.container}
                >
                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                        <View style={styles.header}>
                            <Text style={styles.logo}>🚀</Text>
                            <Text style={styles.title}>{t('auth.createAccount')}</Text>
                            <Text style={[styles.subtitle, { color: isDark ? colors.textSecondary : 'rgba(255, 255, 255, 0.9)' }]}>
                                {t('auth.joinDockify')}
                            </Text>
                        </View>

                        <View style={[styles.card, { backgroundColor: colors.card }]}>
                            <View style={styles.form}>
                                <Controller
                                    control={control}
                                    name="email"
                                    render={({ field: { onChange, onBlur, value } }) => (
                                        <Input
                                            label={t('auth.email')}
                                            placeholder={t('auth.enterEmail')}
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                            onBlur={onBlur}
                                            onChangeText={onChange}
                                            value={value}
                                            error={errors.email?.message}
                                            icon="mail"
                                        />
                                    )}
                                />

                                <Controller
                                    control={control}
                                    name="password"
                                    render={({ field: { onChange, onBlur, value } }) => (
                                        <Input
                                            label={t('auth.password')}
                                            placeholder={t('auth.createPassword')}
                                            secureTextEntry
                                            isPassword
                                            onBlur={onBlur}
                                            onChangeText={onChange}
                                            value={value}
                                            error={errors.password?.message}
                                            icon="lock"
                                        />
                                    )}
                                />

                                <Controller
                                    control={control}
                                    name="confirmPassword"
                                    render={({ field: { onChange, onBlur, value } }) => (
                                        <Input
                                            label={t('auth.confirmPassword')}
                                            placeholder={t('auth.confirmYourPassword')}
                                            secureTextEntry
                                            isPassword
                                            onBlur={onBlur}
                                            onChangeText={onChange}
                                            value={value}
                                            error={errors.confirmPassword?.message}
                                            icon="lock"
                                        />
                                    )}
                                />

                                <Button
                                    title={t('auth.signUp')}
                                    onPress={handleSubmit(onRegister)}
                                    loading={loading}
                                    style={[styles.signUpButton, { backgroundColor: colors.primary }]}
                                />

                                <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 24 }}>
                                    <View style={{ flex: 1, height: 1, backgroundColor: colors.border || '#E5E7EB' }} />
                                    <Text style={{ marginHorizontal: 10, color: colors.textSecondary || '#6B7280', fontSize: 14 }}>OR</Text>
                                    <View style={{ flex: 1, height: 1, backgroundColor: colors.border || '#E5E7EB' }} />
                                </View>

                                <Button
                                    title="Sign up with Google"
                                    variant="outline"
                                    onPress={onGoogleSignIn}
                                    style={{ borderColor: colors.border || '#E5E7EB' }}
                                />
                            </View>
                        </View>

                        <View style={styles.footer}>
                            <Text style={[styles.footerText, { color: isDark ? colors.textSecondary : 'rgba(255, 255, 255, 0.9)' }]}>
                                {t('auth.alreadyHaveAccount')}{' '}
                            </Text>
                            <Link href="/(auth)/login">
                                <Text style={[styles.signInText, { color: isDark ? '#D1D5DB' : '#FFFFFF' }]}>
                                    {t('auth.login')}
                                </Text>
                            </Link>
                        </View>

                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    gradient: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        padding: 24,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logo: {
        fontSize: 64,
        marginBottom: 16,
    },
    title: {
        fontSize: 36,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 8,
        textAlign: 'center',
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
    },
    card: {
        borderRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    form: {
        gap: 4,
    },
    signUpButton: {
        marginTop: 16,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 32,
    },
    footerText: {
        fontSize: 15,
    },
    signInText: {
        fontWeight: '700',
        fontSize: 15,
    },
});
