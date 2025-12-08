import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../../components/ui/Button';
import { useTheme } from '../../../contexts/ThemeContext';
import { ColumnMapper } from '../components/ColumnMapper';
import { cleanOrderItem, validateBatch } from '../services/dataValidator';
import { ExcelParseResult, LegacyParsedOrderItem, pickAndParseExcel } from '../services/excelParser';
import { exportToExcel, saveToDevice } from '../services/excelExporter';

type IntakeStep = 'upload' | 'mapping' | 'preview';

export default function OrderIntakeScreen() {
    const { t } = useTranslation();
    const { colors } = useTheme();

    // States
    const [currentStep, setCurrentStep] = useState<IntakeStep>('upload');
    const [parseResult, setParseResult] = useState<ExcelParseResult | null>(null);
    const [finalItems, setFinalItems] = useState<LegacyParsedOrderItem[]>([]);
    const [validationErrors, setValidationErrors] = useState<Record<number, string[]>>({});
    const [loading, setLoading] = useState(false);
    const [processingMapping, setProcessingMapping] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [showExportOptions, setShowExportOptions] = useState(false);

    // Maintain current mapping to allow "Back" functionality to pre-fill
    // (This would require modifying ColumnMapper to accept initialMapping, skipping for now as 'Back' just re-shows mapper)

    const ITEMS_PER_PAGE = 50;

    const resetFlow = () => {
        setParseResult(null);
        setFinalItems([]);
        setValidationErrors({});
        setShowExportOptions(false);
        setCurrentStep('upload');
    };

    const handleUpload = async () => {
        setLoading(true);
        try {
            const parsedData = await pickAndParseExcel();
            if (parsedData) {
                setParseResult(parsedData);
                // Reset items when fresh analysis comes in
                setFinalItems([]);
                setCurrentStep('mapping');
            }
        } catch (error: any) {
            console.error(error);
        } finally {
            setLoading(false);
        }
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
                setCurrentStep('preview');
                // WE DO NOT NULLIFY parseResult HERE so we can go back
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
            Alert.alert('Success', 'Excel súbor úspešne vyexportovaný!');
            // DO NOT RESET FLOW AUTOMATICALLY
            // User stays on screen
        } catch (error) {
            console.error('Export error:', error);
            alert('Chyba pri exporte do Excelu');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveToDevice = async () => {
        try {
            setLoading(true);
            const success = await saveToDevice(finalItems);
            if (success) {
                Alert.alert('Success', 'Súbor bol úspešne uložený!');
                // DO NOT RESET FLOW AUTOMATICALLY
            }
        } catch (error) {
            console.error('Save error:', error);
            alert('Chyba pri ukladaní súboru');
        } finally {
            setLoading(false);
        }
    };

    const handleExportToDatabase = () => {
        alert('Ukladanie do databázy bude dostupné čoskoro!');
        // TODO: Implement Supabase integration
    };

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

            {currentStep === 'upload' && (
                <View style={styles.actions}>
                    <Button
                        title={t('intake.uploadFile')}
                        onPress={handleUpload}
                        loading={loading}
                    />
                </View>
            )}

            <View style={styles.content}>
                {currentStep === 'mapping' && parseResult ? (
                    <ColumnMapper
                        parseResult={parseResult}
                        onApply={handleApplyMapping}
                        onCancel={resetFlow}
                    />
                ) : currentStep === 'preview' && finalItems.length > 0 ? (
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
                                                size="sm"
                                                style={{ minWidth: 40 }}
                                            />
                                        </View>
                                    )}

                                    <View style={{ marginTop: 24, paddingBottom: 32, gap: 12 }}>
                                        {showExportOptions ? (
                                            <>
                                                <Text style={[styles.sectionTitle, { color: colors.text, textAlign: 'center' }]}>
                                                    ✅ Validácia úspešná!
                                                </Text>
                                                <Text style={{ color: colors.textSecondary, textAlign: 'center', marginBottom: 8 }}>
                                                    {finalItems.length} položiek pripravených. Vyberte formát exportu:
                                                </Text>
                                                <Button
                                                    title="📊 Exportovať do Excelu (Zdieľať)"
                                                    onPress={handleExportToExcel}
                                                    loading={loading}
                                                />
                                                {Platform.OS === 'android' && (
                                                    <Button
                                                        title="📥 Uložiť do zariadenia"
                                                        onPress={handleSaveToDevice}
                                                        loading={loading}
                                                    />
                                                )}
                                                <Button
                                                    title="💾 Uložiť do databázy"
                                                    variant="outline"
                                                    onPress={handleExportToDatabase}
                                                />
                                                <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 8 }} />
                                                <Button
                                                    title="✨ Dokončiť / Nový Import"
                                                    variant="ghost"
                                                    onPress={resetFlow}
                                                    style={{ marginTop: 8 }}
                                                />
                                                <Button
                                                    title={t('common.cancel')}
                                                    variant="outline"
                                                    onPress={() => setShowExportOptions(false)}
                                                    style={{ borderColor: colors.border }}
                                                />
                                            </>
                                        ) : (
                                            <>
                                                <Button
                                                    title={t('intake.confirmImport')}
                                                    onPress={handleConfirmImport}
                                                />
                                                <View style={{ flexDirection: 'row', gap: 12 }}>
                                                    <View style={{ flex: 1 }}>
                                                        <Button
                                                            title="⬅ Späť na Mapovanie"
                                                            variant="outline"
                                                            onPress={() => {
                                                                setCurrentStep('mapping');
                                                                setShowExportOptions(false);
                                                            }}
                                                        />
                                                    </View>
                                                    <View style={{ flex: 1 }}>
                                                        <Button
                                                            title={t('intake.discard')}
                                                            variant="outline"
                                                            onPress={resetFlow}
                                                            style={{ borderColor: colors.error }}
                                                        />
                                                    </View>
                                                </View>
                                            </>
                                        )}
                                    </View>
                                </>
                            );
                        })()}
                    </ScrollView>
                ) : (
                    !loading && (
                        <View style={styles.emptyState}>
                            <Ionicons name="cloud-upload-outline" size={48} color={colors.textSecondary} />
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                                {t('intake.noDataToDisplay')}
                            </Text>
                        </View>
                    )
                )}
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
