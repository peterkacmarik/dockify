import { useRouter } from 'expo-router';
import {
    AlertTriangle,
    ArrowLeftRight,
    ClipboardList,
    Package,
    ScanLine,
    Settings,
} from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WarehouseTile } from '../../../src/components/ui/WarehouseTile';
import { useTheme } from '../../../src/contexts/ThemeContext';

export default function InventoryScreen() {
    const { t } = useTranslation();
    const { colors } = useTheme();
    const router = useRouter();

    const tiles = React.useMemo(
        () => [
            // Phase 1: Input
            {
                id: 'intake',
                title: t('tabs.intake'),
                icon: <Package size={48} color="#FFFFFF" strokeWidth={2} />,
                gradientColors: ['#4facfe', '#00f2fe'] as const, // Blue/Cyan
                route: '/(tabs)/inventory/intake',
            },
            {
                id: 'scan',
                title: t('inventory.tiles.scan'),
                icon: <ScanLine size={48} color="#FFFFFF" strokeWidth={2} />,
                gradientColors: ['#667eea', '#764ba2'] as const, // Deep Blue/Purple
                route: '/(tabs)/inventory/scan',
            },
            // Phase 2: Processing
            {
                id: 'processing',
                title: t('tabs.processing'),
                icon: <ClipboardList size={48} color="#FFFFFF" strokeWidth={2} />,
                gradientColors: ['#f093fb', '#f5576c'] as const, // Pink/Red
                route: '/(tabs)/inventory/processing',
            },
            {
                id: 'movements',
                title: t('inventory.tiles.movements'),
                icon: <ArrowLeftRight size={48} color="#FFFFFF" strokeWidth={2} />,
                gradientColors: ['#fa709a', '#fee140'] as const, // Orange/Yellow
                route: '/(tabs)/inventory/movements',
            },
            // Phase 3: Inventory Management
            {
                id: 'products',
                title: t('inventory.tiles.products'),
                icon: <Package size={48} color="#FFFFFF" strokeWidth={2} />,
                gradientColors: ['#30cfd0', '#330867'] as const, // Teal/Purple
                route: '/(tabs)/inventory/products',
            },
            {
                id: 'lowStock',
                title: t('inventory.tiles.lowStock'),
                icon: <AlertTriangle size={48} color="#FFFFFF" strokeWidth={2} />,
                gradientColors: ['#ff9a9e', '#fecfef'] as const, // Pinkish
                route: '/(tabs)/inventory/low-stock',
            },
            // Phase 4: Configuration
            {
                id: 'settings',
                title: t('inventory.tiles.settings'),
                icon: <Settings size={48} color="#FFFFFF" strokeWidth={2} />,
                gradientColors: ['#434343', '#000000'] as const, // Black/Grey
                route: '/(tabs)/inventory/settings',
            },
        ],
        [t]
    );

    const handleTilePress = React.useCallback(
        (route: string) => {
            router.push(route as any);
        },
        [router]
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.header}>
                    <Text style={[styles.title, { color: colors.text }]}>
                        {t('inventory.title')}
                    </Text>
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                        {t('inventory.subtitle')}
                    </Text>
                </View>

                <View style={styles.grid}>
                    {tiles.map((tile, index) => (
                        <View
                            key={tile.id}
                            style={[
                                styles.tileWrapper,
                                index % 2 === 0 ? styles.tileLeft : styles.tileRight,
                            ]}
                        >
                            <WarehouseTile
                                title={tile.title}
                                icon={tile.icon}
                                gradientColors={tile.gradientColors}
                                onPress={() => handleTilePress(tile.route)}
                            />
                        </View>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
    },
    header: {
        marginBottom: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -8,
    },
    tileWrapper: {
        width: '50%',
        paddingHorizontal: 8,
        marginBottom: 16,
    },
    tileLeft: {},
    tileRight: {},
});
