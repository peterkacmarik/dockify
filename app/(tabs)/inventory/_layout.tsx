import { Stack } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../src/contexts/ThemeContext';

export default function InventoryLayout() {
    const { t } = useTranslation();
    const { colors, theme } = useTheme();

    return (
        <Stack
            screenOptions={{
                headerStyle: {
                    backgroundColor: colors.card,
                },
                headerTintColor: colors.text,
                headerShadowVisible: false,
            }}
        >
            <Stack.Screen
                name="index"
                options={{
                    headerShown: false,
                    title: t('tabs.inventory'),
                }}
            />
            <Stack.Screen
                name="products"
                options={{
                    headerShown: true,
                    title: t('inventory.products.title'),
                }}
            />
            <Stack.Screen
                name="scan"
                options={{
                    headerShown: true,
                    title: t('inventory.tiles.scan'),
                }}
            />
            <Stack.Screen
                name="movements"
                options={{
                    headerShown: true,
                    title: t('inventory.tiles.movements'),
                }}
            />
            <Stack.Screen
                name="low-stock"
                options={{
                    headerShown: true,
                    title: t('inventory.tiles.lowStock'),
                }}
            />
            <Stack.Screen
                name="settings"
                options={{
                    headerShown: true,
                    title: t('inventory.tiles.settings'),
                }}
            />
            <Stack.Screen
                name="intake"
                options={{
                    headerShown: true,
                    title: t('tabs.intake'),
                }}
            />
            <Stack.Screen
                name="processing"
                options={{
                    headerShown: true,
                    title: t('tabs.processing'),
                }}
            />
        </Stack>
    );
}
