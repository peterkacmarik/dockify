import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { read, utils } from 'xlsx';
import i18n from '../../../lib/i18n';

export interface ParsedOrderItem {
    partNumber: string;
    quantity: number;
    description?: string;
    price?: number;
    isValid: boolean;
    validationError?: string;
}

export const pickAndParseExcel = async (): Promise<ParsedOrderItem[]> => {
    try {
        const result = await DocumentPicker.getDocumentAsync({
            type: [
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
                'application/vnd.ms-excel', // .xls
                'text/csv', // .csv
                'text/comma-separated-values', // .csv alternative
            ],
            copyToCacheDirectory: true,
        });

        if (result.canceled || !result.assets || result.assets.length === 0) {
            return [];
        }

        const file = result.assets[0];
        const fileUri = file.uri;
        const fileName = file.name || '';

        // Check if file is CSV
        const isCSV = fileName.toLowerCase().endsWith('.csv') ||
            file.mimeType?.includes('csv');

        let rawData: any[];

        if (isCSV) {
            // Parse CSV
            const fileContent = await FileSystem.readAsStringAsync(fileUri, {
                encoding: 'utf8',
            });
            rawData = parseCSV(fileContent);
        } else {
            // Parse Excel
            const fileContent = await FileSystem.readAsStringAsync(fileUri, {
                encoding: 'base64',
            });
            const workbook = read(fileContent, { type: 'base64' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            rawData = utils.sheet_to_json(sheet);
        }

        return transformAndValidate(rawData);

    } catch (error) {
        console.error('Error parsing file:', error);
        throw new Error(i18n.t('common.error'));
    }
};

const parseCSV = (content: string): any[] => {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length === 0) return [];

    // Parse header
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));

    // Parse rows
    const data: any[] = [];
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const row: any = {};
        headers.forEach((header, index) => {
            row[header] = values[index] || '';
        });
        data.push(row);
    }

    return data;
};

const transformAndValidate = (data: any[]): ParsedOrderItem[] => {
    return data.map((row, index) => {
        // Adapt these keys based on expected Excel/CSV columns
        const partNumber = row['Part Number'] || row['PartNumber'] || row['Code'] || row['Item'] || row['product_id'] || '';
        const quantity = row['Quantity'] || row['Qty'] || row['Amount'] || row['qty'] || 0;
        const description = row['Description'] || row['Name'] || row['job'] || '';
        const price = row['Price'] || row['Unit Price'] || row['amount'] || null;

        let isValid = true;
        let validationError = undefined;

        if (!partNumber) {
            isValid = false;
            validationError = i18n.t('intake.missingPartNumber');
        } else if (quantity <= 0) {
            isValid = false;
            validationError = i18n.t('intake.invalidQuantity');
        }

        return {
            partNumber: String(partNumber),
            quantity: Number(quantity),
            description: String(description),
            price: price ? Number(price) : undefined,
            isValid,
            validationError,
        };
    });
};
