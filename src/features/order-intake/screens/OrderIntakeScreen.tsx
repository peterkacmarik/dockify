import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View, Platform, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../../components/ui/Button';
import { useTheme } from '../../../contexts/ThemeContext';
import { ColumnMapper } from '../components/ColumnMapper';
import { cleanOrderItem, validateBatch } from '../services/dataValidator';
import { ExcelParseResult, LegacyParsedOrderItem, pickAndParseExcel } from '../services/excelParser';
import { exportToExcel, saveToDevice } from '../services/excelExporter';
import { IntakeStepper, IntakeStep } from '../components/IntakeStepper';

export default function OrderIntakeScreen() {
    const { t } = useTranslation();
    const { colors } = useTheme();

    // States
    const [currentStep, setCurrentStep] = useState<IntakeStep>('upload');
    const [parseResult, setParseResult] = useState<ExcelParseResult | null>(null);
    const [currentMapping, setCurrentMapping] = useState<Record<number, string>>({});

    const [finalItems, setFinalItems] = useState<LegacyParsedOrderItem[]>([]);
    const [validationErrors, setValidationErrors] = useState<Record<number, string[]>>({});
    const [loading, setLoading] = useState(false);
    const [processingMapping, setProcessingMapping] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [showExportOptions, setShowExportOptions] = useState(false);

    const ITEMS_PER_PAGE = 50;

    // Initialize mapping when parseResult changes (moved from ColumnMapper)
    useEffect(() => {
        if (parseResult && parseResult.actions.length > 0 && parseResult.actions[0].type === 'apply_mapping') {
            const suggested = parseResult.actions[0].mapping;
            const init: Record<number, string> = {};
            Object.entries(suggested).forEach(([field, index]) => {
                init[index] = field;
            });
            setCurrentMapping(init);
        } else {
            setCurrentMapping({});
        }
    }, [parseResult]);

    const resetFlow = () => {
        setParseResult(null);
        setCurrentMapping({});
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
            Alert.alert(t('common.error'), t('intake.uploadError'));
        } finally {
            setLoading(false);
        }
    };

    const handleApplyMapping = async (mapping: Record<string, number> | Record<number, string>) => {
        if (!parseResult) return;

        const fields = Object.values(currentMapping);
        if (!fields.includes('sku') || !fields.includes('quantity')) {
            Alert.alert('Chyba', t('intake.mappingErrorDesc'));
            return;
        }

        setProcessingMapping(true);

        setTimeout(() => {
            try {
                const finalMapping: Record<string, number> = {};
                Object.entries(currentMapping).forEach(([indexStr, field]) => {
                    finalMapping[field] = Number(indexStr);
                });

                const { file_summary } = parseResult;

                const transformed: LegacyParsedOrderItem[] = file_summary.all_rows.map((row, i) => {
                    const qtyVal = row[finalMapping['quantity']];
                    const description = finalMapping['description'] !== undefined ? row[finalMapping['description']] : '';
                    const price = finalMapping['price'] !== undefined ? Number(row[finalMapping['price']]) : undefined;

                    return {
                        partNumber: row[finalMapping['sku']] || '',
                        quantity: qtyVal as any,
                        description: description || '',
                        price: price,
                        isValid: true,
                        validationError: undefined
                    };
                });

                const cleanedItems = transformed.map(cleanOrderItem);

                setFinalItems(cleanedItems);
                setValidationErrors({});
                setCurrentPage(1);
                setCurrentStep('preview');

            } catch (error) {
                console.error('Mapping processing error:', error);
                Alert.alert(t('common.error'), 'Chyba pri spracovaní dát');
            } finally {
                setProcessingMapping(false);
            }
        }, 100);
    };

    const handleConfirmImport = () => {
        const validation = validateBatch(finalItems);

        if (validation.duplicates.length > 0) {
            Alert.alert(`Upozornenie: Duplicitné SKU: ${validation.duplicates.join(', ')}`);
        }

        if (validation.invalidItems.length > 0) {
            const errors: Record<number, string[]> = {};
            validation.invalidItems.forEach(({ index, errors: itemErrors }) => {
                errors[index] = itemErrors;
            });
            setValidationErrors(errors);
            Alert.alert('Chyby v dátach', `Našli sa ${validation.invalidItems.length} chyby. Opravte ich prosím.`);
            return;
        }

        setShowExportOptions(true);
    };

    const handleExportToExcel = async () => {
        try {
            setLoading(true);
            await exportToExcel(finalItems);
            Alert.alert('Success', 'Excel súbor úspešne vyexportovaný!');
        } catch (error) {
            console.error('Export error:', error);
            Alert.alert('Chyba', 'Chyba pri exporte do Excelu');
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
            }
        } catch (error) {
            console.error('Save error:', error);
            Alert.alert('Chyba', 'Chyba pri ukladaní súboru');
        } finally {
            setLoading(false);
        }
    };

    const handleExportToDatabase = () => {
        Alert.alert('Info', 'Ukladanie do databázy bude dostupné čoskoro!');
    };

    const renderFinalItem = (item: LegacyParsedOrderItem, index: number) => {
        const itemErrors = validationErrors[index] || [];
        const hasErrors = itemErrors.length > 0;

        return (
            <View key={index} style={[
                styles.itemCard,
                { backgroundColor: colors.card, borderColor: colors.border },
                hasErrors && { borderColor: colors.error, borderWidth: 1, backgroundColor: colors.error + '08' }
            ]}>
                <View style={styles.itemHeader}>
                    <Text style={[styles.itemSku, { color: hasErrors ? colors.error : colors.text }]}>{item.partNumber}</Text>
                    <View style={[styles.qtyBadge, { backgroundColor: colors.primary + '20' }]}>
                        <Text style={[styles.qtyText, { color: colors.primary }]}>{item.quantity} ks</Text>
                    </View>
                </View>
                {item.description ? <Text style={[styles.itemDesc, { color: colors.textSecondary }]} numberOfLines={1}>{item.description}</Text> : null}
                {item.price !== undefined && (
                    <Text style={{ color: colors.text, marginTop: 4, fontSize: 13, fontWeight: '600' }}>€{item.price.toFixed(2)}</Text>
                )}

                {hasErrors && (
                    <View style={styles.errorList}>
                        {itemErrors.map((error, idx) => (
                            <Text key={idx} style={[styles.errorText, { color: colors.error }]}>• {error}</Text>
                        ))}
                    </View>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>

            <View style={styles.header}>
                <Text style={[styles.screenTitle, { color: colors.text }]}>{t('intake.title')}</Text>
            </View>

            <IntakeStepper currentStep={currentStep} />

            <View style={styles.content}>

                {/* STEP 1: UPLOAD */}
                {currentStep === 'upload' && (
                    <View style={styles.uploadContainer}>
                        <TouchableOpacity
                            style={[styles.uploadZone, { borderColor: colors.border, backgroundColor: colors.card }]}
                            onPress={handleUpload}
                            activeOpacity={0.8}
                        >
                            <View style={[styles.iconCircle, { backgroundColor: colors.primary + '15' }]}>
                                <Ionicons name="cloud-upload" size={48} color={colors.primary} />
                            </View>
                            <Text style={[styles.uploadTitle, { color: colors.text }]}>{t('intake.uploadFile')}</Text>
                            <Text style={[styles.uploadSubtitle, { color: colors.textSecondary }]}>.xls, .xlsx, .csv</Text>

                            {loading && (
                                <Text style={{ color: colors.primary, marginTop: 16 }}>Spracovávam...</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                )}

                {/* STEP 2: MAPPING */}
                {currentStep === 'mapping' && parseResult && (
                    <View style={{ flex: 1 }}>
                        <ColumnMapper
                            parseResult={parseResult}
                            mapping={currentMapping}
                            onChange={setCurrentMapping}
                        />
                        {/* Fixed Actions Footer for Mapping */}
                        <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
                            <View style={{ flexDirection: 'row', gap: 12 }}>
                                <Button
                                    title="Zrušiť"
                                    variant="outline"
                                    onPress={resetFlow}
                                    style={{ flex: 1 }}
                                />
                                <Button
                                    title="Použiť"
                                    onPress={() => handleApplyMapping(currentMapping)}
                                    style={{ flex: 2 }}
                                    loading={processingMapping}
                                />
                            </View>
                        </View>
                    </View>
                )}

                {/* STEP 3: PREVIEW & EXPORT */}
                {currentStep === 'preview' && finalItems.length > 0 && (
                    <View style={{ flex: 1 }}>
                        {/* Summary Dashboard */}
                        <View style={[styles.dashboard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <View style={styles.dashItem}>
                                <Text style={[styles.dashLabel, { color: colors.textSecondary }]}>Položiek</Text>
                                <Text style={[styles.dashValue, { color: colors.text }]}>{finalItems.length}</Text>
                            </View>
                            <View style={styles.dashItem}>
                                <Text style={[styles.dashLabel, { color: colors.textSecondary }]}>Chýb</Text>
                                <Text style={[styles.dashValue, { color: Object.keys(validationErrors).length > 0 ? colors.error : '#4caf50' }]}>
                                    {Object.keys(validationErrors).length}
                                </Text>
                            </View>
                            <View style={styles.dashItem}>
                                <Text style={[styles.dashLabel, { color: colors.textSecondary }]}>Strana</Text>
                                <Text style={[styles.dashValue, { color: colors.text }]}>{currentPage}</Text>
                            </View>
                        </View>

                        <ScrollView style={styles.listContainer} contentContainerStyle={{ paddingBottom: 100 }}>
                            {/* Pagination Controls */}
                            {finalItems.length > ITEMS_PER_PAGE && (
                                <View style={styles.pagination}>
                                    <TouchableOpacity
                                        onPress={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        style={[styles.pageBtn, { borderColor: colors.border, opacity: currentPage === 1 ? 0.5 : 1 }]}
                                    >
                                        <Ionicons name="chevron-back" size={20} color={colors.text} />
                                    </TouchableOpacity>
                                    <Text style={{ color: colors.text, marginHorizontal: 12 }}>
                                        {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, finalItems.length)}
                                    </Text>
                                    <TouchableOpacity
                                        onPress={() => setCurrentPage(p => Math.min(Math.ceil(finalItems.length / ITEMS_PER_PAGE), p + 1))}
                                        disabled={currentPage * ITEMS_PER_PAGE >= finalItems.length}
                                        style={[styles.pageBtn, { borderColor: colors.border, opacity: currentPage * ITEMS_PER_PAGE >= finalItems.length ? 0.5 : 1 }]}
                                    >
                                        <Ionicons name="chevron-forward" size={20} color={colors.text} />
                                    </TouchableOpacity>
                                </View>
                            )}

                            {finalItems
                                .slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
                                .map((item, i) => renderFinalItem(item, (currentPage - 1) * ITEMS_PER_PAGE + i))
                            }
                        </ScrollView>

                        {/* Fixed Actions Footer */}
                        <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
                            {showExportOptions ? (
                                <View style={{ gap: 12 }}>
                                    {Platform.OS === 'android' && (
                                        <Button title="💾 Uložiť do Mobilu" onPress={handleSaveToDevice} loading={loading} />
                                    )}
                                    <Button title="📊 Export (Zdieľať)" variant="outline" onPress={handleExportToExcel} loading={loading} />
                                    <Button title="✅ Hotovo / Nový Import" variant="ghost" onPress={resetFlow} />
                                </View>
                            ) : (
                                <View style={{ flexDirection: 'row', gap: 12 }}>
                                    <Button
                                        title="Späť"
                                        variant="outline"
                                        onPress={() => { setCurrentStep('mapping'); setShowExportOptions(false); }}
                                        style={{ flex: 1 }}
                                    />
                                    <Button
                                        title="Potvrdiť"
                                        onPress={handleConfirmImport}
                                        style={{ flex: 2 }}
                                    />
                                </View>
                            )}
                        </View>
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 20,
        // Removed explicit paddingTop: 16 to reduce spacing
        paddingBottom: 8,
    },
    screenTitle: {
        fontSize: 28,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    content: {
        flex: 1,
    },
    // Upload Styles
    uploadContainer: {
        flex: 1,
        justifyContent: 'center',
        padding: 24,
    },
    uploadZone: {
        height: 300,
        borderRadius: 24,
        borderWidth: 2,
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    uploadTitle: {
        fontSize: 20,
        fontWeight: '700',
    },
    uploadSubtitle: {
        fontSize: 14,
    },
    // Dashboard Styles
    dashboard: {
        flexDirection: 'row',
        padding: 16,
        margin: 16,
        borderRadius: 16,
        borderWidth: 1,
        justifyContent: 'space-around',
    },
    dashItem: {
        alignItems: 'center',
    },
    dashLabel: {
        fontSize: 12,
        marginBottom: 4,
        fontWeight: '600',
    },
    dashValue: {
        fontSize: 18,
        fontWeight: '700',
    },
    // List Styles
    listContainer: {
        flex: 1,
        paddingHorizontal: 16,
    },
    itemCard: {
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 8,
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    itemSku: {
        fontSize: 15,
        fontWeight: '700',
    },
    qtyBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    qtyText: {
        fontSize: 12,
        fontWeight: '700',
    },
    itemDesc: {
        fontSize: 13,
    },
    errorList: {
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: '#ccc',
    },
    errorText: {
        fontSize: 11,
        fontWeight: '600',
    },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    pageBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Footer Actions
    footer: {
        padding: 16,
        paddingBottom: 16, // Standardized padding
        borderTopWidth: 1,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 10,
    },
});
