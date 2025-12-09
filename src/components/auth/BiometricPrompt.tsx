import React, { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useBiometrics } from '../../hooks/useBiometrics';

const PROMPT_STORAGE_KEY = 'has_prompted_biometrics';

export const BiometricPrompt = () => {
    const { isSupported, isBiometricEnabled, enableBiometrics } = useBiometrics();
    const [hasPrompted, setHasPrompted] = useState(true); // Default true to prevent flash

    useEffect(() => {
        checkPromptStatus();
    }, []);

    const checkPromptStatus = async () => {
        try {
            const val = await AsyncStorage.getItem(PROMPT_STORAGE_KEY);
            setHasPrompted(val === 'true');
        } catch {
            setHasPrompted(false);
        }
    };

    useEffect(() => {
        if (!isSupported || isBiometricEnabled || hasPrompted) return;

        // Perform the prompt
        // We set timeout to let the app transition settle
        const timer = setTimeout(() => {
            Alert.alert(
                'Zapnúť biometriu?',
                'Chcete pre rýchlejšie prihlasovanie používať odtlačok prsta alebo Face ID?',
                [
                    {
                        text: 'Nie, ďakujem',
                        style: 'cancel',
                        onPress: async () => {
                            await AsyncStorage.setItem(PROMPT_STORAGE_KEY, 'true');
                            setHasPrompted(true);
                        }
                    },
                    {
                        text: 'Zapnúť',
                        onPress: async () => {
                            try {
                                await enableBiometrics();
                                await AsyncStorage.setItem(PROMPT_STORAGE_KEY, 'true');
                                setHasPrompted(true);
                                Alert.alert('Úspech', 'Biometria bola aktivovaná.');
                            } catch (error) {
                                // Error handled in hook (likely user cancelled)
                            }
                        }
                    }
                ]
            );
        }, 1000);

        return () => clearTimeout(timer);
    }, [isSupported, isBiometricEnabled, hasPrompted]);

    return null; // Logic only component
};
