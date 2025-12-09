import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

import { supabase } from '../../../lib/supabase';
import { Database } from '../../../types/supabase';

const SETTINGS_KEY = 'order_intake_settings';

export type IntakeField = Database['public']['Tables']['intake_fields']['Row'];

export interface IntakeSettings {
    paginationLimit: number;
}

const DEFAULT_SETTINGS: IntakeSettings = {
    paginationLimit: 25,
};

export const useIntakeSettings = () => {
    const [settings, setSettings] = useState<IntakeSettings>(DEFAULT_SETTINGS);
    const [fields, setFields] = useState<IntakeField[]>([]);
    const [loading, setLoading] = useState(true);

    const loadSettings = useCallback(async () => {
        try {
            // Load local settings (pagination)
            const jsonValue = await AsyncStorage.getItem(SETTINGS_KEY);
            if (jsonValue != null) {
                setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(jsonValue) });
            }

            // Load remote fields
            const { data, error } = await supabase
                .from('intake_fields')
                .select('*')
                .order('created_at', { ascending: true });

            if (error) throw error;
            if (data) setFields(data);

        } catch (e) {
            console.error('Failed to load intake settings/fields', e);
        } finally {
            setLoading(false);
        }
    }, []);

    const saveSettings = useCallback(async (newSettings: IntakeSettings) => {
        try {
            const jsonValue = JSON.stringify(newSettings);
            await AsyncStorage.setItem(SETTINGS_KEY, jsonValue);
            setSettings(newSettings);
        } catch (e) {
            console.error('Failed to save intake settings', e);
        }
    }, []);

    const updatePaginationLimit = (limit: number) => {
        saveSettings({ ...settings, paginationLimit: limit });
    };

    // --- Field Management ---

    const toggleField = async (id: string, isActive: boolean) => {
        try {
            // Optimistic update
            const oldFields = [...fields];
            setFields(prev => prev.map(f => f.id === id ? { ...f, is_active: isActive } : f));

            const { error } = await supabase
                .from('intake_fields')
                .update({ is_active: isActive })
                .eq('id', id);

            if (error) {
                // Revert
                setFields(oldFields);
                throw error;
            }
        } catch (error) {
            console.error('Error toggling field:', error);
        }
    };

    const addField = async (label: string, customKey?: string, isRequired: boolean = false) => {
        try {
            let key = customKey;

            if (!key) {
                // Create slug from label: "My Color 2" -> "my-color-2"
                key = label.toLowerCase()
                    .replace(/[^\w\s-]/g, '') // remove non-word chars
                    .replace(/\s+/g, '-')     // replace spaces with hyphens
                    .replace(/^-+|-+$/g, ''); // remove leading/trailing hyphens
            }

            if (!key) throw new Error('Invalid label or key');

            const { data, error } = await supabase
                .from('intake_fields')
                .insert([{
                    label,
                    key,
                    is_active: true,
                    is_required: isRequired
                }])
                .select()
                .single();

            if (error) throw error;
            if (data) {
                setFields(prev => [...prev, data]);
            }
            return true;

        } catch (error) {
            console.error('Error adding field:', error);
            return false;
        }
    };

    const deleteField = async (id: string) => {
        try {
            // Optimistic update
            const oldFields = [...fields];
            setFields(prev => prev.filter(f => f.id !== id));

            const { error } = await supabase
                .from('intake_fields')
                .delete()
                .eq('id', id);

            if (error) {
                setFields(oldFields);
                throw error;
            }
        } catch (error) {
            console.error('Error deleting field:', error);
        }
    };

    useEffect(() => {
        loadSettings();
    }, [loadSettings]);

    return {
        settings,
        fields,
        loading,
        updatePaginationLimit,
        toggleField,
        addField,
        deleteField,
        reloadSettings: loadSettings,
    };
};
