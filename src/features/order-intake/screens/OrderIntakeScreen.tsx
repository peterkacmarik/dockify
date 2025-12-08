import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../../components/ui/Button';
import { useTheme } from '../../../contexts/ThemeContext';
import { ColumnMapper } from '../components/ColumnMapper';
import { cleanOrderItem, validateBatch } from '../services/dataValidator';
import { ExcelParseResult, LegacyParsedOrderItem, pickAndParseExcel } from '../services/excelParser';
import { exportToExcel } from '../services/excelExporter';

export default function OrderIntakeScreen() {
    const { t } = useTranslation();
    const { colors } = useTheme();

    // States
    const [parseResult, setParseResult] = useState<ExcelParseResult | null>(null);
    const [isMapping, setIsMapping] = useState(false);
    const [finalItems, setFinalItems] = useState<LegacyParsedOrderItem[]>([]);
    const [validationErrors, setValidationErrors] = useState<Record<number, string[]>>({});
    const [loading, setLoading] = useState(false);
    const [processingMapping, setProcessingMapping] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [showExportOptions, setShowExportOptions] = useState(false);
    const ITEMS_PER_PAGE = 50;

    const handleUpload = async () => {
        setLoading(true);
        try {
            const parsedData = await pickAndParseExcel();
            if (parsedData) {
                setParseResult(parsedData);
                // Reset items when fresh analysis comes in
                setFinalItems([]);
                setIsMapping(false);
            }
        } catch (error: any) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const startMapping = () => {
        setIsMapping(true);
    };

    const handleApplyMapping = async (mapping: Record<string, number>) => {
        if (!parseResult) return;

        setProcessingMapping(true);

        // Use setTimeout to allow UI to show loading state
        setTimeout(() => {
            try {
                // Transform Raw Data -> Items (use ALL rows, not just samples)
                const { file_summary } = parseResult;

                const transformed: LegacyParsedOrderItem[] = file_summary.all_rows.map((row, i) => {
                    const qtyVal = row[mapping['quantity']];
                    const description = mapping['description'] !== undefined ? row[mapping['description']] : '';
                    const price = mapping['price'] !== undefined ? Number(row[mapping['price']]) : undefined;

                    return {
                        partNumber: row[mapping['sku']] || '',
                        quantity: qtyVal as any, // Will be cleaned to number
                        description: description || '',
                        price: price,
                        isValid: true,
                        validationError: undefined
                    };
                });

                // Clean all items immediately
                const cleanedItems = transformed.map(cleanOrderItem);

                setFinalItems(cleanedItems);
                setValidationErrors({});
                setCurrentPage(1); // Reset to first page
                setIsMapping(false);
                setParseResult(null);
            } catch (error) {
                console.error('Mapping processing error:', error);
                alert('Chyba pri spracovaní dát');
            } finally {
                setProcessingMapping(false);
            }
        }, 100);
    };

    const handleConfirmImport = () => {
        const validation = validateBatch(finalItems);

        // Check for duplicates
        if (validation.duplicates.length > 0) {
            alert(`Upozornenie: Duplicitné SKU: ${validation.duplicates.join(', ')}`);
        }

        // If there are invalid items, show errors
        if (validation.invalidItems.length > 0) {
            const errors: Record<number, string[]> = {};
            validation.invalidItems.forEach(({ index, errors: itemErrors }) => {
                errors[index] = itemErrors;
            });
            setValidationErrors(errors);
            alert(`Našli sa ${validation.invalidItems.length} chyby. Opravte ich prosím.`);
            return;
        }

        // All valid - show export options
        setShowExportOptions(true);
    };

    const handleExportToExcel = async () => {
        try {
            setLoading(true);
            await exportToExcel(finalItems);
            // Reset after successful export
            setFinalItems([]);
            setValidationErrors({});
            setShowExportOptions(false);
        } catch (error) {
            console.error('Export error:', error);
            alert('Chyba pri exporte do Excelu');
        } finally {
            setLoading(false);
        }
    };

    const handleExportToDatabase = () => {
        alert('Ukladanie do databázy bude dostupné čoskoro!');
        // TODO: Implement Supabase integration
    };

    const renderAnalysis = (data: ExcelParseResult) => (
        <ScrollView style={styles.resultContainer}>
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>{t('intake.analysisSummary')}</Text>
                <Text style={{ color: colors.text }}>{t('intake.filesScanned', { rows: data.file_summary.rows, cols: data.file_summary.cols })}</Text>
                <Text style={{ color: colors.text, marginTop: 4 }}>{t('intake.confidence')}: {(data.overall_confidence * 100).toFixed(0)}%</Text>

                <View style={styles.badgeContainer}>
                    {data.overall_confidence > 0.8 ? (
                        <View style={[styles.badge, { backgroundColor: '#4caf50' }]}><Text style={styles.badgeText}>{t('intake.highConfidence')}</Text></View>
                    ) : (
                        <View style={[styles.badge, { backgroundColor: '#ff9800' }]}><Text style={styles.badgeText}>{t('intake.reviewNeeded')}</Text></View>
                    )}
                </View>
            </View>


            <View style={{ marginTop: 16, gap: 12 }}>
                <Button title={t('intake.mapColumns')} onPress={startMapping} />
                <Button
                    title={t('common.cancel')}
                    variant="outline"
                    onPress={() => {
                        setParseResult(null);
                        setFinalItems([]);
                        setValidationErrors({});
                    }}
                />
            </View>

            <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 16 }]}>{t('intake.detectedColumns')}</Text>
            {data.detected_columns.map((col, idx) => (
                <View key={idx} style={[styles.columnCard, { backgroundColor: colors.card, borderLeftColor: col.confidence > 0.8 ? '#4caf50' : '#ff9800' }]}>
                    <View style={styles.row}>
                        <Text style={[styles.colHeader, { color: colors.text }]}>{col.header}</Text>
                        <Text style={[styles.colField, { color: colors.primary }]}>
                            {col.suggested_field ? t(`intake.fieldName_${col.suggested_field}`) : t('intake.unmapped')}
                        </Text>
                    </View>
                    <Text style={[styles.colReason, { color: colors.textSecondary }]}>{col.reason.join(', ')}</Text>
                </View>
            ))}
        </ScrollView>
    );

    const renderFinalItem = (item: LegacyParsedOrderItem, index: number) => {
        const itemErrors = validationErrors[index] || [];
        const hasErrors = itemErrors.length > 0;

        return (
            <View key={index} style={[
                styles.card,
                { backgroundColor: colors.card, borderColor: colors.border },
                hasErrors && { borderColor: colors.error, borderWidth: 2, backgroundColor: colors.error + '10' }
            ]}>
                <View style={styles.row}>
                    <Text style={[styles.colHeader, { color: hasErrors ? colors.error : colors.text }]}>{item.partNumber}</Text>
                    <Text style={{ color: colors.primary, fontWeight: 'bold' }}>{item.quantity} ks</Text>
                </View>
                <Text style={{ color: colors.textSecondary }}>{item.description}</Text>
                {item.price !== undefined && (
                    <Text style={{ color: colors.text, marginTop: 4, fontSize: 14, fontWeight: '600' }}>Cena: €{item.price.toFixed(2)}</Text>
                )}

                {hasErrors && (
                    <View style={{ marginTop: 8, padding: 8, backgroundColor: colors.error + '20', borderRadius: 4 }}>
                        {itemErrors.map((error, idx) => (
                            <Text key={idx} style={{ color: colors.error, fontSize: 12 }}>• {error}</Text>
                        ))}
                    </View>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom', 'left', 'right']}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text }]}>{t('intake.title')}</Text>
            </View>

            {!isMapping && !parseResult && finalItems.length === 0 && (
                <View style={styles.actions}>
                    <Button
                        title={t('intake.uploadFile')}
                        onPress={handleUpload}
                        loading={loading}
                    />
                </View>
            )}

            <View style={styles.content}>
                {isMapping && parseResult ? (
                    <ColumnMapper
                        parseResult={parseResult}
                        onApply={handleApplyMapping}
                        onCancel={() => setIsMapping(false)}
                    />
                ) : parseResult ? (
                    renderAnalysis(parseResult)
                ) : finalItems.length > 0 ? (
                    <ScrollView>
                        {(() => {
                            const totalPages = Math.ceil(finalItems.length / ITEMS_PER_PAGE);
                            const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
                            const endIndex = startIndex + ITEMS_PER_PAGE;
                            const currentItems = finalItems.slice(startIndex, endIndex);

                            return (
                                <>
                                    <View style={styles.row}>
                                        <Text style={[styles.sectionTitle, { color: colors.text }]}>
                                            {t('intake.parsedItems')} ({finalItems.length})
                                        </Text>
                                        <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
                                            Strana {currentPage} z {totalPages}
                                        </Text>
                                    </View>

                                    {/* Pagination Controls - Top */}
                                    {totalPages > 1 && (
                                        <View style={[styles.paginationContainer, { marginBottom: 12 }]}>
                                            <Button
                                                title="◀"
                                                onPress={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                disabled={currentPage === 1}
                                                variant="outline"
                                                size="sm"
                                                style={{ minWidth: 40 }}
                                            />
                                            <Text style={{ color: colors.text, marginHorizontal: 16 }}>
                                                {startIndex + 1} - {Math.min(endIndex, finalItems.length)}
                                            </Text>
                                            <Button
                                                title="▶"
                                                onPress={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                                disabled={currentPage === totalPages}
                                                variant="outline"
                                                size="sm"
                                                style={{ minWidth: 40 }}
                                            />
                                        </View>
                                    )}

                                    {currentItems.map((item, i) => renderFinalItem(item, startIndex + i))}

                                    {/* Pagination Controls - Bottom */}
                                    {totalPages > 1 && (
                                        <View style={[styles.paginationContainer, { marginTop: 16 }]}>
                                            <Button
                                                title="◀ Predch."
                                                onPress={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                disabled={currentPage === 1}
                                                variant="outline"
                                                size="sm"
                                            />
                                            <Text style={{ color: colors.text, marginHorizontal: 16 }}>
                                                {currentPage} / {totalPages}
                                            </Text>
                                            <Button
                                                title="Ďalšia ▶"
                                                onPress={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                                disabled={currentPage === totalPages}
                                                variant="outline"
                        <View style={styles.emptyState}>
                                                <Ionicons name="cloud-upload-outline" size={48} color={colors.textSecondary} />
                                                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                                                    {t('intake.noDataToDisplay')}
                                                </Text>
                                            </View>
                                            )
                )}
                                        </View>
        </SafeAreaView >
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
                            marginBottom: 16,
    },
                        content: {
                            flex: 1,
    },
                        resultContainer: {
                            flex: 1,
    },
                        card: {
                            borderRadius: 8,
                        padding: 16,
                        borderWidth: 1,
                        marginBottom: 8,
    },
                        cardTitle: {
                            fontSize: 16,
                        fontWeight: '600',
                        marginBottom: 8,
    },
                        badgeContainer: {
                            marginTop: 8,
                        flexDirection: 'row',
    },
                        badge: {
                            paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 4,
    },
                        badgeText: {
                            color: '#fff',
                        fontSize: 12,
                        fontWeight: '600',
    },
                        sectionTitle: {
                            fontSize: 16,
                        fontWeight: '600',
                        marginBottom: 8,
    },
                        columnCard: {
                            padding: 12,
                        marginBottom: 8,
                        borderRadius: 4,
                        borderLeftWidth: 4,
                        elevation: 1,
    },
                        row: {
                            flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
    },
                        colHeader: {
                            fontSize: 14,
                        fontWeight: '700',
    },
                        colField: {
                            fontSize: 14,
                        fontWeight: '600',
    },
                        colReason: {
                            fontSize: 12,
                        marginTop: 4,
    },
                        emptyState: {
                            alignItems: 'center',
                        justifyContent: 'center',
                        paddingVertical: 48,
    },
                        emptyText: {
                            marginTop: 8,
    },
                        paginationContainer: {
                            flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
    },
});
