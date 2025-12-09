import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

const BIOMETRIC_CREDENTIALS_KEY = 'biometric_credentials';
const BIOMETRIC_ENABLED_FLAG = 'biometric_enabled_flag';

export interface BiometricCredentials {
    email: string;
    password: string;
}

export const useBiometrics = () => {
    const [isSupported, setIsSupported] = useState(false);
    const [biometricType, setBiometricType] = useState<LocalAuthentication.AuthenticationType | null>(null);
    const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);

    useEffect(() => {
        checkSupport();
        checkEnabled();
    }, []);

    const checkSupport = async () => {
        try {
            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            const isEnrolled = await LocalAuthentication.isEnrolledAsync();
            const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

            console.log('[Biometrics] Hardware:', hasHardware, 'Enrolled:', isEnrolled, 'Types:', types);

            setIsSupported(hasHardware && isEnrolled);
            if (types.length > 0) {
                // Prefer FaceID or TouchID if available
                setBiometricType(types[0]);
            }
        } catch (error) {
            console.error('Biometric support check failed', error);
        }
    };

    const checkEnabled = async () => {
        try {
            // Check the flag first
            const flag = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_FLAG);
            setIsBiometricEnabled(flag === 'true');
        } catch (error) {
            console.error('Biometric enabled check failed', error);
            setIsBiometricEnabled(false);
        }
    };

    const enableBiometrics = async (credentials: BiometricCredentials) => {
        try {


            // 2. Store credentials
            // Note: requireAuthentication ensures OS prompt on retrieval
            await SecureStore.setItemAsync(BIOMETRIC_CREDENTIALS_KEY, JSON.stringify(credentials), {
                requireAuthentication: true,
                keychainAccessible: SecureStore.WHEN_PASSCODE_SET_THIS_DEVICE_ONLY
            });

            // 3. Set flag
            await SecureStore.setItemAsync(BIOMETRIC_ENABLED_FLAG, 'true');

            setIsBiometricEnabled(true);
            return true;
        } catch (error) {
            console.error('Failed to enable biometrics', error);
            throw error;
        }
    };

    const disableBiometrics = async () => {
        try {
            await SecureStore.deleteItemAsync(BIOMETRIC_CREDENTIALS_KEY);
            await SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_FLAG);
            setIsBiometricEnabled(false);
            return true;
        } catch (error) {
            console.error('Failed to disable biometrics', error);
            throw error;
        }
    };

    const loginWithBiometrics = async (): Promise<BiometricCredentials | null> => {
        try {
            // This triggers the OS prompt
            const jsonCredentials = await SecureStore.getItemAsync(BIOMETRIC_CREDENTIALS_KEY, {
                requireAuthentication: true,
            });

            if (jsonCredentials) {
                return JSON.parse(jsonCredentials);
            }
            return null;
        } catch (error) {
            console.log('Biometric login failed or cancelled', error);
            return null;
        }
    };

    return {
        isSupported,
        biometricType,
        isBiometricEnabled,
        enableBiometrics,
        disableBiometrics,
        loginWithBiometrics,
        refreshState: checkEnabled
    };
};
