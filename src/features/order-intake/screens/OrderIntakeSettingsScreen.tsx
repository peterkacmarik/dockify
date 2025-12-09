import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '../../../contexts/ThemeContext';
import { useIntakeSettings } from '../hooks/useIntakeSettings';
import { Button } from '../../../components/ui/Button';

export default function OrderIntakeSettingsScreen() {
    const { colors } = useTheme();
    const router = useRouter();
    const { settings, fields, updatePaginationLimit, toggleField, addField, deleteField, loading } = useIntakeSettings();

    const [newFieldLabel, setNewFieldLabel] = useState('');
    const [newFieldKey, setNewFieldKey] = useState('');
    const [newFieldRequired, setNewFieldRequired] = useState(false);
    const [adding, setAdding] = useState(false);

    const handleAddField = async () => {
        if (!newFieldLabel.trim()) return;
        setAdding(true);
        const success = await addField(newFieldLabel.trim(), newFieldKey.trim() || undefined, newFieldRequired);
        if (success) {
            setNewFieldLabel('');
            setNewFieldKey('');
            setNewFieldRequired(false);
        } else {
            Alert.alert('Chyba', 'Nepodarilo sa pridať pole. Skontrolujte či už neexistuje.');
        }
        setAdding(false);
    };

    const handleDeleteField = (id: string, label: string) => {
        Alert.alert(
            'Zmazať pole',
            `Naozaj chcete natrvalo zmazať pole "${label}"? Táto akcia je nevratná.`,
            [
                { text: 'Zrušiť', style: 'cancel' },
                { text: 'Zmazať', style: 'destructive', onPress: () => deleteField(id) }
            ]
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <Text style={{ color: colors.text, textAlign: 'center', marginTop: 20 }}>Načítavam...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: colors.text }]}>Nastavenia Príjmu</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                {/* System Fields Section */}
                <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[styles.sectionTitle, { color: colors.primary }]}>Systémové polia</Text>
                    <Text style={[styles.sectionDesc, { color: colors.textSecondary }]}>
                        Spravujte polia pre spracovanie objednávok.
                    </Text>

                    {fields.map((field) => (
                        <View key={field.id} style={[styles.row, { borderBottomColor: colors.border }]}>
                            <View style={styles.rowInfo}>
                                <Text style={[styles.rowLabel, { color: colors.text }]}>
                                    {field.label}
                                    {field.is_required && <Text style={{ color: colors.error }}> *</Text>}
                                </Text>
                                <Text style={[styles.rowSubLabel, { color: colors.textSecondary }]}>
                                    ID: {field.key}
                                </Text>
                            </View>

                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                {!field.is_required && (
                                    <TouchableOpacity onPress={() => handleDeleteField(field.id, field.label)}>
                                        <Ionicons name="trash-outline" size={20} color={colors.error} />
                                    </TouchableOpacity>
                                )}

                                <Switch
                                    value={field.is_active || false}
                                    onValueChange={(val) => toggleField(field.id, val)}
                                    disabled={field.is_required || false}
                                    trackColor={{ false: '#767577', true: colors.primary }}
                                    thumbColor={'#f4f3f4'}
                                />
                            </View>
                        </View>
                    ))}

                    {/* Add New Field */}
                    <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.border }}>
                        <Text style={[styles.rowLabel, { color: colors.text, marginBottom: 12 }]}>Pridať nové pole</Text>

                        <View style={{ gap: 12 }}>
                            <TextInput
                                style={[styles.input, { color: colors.text, borderColor: colors.border, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 }]}
                                placeholder="Názov poľa (napr. Farba)"
                                placeholderTextColor={colors.textSecondary}
                                value={newFieldLabel}
                                onChangeText={setNewFieldLabel}
                            />

                            <TextInput
                                style={[styles.input, { color: colors.text, borderColor: colors.border, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 }]}
                                placeholder="Kľúč (voliteľné, napr. color)"
                                placeholderTextColor={colors.textSecondary}
                                value={newFieldKey}
                                onChangeText={setNewFieldKey}
                                autoCapitalize="none"
                            />

                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Text style={{ color: colors.text }}>Povinné pole</Text>
                                <Switch
                                    value={newFieldRequired}
                                    onValueChange={setNewFieldRequired}
                                    trackColor={{ false: '#767577', true: colors.primary }}
                                    thumbColor={'#f4f3f4'}
                                />
                            </View>

                            <Button
                                title="Pridať nové pole"
                                onPress={handleAddField}
                                loading={adding}
                                disabled={!newFieldLabel.trim()}
                                style={{ marginTop: 8 }}
                            />
                        </View>
                    </View>
                </View>

                {/* Pagination Section */}
                <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[styles.sectionTitle, { color: colors.primary }]}>Paginácia</Text>
                    <Text style={[styles.sectionDesc, { color: colors.textSecondary }]}>
                        Počet riadkov zobrazených na jednej strane pri kontrole.
                    </Text>

                    <View style={styles.inputRow}>
                        <Text style={[styles.rowLabel, { color: colors.text }]}>Riadkov na stranu:</Text>
                        <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.background }]}>
                            <TextInput
                                style={[styles.input, { color: colors.text, flex: 1, textAlign: 'center' }]}
                                defaultValue={String(settings.paginationLimit)}
                                keyboardType="number-pad"
                                onEndEditing={(e) => {
                                    const val = parseInt(e.nativeEvent.text, 10);
                                    if (!isNaN(val) && val > 0) {
                                        updatePaginationLimit(val);
                                    } else {
                                        // Reset to invalid value prevention
                                        updatePaginationLimit(settings.paginationLimit);
                                    }
                                }}
                            />
                        </View>
                    </View>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    backButton: {
        marginRight: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    content: {
        padding: 16,
    },
    section: {
        borderRadius: 12,
        borderWidth: 1,
        padding: 16,
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 8,
    },
    sectionDesc: {
        fontSize: 14,
        marginBottom: 16,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    rowInfo: {
        flex: 1,
        paddingRight: 16,
    },
    rowLabel: {
        fontSize: 16,
        fontWeight: '600',
    },
    rowSubLabel: {
        fontSize: 13,
        marginTop: 4,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    inputContainer: {
        borderWidth: 1,
        borderRadius: 8,
        width: 80,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    input: {
        fontSize: 16,
    },
});
