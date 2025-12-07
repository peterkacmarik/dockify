import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../../components/ui/Button';
import { useTheme } from '../../../contexts/ThemeContext';
import { ParsedOrderItem, pickAndParseExcel } from '../services/excelParser';

export default function OrderIntakeScreen() {
    const { t } = useTranslation();
    const { colors } = useTheme();
    const [orders, setOrders] = useState<ParsedOrderItem[]>([]);
    const [loading, setLoading] = useState(false);

    const handleUpload = async () => {
        setLoading(true);
        try {
            const parsedData = await pickAndParseExcel();
            setOrders(parsedData);
        } catch (error: any) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }: { item: ParsedOrderItem }) => (
        <View style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
            !item.isValid && { borderColor: colors.error, backgroundColor: colors.error + '10' }
        ]}>
            <View style={styles.cardHeader}>
                <Text style={[styles.partNumber, { color: colors.text }]}>{item.partNumber}</Text>
                <Text style={[styles.quantity, { color: colors.primary }]}>{t('intake.quantity')}: {item.quantity}</Text>
            </View>
            {item.description ? <Text style={[styles.description, { color: colors.textSecondary }]}>{item.description}</Text> : null}
            {!item.isValid && (
                <Text style={[styles.errorText, { color: colors.error }]}>⚠ {item.validationError}</Text>
            )}
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom', 'left', 'right']}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text }]}>{t('intake.title')}</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t('intake.subtitle')}</Text>
            </View>

            <View style={styles.actions}>
                <Button
                    title={t('intake.uploadFile')}
                    onPress={handleUpload}
                    loading={loading}
                />
            </View>

            <View style={styles.listContainer}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    {orders.length > 0 ? `${t('intake.parsedItems')} (${orders.length})` : t('intake.noItemsLoaded')}
                </Text>

                <FlatList
                    data={orders}
                    keyExtractor={(_, index) => index.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        !loading && orders.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Ionicons name="document-text-outline" size={48} color={colors.textSecondary} />
                                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                                    {t('intake.noDataToDisplay')}
                                </Text>
                            </View>
                        ) : null
                    }
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 16,
    },
    header: {
        marginTop: 16,
        marginBottom: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
    },
    subtitle: {
        fontSize: 14,
        marginTop: 4,
    },
    actions: {
        marginBottom: 24,
    },
    listContainer: {
        flex: 1,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    listContent: {
        paddingBottom: 24,
    },
    card: {
        borderRadius: 8,
        padding: 16,
        marginBottom: 8,
        borderWidth: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    partNumber: {
        fontSize: 16,
        fontWeight: '600',
    },
    quantity: {
        fontSize: 16,
        fontWeight: '600',
    },
    description: {
        fontSize: 14,
    },
    errorText: {
        fontSize: 12,
        marginTop: 8,
        fontWeight: '500',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 48,
    },
    emptyText: {
        marginTop: 8,
    },
});
