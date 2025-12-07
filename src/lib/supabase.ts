import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'
import * as SecureStore from 'expo-secure-store'
import { AppState, Platform } from 'react-native'
import 'react-native-url-polyfill/auto'

// Supabase adapter for SecureStore (for persistence)
const ExpoSecureStoreAdapter = {
    getItem: (key: string) => {
        if (Platform.OS === 'web') {
            return AsyncStorage.getItem(key)
        }
        return SecureStore.getItemAsync(key)
    },
    setItem: (key: string, value: string) => {
        if (Platform.OS === 'web') {
            return AsyncStorage.setItem(key, value)
        }
        return SecureStore.setItemAsync(key, value)
    },
    removeItem: (key: string) => {
        if (Platform.OS === 'web') {
            return AsyncStorage.removeItem(key)
        }
        return SecureStore.deleteItemAsync(key)
    },
}

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: ExpoSecureStoreAdapter,
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
