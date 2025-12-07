import { ChevronDown, Languages, LogOut, Moon, Sun } from 'lucide-react-native';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../src/contexts/ThemeContext';
import { changeLanguage } from '../../src/lib/i18n';
import { supabase } from '../../src/lib/supabase';

const LANGUAGES = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'sk', name: 'Slovak', nativeName: 'Slovenčina' },
    { code: 'cs', name: 'Czech', nativeName: 'Čeština' },
];

export default function SettingsScreen() {
    const { t, i18n } = useTranslation();
    const { theme, toggleTheme, colors } = useTheme();
    const isDark = theme === 'dark';
    const [languageModalVisible, setLanguageModalVisible] = useState(false);

    const currentLanguage = LANGUAGES.find(lang => lang.code === i18n.language) || LANGUAGES[1];

    const onLogout = async () => {
        await supabase.auth.signOut();
    };

    const handleLanguageChange = async (languageCode: string) => {
        await changeLanguage(languageCode);
        setLanguageModalVisible(false);
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.content}>
                <Text style={[styles.header, { color: colors.text }]}>{t('settings.title')}</Text>

                {/* Theme Toggle Card */}
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.cardRow}>
                        <View style={styles.cardLeft}>
                            {isDark ? (
                                <Moon size={24} color={colors.primary} />
                            ) : (
                                <Sun size={24} color={colors.primary} />
                            )}
                            <View style={styles.cardText}>
                                <Text style={[styles.cardTitle, { color: colors.text }]}>
                                    {t('settings.theme')}
                                </Text>
                                <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                                    {isDark ? t('settings.darkMode') : t('settings.lightMode')}
                                </Text>
                            </View>
                        </View>
                        <Switch
                            value={isDark}
                            onValueChange={toggleTheme}
                            trackColor={{ false: '#D1D5DB', true: colors.primary }}
                            thumbColor="#FFFFFF"
                        />
                    </View>
                </View>

                {/* Language Selector Card */}
                <TouchableOpacity
                    style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => setLanguageModalVisible(true)}
                >
                    <View style={styles.cardRow}>
                        <View style={styles.cardLeft}>
                            <Languages size={24} color={colors.primary} />
                            <View style={styles.cardText}>
                                <Text style={[styles.cardTitle, { color: colors.text }]}>
                                    {t('settings.language')}
                                </Text>
                                <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                                    {currentLanguage.nativeName}
                                </Text>
                            </View>
                        </View>
                        <ChevronDown size={20} color={colors.textSecondary} />
                    </View>
                </TouchableOpacity>

                {/* Logout Card */}
                <TouchableOpacity
                    style={[styles.card, styles.logoutCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={onLogout}
                >
                    <View style={styles.cardRow}>
                        <View style={styles.cardLeft}>
                            <LogOut size={24} color={colors.error} />
                            <View style={styles.cardText}>
                                <Text style={[styles.cardTitle, { color: colors.error }]}>
                                    {t('common.logout')}
                                </Text>
                                <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                                    {t('settings.signOut')}
                                </Text>
                            </View>
                        </View>
                    </View>
                </TouchableOpacity>
            </View>

            {/* Language Selection Modal */}
            <Modal
                visible={languageModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setLanguageModalVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setLanguageModalVisible(false)}
                >
                    <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>
                            {t('settings.selectLanguage')}
                        </Text>
                        <ScrollView>
                            {LANGUAGES.map((language) => (
                                <TouchableOpacity
                                    key={language.code}
                                    style={[
                                        styles.languageOption,
                                        { borderBottomColor: colors.border },
                                        language.code === i18n.language && { backgroundColor: colors.primary + '20' }
                                    ]}
                                    onPress={() => handleLanguageChange(language.code)}
                                >
                                    <Text style={[styles.languageName, { color: colors.text }]}>
                                        {language.nativeName}
                                    </Text>
                                    {language.code === i18n.language && (
                                        <Text style={[styles.checkmark, { color: colors.primary }]}>✓</Text>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        padding: 20,
    },
    header: {
        fontSize: 32,
        fontWeight: '800',
        marginBottom: 24,
    },
    card: {
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    logoutCard: {
        marginTop: 'auto',
    },
    cardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    cardLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    cardText: {
        marginLeft: 16,
        flex: 1,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 4,
    },
    cardSubtitle: {
        fontSize: 14,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        width: '100%',
        maxWidth: 400,
        borderRadius: 16,
        padding: 20,
        maxHeight: '80%',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 16,
        textAlign: 'center',
    },
    languageOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderRadius: 8,
    },
    languageName: {
        fontSize: 16,
        fontWeight: '500',
    },
    checkmark: {
        fontSize: 20,
        fontWeight: '700',
    },
});
