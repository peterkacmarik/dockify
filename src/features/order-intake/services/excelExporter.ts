import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { utils, write } from 'xlsx';
import { LegacyParsedOrderItem } from './excelParser';

const { StorageAccessFramework } = FileSystem;

const generateExcelBase64 = (items: LegacyParsedOrderItem[]): string => {
    const excelData = items.map(item => ({
        'SKU': item.partNumber,
        'Množstvo': item.quantity,
        'Popis': item.description || '',
        'Cena': item.price !== undefined ? item.price : '',
    }));

    const worksheet = utils.json_to_sheet(excelData);

    // Set column widths
    worksheet['!cols'] = [
        { wch: 15 }, // SKU
        { wch: 10 }, // Množstvo
        { wch: 40 }, // Popis
        { wch: 10 }, // Cena
    ];

    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, 'Objednávka');

    return write(workbook, { type: 'base64', bookType: 'xlsx' });
};

const getTimestampedFilename = () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    return `objednavka_${timestamp}.xlsx`;
};

/**
 * Share Excel file (opens system share dialog)
 */
export const exportToExcel = async (items: LegacyParsedOrderItem[]): Promise<void> => {
    try {
        const excelBuffer = generateExcelBase64(items);
        const filename = getTimestampedFilename();
        const fileUri = `${FileSystem.documentDirectory}${filename}`;

        await FileSystem.writeAsStringAsync(fileUri, excelBuffer, {
            encoding: FileSystem.EncodingType.Base64,
        });

        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
            await Sharing.shareAsync(fileUri, {
                mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                dialogTitle: 'Uložiť objednávku',
                UTI: 'com.microsoft.excel.xlsx',
            });
        } else {
            throw new Error('Sharing is not available on this device');
        }
    } catch (error) {
        console.error('Error exporting to Excel:', error);
        throw error;
    }
};

/**
 * Save Excel file directly to device storage
 * On Android: Uses StorageAccessFramework to ask user for folder
 * On iOS: Falls back to Share (which has Save to Files)
 */
export const saveToDevice = async (items: LegacyParsedOrderItem[]): Promise<boolean> => {
    try {
        if (Platform.OS === 'android') {
            const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync();
            if (!permissions.granted) return false;

            const excelBuffer = generateExcelBase64(items);
            const filename = getTimestampedFilename();

            // Create file in selected directory
            const uri = await StorageAccessFramework.createFileAsync(
                permissions.directoryUri,
                filename,
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            );

            await FileSystem.writeAsStringAsync(uri, excelBuffer, {
                encoding: FileSystem.EncodingType.Base64
            });
            return true;
        } else {
            // iOS fallback
            await exportToExcel(items);
            return true;
        }
    } catch (error) {
        console.error('Error saving to device:', error);
        throw error;
    }
};
