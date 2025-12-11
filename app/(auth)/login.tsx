import { zodResolver } from '@hookform/resolvers/zod';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, router } from 'expo-router';
import { Fingerprint } from 'lucide-react-native';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';

import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { useTheme } from '../../src/contexts/ThemeContext';
import { supabase } from '../../src/lib/supabase';
import { performGoogleLogin } from '../../src/lib/oauth';

export default function LoginScreen() {
    const { t } = useTranslation();
    const { colors, theme } = useTheme();
    const isDark = theme === 'dark';
    const [loading, setLoading] = useState(false);

    // Validation Schema with translations
    const loginSchema = z.object({
        email: z.string().email(t('auth.invalidEmail')),
        password: z.string().min(6, t('auth.passwordTooShort')),
    });

    type LoginSchema = z.infer<typeof loginSchema>;

    const { control, handleSubmit, formState: { errors } } = useForm<LoginSchema>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    });

    const onLogin = async (data: LoginSchema) => {
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({
            email: data.email,
            password: data.password,
        });

        if (error) {
            Alert.alert(t('auth.loginFailed'), error.message);
            setLoading(false);
        } else {
            router.replace('/');
            // Keep loading true during redirect
        }
    };

    const onGoogleSignIn = async () => {
        setLoading(true);
        try {
            const session = await performGoogleLogin();
            if (session) {
                router.replace('/');
                return; // Keep loading true
            }
        } catch (error: any) {
            if (error) {
                Alert.alert('Google Login Error', error.message || 'Unknown error');
            }
        }
        setLoading(false);
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
                            <Text style={styles.logo}>🚢</Text>
                            <Text style={styles.title}>{t('auth.welcomeBack')}</Text>
                            <Text style={[styles.subtitle, { color: isDark ? colors.textSecondary : 'rgba(255, 255, 255, 0.9)' }]}>
                                {t('auth.signInToContinue')}
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
                                            placeholder={t('auth.enterPassword')}
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

                                <View style={styles.forgotPasswordContainer}>
                                    <Link href="/(auth)/forgot-password">
                                        <Text style={[styles.forgotPasswordText, { color: isDark ? '#D1D5DB' : colors.primary }]}>
                                            {t('auth.forgotPassword')}?
                                        </Text>
                                    </Link>
                                </View>

                                <Button
                                    title={t('auth.signIn')}
                                    onPress={handleSubmit(onLogin)}
                                    loading={loading}
                                    style={[styles.signInButton, { backgroundColor: colors.primary }]}
                                />

                                <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 24 }}>
                                    <View style={{ flex: 1, height: 1, backgroundColor: colors.border || '#E5E7EB' }} />
                                    <Text style={{ marginHorizontal: 10, color: colors.textSecondary || '#6B7280', fontSize: 14 }}>OR</Text>
                                    <View style={{ flex: 1, height: 1, backgroundColor: colors.border || '#E5E7EB' }} />
                                </View>

                                <Button
                                    title="Continue with Google"
                                    variant="outline"
                                    onPress={onGoogleSignIn}
                                    style={{ borderColor: colors.border || '#E5E7EB' }}
                                />
                            </View>
                        </View>

                        <View style={styles.footer}>
                            <Text style={[styles.footerText, { color: isDark ? colors.textSecondary : 'rgba(255, 255, 255, 0.9)' }]}>
                                {t('auth.dontHaveAccount')}{' '}
                            </Text>
                            <Link href="/(auth)/register">
                                <Text style={[styles.signUpText, { color: isDark ? '#D1D5DB' : '#FFFFFF' }]}>
                                    {t('auth.signUp')}
                                </Text>
                            </Link>
                        </View>

                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
            {loading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#ffffff" />
                    <Text style={styles.loadingText}>{t('common.loading', 'Loading...')}</Text>
                </View>
            )}
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
    forgotPasswordContainer: {
        alignItems: 'flex-end',
        marginBottom: 8,
        marginTop: 4,
    },
    forgotPasswordText: {
        fontWeight: '600',
        fontSize: 14,
    },
    signInButton: {
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
    signUpText: {
        fontWeight: '700',
        fontSize: 15,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    loadingText: {
        color: '#FFFFFF',
        marginTop: 12,
        fontSize: 16,
        fontWeight: '600',
    },
});
