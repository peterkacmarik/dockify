import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { utils, write } from 'xlsx';
import { LegacyParsedOrderItem } from './excelParser';

/**
 * Export validated order items to Excel file
 */
export const exportToExcel = async (items: LegacyParsedOrderItem[]): Promise<void> => {
    try {
        // Prepare data for Excel
        const excelData = items.map(item => ({
            'SKU': item.partNumber,
            'Množstvo': item.quantity,
            'Popis': item.description || '',
            'Cena': item.price !== undefined ? item.price : '',
        }));

        // Create worksheet
        const worksheet = utils.json_to_sheet(excelData);

        // Set column widths
        worksheet['!cols'] = [
            { wch: 15 }, // SKU
            { wch: 10 }, // Množstvo
            { wch: 40 }, // Popis
            { wch: 10 }, // Cena
        ];

        // Create workbook
        const workbook = utils.book_new();
        utils.book_append_sheet(workbook, worksheet, 'Objednávka');

        // Generate Excel file (base64)
        const excelBuffer = write(workbook, { type: 'base64', bookType: 'xlsx' });

        // Create filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const filename = `objednavka_${timestamp}.xlsx`;
        const fileUri = `${FileSystem.documentDirectory}${filename}`;

        // Save file
        await FileSystem.writeAsStringAsync(fileUri, excelBuffer, {
            encoding: FileSystem.EncodingType.Base64,
        });

        // Share file (allows user to save to Downloads, share via apps, etc.)
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

        console.log('Excel file exported successfully:', fileUri);
    } catch (error) {
        console.error('Error exporting to Excel:', error);
        throw error;
    }
};
