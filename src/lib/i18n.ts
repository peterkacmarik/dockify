import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import cs from '../locales/cs.json';
import en from '../locales/en.json';
import sk from '../locales/sk.json';

const LANGUAGE_STORAGE_KEY = '@dockify_language';

const resources = {
    en: { translation: en },
    sk: { translation: sk },
    cs: { translation: cs },
};

// Get saved language or default to Slovak
const getInitialLanguage = async (): Promise<string> => {
    try {
        const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        return savedLanguage || 'sk';
    } catch (error) {
        console.error('Failed to load language:', error);
        return 'sk';
    }
};

i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: 'sk', // Default language
        fallbackLng: 'en',
        compatibilityJSON: 'v4',
        interpolation: {
            escapeValue: false,
        },
    });

// Load saved language on init
getInitialLanguage().then((language) => {
    i18n.changeLanguage(language);
});

export const changeLanguage = async (language: string) => {
    try {
        await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
        await i18n.changeLanguage(language);
    } catch (error) {
        console.error('Failed to change language:', error);
    }
};

export default i18n;
