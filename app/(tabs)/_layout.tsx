
import { Tabs } from 'expo-router';
import { LayoutList, Package, Settings, Upload } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Platform } from 'react-native';
import { useTheme } from '../../src/contexts/ThemeContext';


export default function TabLayout() {
  const { t } = useTranslation();
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textSecondary,
          headerShadowVisible: false,
          tabBarStyle: {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            borderTopWidth: 1,
            ...Platform.select({
              ios: {
                position: 'absolute',
              },
              default: {},
            }),
          },
          animation: 'none',
        }}>
        <Tabs.Screen
          name="index"
          options={{
            href: null,
          }}
        />

        <Tabs.Screen
          name="inventory"
          options={{
            title: t('tabs.inventory'),
            tabBarIcon: ({ color }) => <LayoutList size={24} color={color} />,
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: t('tabs.settings'),
            tabBarIcon: ({ color }) => <Settings size={24} color={color} />,
          }}
        />
        {/* Hide the explore tab if it exists from template */}
        <Tabs.Screen
          name="explore"
          options={{
            href: null,
          }}
        />
      </Tabs>
    </>
  );
}
