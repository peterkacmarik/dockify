import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Button } from '../../../components/ui/Button';
import { useTheme } from '../../../contexts/ThemeContext';
import { ExcelParseResult } from '../services/excelParser';
import { templateService } from '../services/templateService';

interface ColumnMapperProps {
    parseResult: ExcelParseResult;
    onApply: (mapping: Record<string, number>) => void;
    onCancel: () => void;
}

const AVAILABLE_FIELDS = ['sku', 'quantity', 'description', 'price', 'ignore'];

export const ColumnMapper: React.FC<ColumnMapperProps> = ({ parseResult, onApply, onCancel }) => {
    const { t } = useTranslation();
    const { colors } = useTheme();

    // State: mapping[headerIndex] = fieldName ('sku', 'quantity'...)
    const [currentMapping, setCurrentMapping] = useState<Record<number, string>>({});
    const [saveTemplate, setSaveTemplate] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        // Initialize from agent suggestion
        const init: Record<number, string> = {};
        if (parseResult.actions.length > 0 && parseResult.actions[0].type === 'apply_mapping') {
            const suggested = parseResult.actions[0].mapping;
            // invert: field -> index  =>  index -> field
            Object.entries(suggested).forEach(([field, index]) => {
                init[index] = field;
            });
        }
        setCurrentMapping(init);
    }, [parseResult]);

    const handleFieldSelect = (colIndex: number, field: string) => {
        const newMapping = { ...currentMapping };

        // If assigning a unique field (like sku), remove it from other columns?
        // Let's allow duplicates for now or just overwrite if user is explicit
        // But better UX: if I select SKU for Col A, and Col B was SKU, unmap Col B.
        if (field !== 'ignore' && field !== 'description') { // description might be multiple? No, usually one.
            Object.keys(newMapping).forEach(k => {
                if (newMapping[Number(k)] === field) delete newMapping[Number(k)];
            });
        }

        if (field === 'ignore') {
            delete newMapping[colIndex];
        } else {
            newMapping[colIndex] = field;
        }
        setCurrentMapping(newMapping);
    };

    const handleApply = async () => {
        // Validation
        const fields = Object.values(currentMapping);
        if (!fields.includes('sku') || !fields.includes('quantity')) {
            alert(t('intake.mappingErrorDesc'));
            return;
        }

        setIsProcessing(true);

        // Use setTimeout to allow UI to update with loading state
        setTimeout(async () => {
            try {
                // Convert index->field back to field->index
                const finalMapping: Record<string, number> = {};
                Object.entries(currentMapping).forEach(([indexStr, field]) => {
                    finalMapping[field] = Number(indexStr);
                });

                if (saveTemplate) {
                    await templateService.saveTemplate('default', finalMapping);
                }

                onApply(finalMapping);
            } catch (error) {
                console.error('Mapping error:', error);
                alert('Chyba pri spracovaní mapovania');
            } finally {
                setIsProcessing(false);
            }
        }, 100);
    };

    const getFieldLabel = (field: string) => t(`intake.fieldName_${field}`);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text }]}>{t('intake.mapColumns')}</Text>
            </View>

            <ScrollView style={styles.scroll}>
                {parseResult.detected_columns.map((col) => {
                    const assigned = currentMapping[col.column_index] || 'ignore';

                    return (
                        <View key={col.column_index} style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <View style={styles.colInfo}>
                                <Text style={[styles.colHeader, { color: colors.text }]}>{col.header}</Text>
                                {col.suggested_field && (
                                    <Text style={[styles.suggestion, { color: colors.textSecondary }]}>
                                        (AI: {getFieldLabel(col.suggested_field)})
                                    </Text>
                                )}
                            </View>

                            <View style={styles.fieldSelect}>
                                {AVAILABLE_FIELDS.map(f => (
                                    <TouchableOpacity
                                        key={f}
                                        style={[
                                            styles.chip,
                                            { borderColor: colors.border },
                                            assigned === f && { backgroundColor: colors.primary, borderColor: colors.primary }
                                        ]}
                                        onPress={() => handleFieldSelect(col.column_index, f)}
                                    >
                                        <Text style={[
                                            styles.chipText,
                                            { color: colors.text },
                                            assigned === f && { color: '#fff' }
                                        ]}>
                                            {getFieldLabel(f)}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    );
                })}

                <TouchableOpacity
                    style={styles.checkboxRow}
                    onPress={() => setSaveTemplate(!saveTemplate)}
                >
                    <Ionicons
                        name={saveTemplate ? "checkbox" : "square-outline"}
                        size={24}
                        color={colors.primary}
                    />
                    <Text style={[styles.checkboxLabel, { color: colors.text }]}>{t('intake.saveTemplate')}</Text>
                </TouchableOpacity>

            </ScrollView>

            <View style={styles.footer}>
                <Button title={t('common.cancel')} onPress={onCancel} variant="outline" style={{ flex: 1, marginRight: 8 }} disabled={isProcessing} />
                <Button title={t('intake.applyMapping')} onPress={handleApply} style={{ flex: 1 }} loading={isProcessing} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        marginBottom: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    scroll: {
        flex: 1,
    },
    row: {
        marginBottom: 12,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
    },
    colInfo: {
        marginBottom: 8,
    },
    colHeader: {
        fontSize: 16,
        fontWeight: '600',
    },
    suggestion: {
        fontSize: 12,
        fontStyle: 'italic',
    },
    fieldSelect: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
    },
    chipText: {
        fontSize: 12,
        fontWeight: '500',
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
    },
    checkboxLabel: {
        marginLeft: 8,
        fontSize: 16,
    },
    footer: {
        flexDirection: 'row',
        marginTop: 16,
    },
});
