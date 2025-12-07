import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY_PREFIX = '@dockify_templates_';

export interface ColumnMappingTemplate {
    id: string;
    customerId: string; // 'default' for now
    name: string;
    mapping: Record<string, number>; // fieldName -> colIndex
    createdAt: number;
}

export const templateService = {
    // Save a new template
    saveTemplate: async (customerId: string, mapping: Record<string, number>): Promise<void> => {
        try {
            const key = `${STORAGE_KEY_PREFIX}${customerId}`;
            const existingStr = await AsyncStorage.getItem(key);
            const templates: ColumnMappingTemplate[] = existingStr ? JSON.parse(existingStr) : [];

            // Deduplicate: if exists same mapping, skip or update? For MVP, just add new one.
            // Or better: update "Last Used"

            const newTemplate: ColumnMappingTemplate = {
                id: Date.now().toString(),
                customerId,
                name: `Template ${new Date().toLocaleDateString()}`,
                mapping,
                createdAt: Date.now(),
            };

            // Keep only latest 5 templates per customer
            const updated = [newTemplate, ...templates].slice(0, 5);

            await AsyncStorage.setItem(key, JSON.stringify(updated));
        } catch (error) {
            console.error('Failed to save template:', error);
        }
    },

    // Get templates for customer
    getTemplates: async (customerId: string): Promise<ColumnMappingTemplate[]> => {
        try {
            const key = `${STORAGE_KEY_PREFIX}${customerId}`;
            const str = await AsyncStorage.getItem(key);
            return str ? JSON.parse(str) : [];
        } catch (error) {
            console.error('Failed to get templates:', error);
            return [];
        }
    },

    // Find a matching template for the current headers (Advanced - Phase 3 candidate, but stubs here)
    findMatchingTemplate: async (customerId: string, headers: string[]): Promise<ColumnMappingTemplate | null> => {
        // Logic would be: check if template columns match current headers
        return null;
    }
};
