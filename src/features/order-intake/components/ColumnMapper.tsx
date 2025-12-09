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
    customFields: { key: string; label: string; is_active: boolean | null }[];
}

const AVAILABLE_FIELDS = ['sku', 'quantity', 'description', 'price', 'ignore'];

export const ColumnMapper: React.FC<ColumnMapperProps> = ({ parseResult, mapping, onChange, customFields = [] }) => {
    const { t } = useTranslation();
    const { colors } = useTheme();

    const handleFieldSelect = (colIndex: number, fieldKey: string) => {
        const newMapping = { ...mapping };

        if (fieldKey === 'ignore') {
            delete newMapping[colIndex];
        } else {
            newMapping[colIndex] = fieldKey;
        }
        onChange(newMapping);
    };

    const getFieldLabel = (fieldKey: string) => {
        if (fieldKey === 'ignore') return 'Ignorovať';
        const field = customFields.find(f => f.key === fieldKey);
        return field ? field.label : fieldKey;
    };

    // Merge standard fields (if any legacy logic remains) with DB fields
    // Actually, we should rely purely on customFields passed from parent, plus 'ignore'
    const availableOptions = [
        ...customFields.filter(f => f.is_active).map(f => f.key),
        'ignore'
    ];

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
                            </View>

                            <View style={styles.fieldSelect}>
                                {availableOptions.map(fKey => (
                                    <TouchableOpacity
                                        key={fKey}
                                        style={[
                                            styles.chip,
                                            { borderColor: colors.border, backgroundColor: colors.background },
                                            assigned === fKey && { backgroundColor: colors.primary + '20', borderColor: colors.primary }
                                        ]}
                                        onPress={() => handleFieldSelect(col.column_index, fKey)}
                                    >
                                        <Text style={[
                                            styles.chipText,
                                            { color: colors.textSecondary },
                                            assigned === fKey && { color: colors.primary, fontWeight: '700' }
                                        ]}>
                                            {getFieldLabel(fKey)}
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
