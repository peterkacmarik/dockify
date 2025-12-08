import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useTheme } from '../../../contexts/ThemeContext';
import { ExcelParseResult } from '../services/excelParser';

interface ColumnMapperProps {
    parseResult: ExcelParseResult;
    mapping: Record<number, string>;
    onChange: (newMapping: Record<number, string>) => void;
    // Removed onApply and onCancel as they are now handled by parent
}

const AVAILABLE_FIELDS = ['sku', 'quantity', 'description', 'price', 'ignore'];

export const ColumnMapper: React.FC<ColumnMapperProps> = ({ parseResult, mapping, onChange }) => {
    const { t } = useTranslation();
    const { colors } = useTheme();

    const handleFieldSelect = (colIndex: number, field: string) => {
        const newMapping = { ...mapping };

        // Logic: preventing duplicates for unique fields if needed, but let's keep it simple flexibility
        // If field is 'ignore', remove from mapping
        if (field === 'ignore') {
            delete newMapping[colIndex];
        } else {
            // Remove this field from other columns if it's unique? (SKU/Qty usually unique)
            // Optional: for now allow user to do whatever, validation will catch it
            newMapping[colIndex] = field;
        }
        onChange(newMapping);
    };

    const getFieldLabel = (field: string) => t(`intake.fieldName_${field}`);

    return (
        <View style={styles.container}>
            {/* Header removed as requested for global flow consistency 
                 (Or keep a minimal sub-header if helpful) */}
            <Text style={[styles.subTitle, { color: colors.text }]}>{t('intake.mapColumnsDesc', 'Priraďte stĺpce z Excelu k systémovým poliam')}</Text>

            <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 24 }}>
                {parseResult.detected_columns.map((col) => {
                    const assigned = mapping[col.column_index] || 'ignore';

                    return (
                        <View key={col.column_index} style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <View style={styles.colInfo}>
                                <Text style={[styles.colHeader, { color: colors.text }]}>{col.header}</Text>
                                {col.suggested_field && (
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                                        <Ionicons name="sparkles" size={12} color={colors.primary} style={{ marginRight: 4 }} />
                                        <Text style={[styles.suggestion, { color: colors.textSecondary }]}>
                                            {getFieldLabel(col.suggested_field)}
                                        </Text>
                                    </View>
                                )}
                            </View>

                            <View style={styles.fieldSelect}>
                                {AVAILABLE_FIELDS.map(f => (
                                    <TouchableOpacity
                                        key={f}
                                        style={[
                                            styles.chip,
                                            { borderColor: colors.border, backgroundColor: colors.background },
                                            assigned === f && { backgroundColor: colors.primary + '20', borderColor: colors.primary }
                                        ]}
                                        onPress={() => handleFieldSelect(col.column_index, f)}
                                    >
                                        <Text style={[
                                            styles.chipText,
                                            { color: colors.textSecondary },
                                            assigned === f && { color: colors.primary, fontWeight: '700' }
                                        ]}>
                                            {getFieldLabel(f)}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    );
                })}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 16,
    },
    subTitle: {
        fontSize: 14,
        marginBottom: 16,
        marginTop: 8,
        opacity: 0.7,
    },
    scroll: {
        flex: 1,
    },
    row: {
        marginBottom: 12,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
    },
    colInfo: {
        marginBottom: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#ccc',
        paddingBottom: 8,
    },
    colHeader: {
        fontSize: 16,
        fontWeight: '700',
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
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
    },
    chipText: {
        fontSize: 12,
        fontWeight: '500',
    },
});
