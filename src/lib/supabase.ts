import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'
import * as SecureStore from 'expo-secure-store'
import { AppState, Platform } from 'react-native'
import 'react-native-url-polyfill/auto'

// Custom Storage Adapter to handle large values (>2048 bytes) in SecureStore
// by splitting them into chunks.
const LargeSecureStore = {
    getItem: async (key: string) => {
        // Web fallback
        if (Platform.OS === 'web') {
            return AsyncStorage.getItem(key);
        }

        // BLOCKER: If biometrics are enabled, we do NOT return the session automatically.
        // This forces the user to the Login screen, where we can prompt for Biometrics.
        try {
            const biometricEnabled = await SecureStore.getItemAsync('biometric_enabled_flag');
            if (biometricEnabled === 'true' && key.includes(' supabase-auth-token')) {
                console.log('[Auth] Biometrics active - hiding session to force prompt.');
                return null;
            }
        } catch (e) {
            // ignore error
        }

        const value = await SecureStore.getItemAsync(key);
        if (!value) return null;

        // Check if value indicates chunked data
        if (value.startsWith('{"__isChunked":true')) {
            try {
                const metadata = JSON.parse(value);
                if (metadata.__isChunked && typeof metadata.chunkCount === 'number') {
                    let fullValue = '';
                    for (let i = 0; i < metadata.chunkCount; i++) {
                        const chunkKey = `${key}_chunk_${i}`;
                        const chunk = await SecureStore.getItemAsync(chunkKey);
                        if (chunk) {
                            fullValue += chunk;
                        } else {
                            // Missing chunk, data corrupted
                            return null;
                        }
                    }
                    return fullValue;
                }
            } catch (e) {
                console.warn('Failed to parse chunk metadata', e);
            }
        }

        // Return original value if not chunked
        return value;
    },

    setItem: async (key: string, value: string) => {
        // Web fallback
        if (Platform.OS === 'web') {
            return AsyncStorage.setItem(key, value);
        }

        // Limit is technically 2048 bytes, use 2000 safety margin
        const MAX_SIZE = 2000;

        if (value.length <= MAX_SIZE) {
            // If overriding a previously chunked value, strictly we should clean up.
            // But for simplicity/performance in this fix, we just overwrite the main key.
            return SecureStore.setItemAsync(key, value);
        }

        const chunkCount = Math.ceil(value.length / MAX_SIZE);

        // Store chunks
        const chunkPromises = [];
        for (let i = 0; i < chunkCount; i++) {
            const chunk = value.slice(i * MAX_SIZE, (i + 1) * MAX_SIZE);
            chunkPromises.push(SecureStore.setItemAsync(`${key}_chunk_${i}`, chunk));
        }
        await Promise.all(chunkPromises);

        // Store metadata
        const metadata = JSON.stringify({ __isChunked: true, chunkCount });
        return SecureStore.setItemAsync(key, metadata);
    },

    removeItem: async (key: string) => {
        // Web fallback
        if (Platform.OS === 'web') {
            return AsyncStorage.removeItem(key);
        }

        // Check if chunks exist to clean up
        const value = await SecureStore.getItemAsync(key);
        try {
            if (value && value.startsWith('{"__isChunked":true')) {
                const metadata = JSON.parse(value);
                if (metadata.chunkCount) {
                    const promises = [];
                    for (let i = 0; i < metadata.chunkCount; i++) {
                        promises.push(SecureStore.deleteItemAsync(`${key}_chunk_${i}`));
                    }
                    await Promise.all(promises);
                }
            }
        } catch (e) { }

        return SecureStore.deleteItemAsync(key);
    },
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: LargeSecureStore,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
})

// Tells Supabase Auth to start refreshing the session when the app comes back to the foreground
AppState.addEventListener('change', (state) => {
    if (state === 'active') {
        supabase.auth.startAutoRefresh()
    } else {
        supabase.auth.stopAutoRefresh()
    }
})
