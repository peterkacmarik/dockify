import { LegacyParsedOrderItem } from './excelParser';

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
}

export interface BatchValidationResult {
    validItems: LegacyParsedOrderItem[];
    invalidItems: Array<{ item: LegacyParsedOrderItem; index: number; errors: string[] }>;
    duplicates: string[];
}

/**
 * Clean and normalize an order item
 */
export const cleanOrderItem = (item: LegacyParsedOrderItem): LegacyParsedOrderItem => {
    return {
        ...item,
        partNumber: cleanSKU(item.partNumber),
        quantity: parseQuantity(item.quantity),
        description: item.description?.trim() || '',
        price: item.price !== undefined ? Number(item.price) : undefined,
    };
};

/**
 * Clean SKU: trim, uppercase, remove extra spaces
 */
const cleanSKU = (sku: string): string => {
    return sku.trim().toUpperCase().replace(/\s+/g, '');
};

/**
 * Parse quantity from various formats: "10", "10ks", "10 ks", etc.
 */
const parseQuantity = (qty: number | string): number => {
    if (typeof qty === 'number') return qty;

    const cleaned = String(qty).trim().toLowerCase();
    const match = cleaned.match(/^(\d+)/);

    return match ? parseInt(match[1], 10) : 0;
};

/**
 * Validate a single order item
 */
export const validateOrderItem = (item: LegacyParsedOrderItem): ValidationResult => {
    const errors: string[] = [];

    // Required: SKU
    if (!item.partNumber || item.partNumber.trim() === '') {
        errors.push('SKU je povinné pole');
    } else {
        // SKU pattern: alphanumeric + hyphens
        const skuPattern = /^[A-Z0-9-]+$/;
        if (!skuPattern.test(item.partNumber)) {
            errors.push('SKU môže obsahovať len písmená, čísla a pomlčky');
        }
    }

    // Required: Quantity
    if (item.quantity === undefined || item.quantity === null) {
        errors.push('Množstvo je povinné pole');
    } else if (item.quantity <= 0) {
        errors.push('Množstvo musí byť väčšie ako 0');
    } else if (item.quantity > 10000) {
        errors.push('Množstvo je príliš vysoké (max 10000)');
    } else if (!Number.isInteger(item.quantity)) {
        errors.push('Množstvo musí byť celé číslo');
    }

    // Optional: Price validation
    if (item.price !== undefined && item.price !== null) {
        if (item.price < 0) {
            errors.push('Cena nemôže byť záporná');
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
};

/**
 * Validate a batch of items and check for duplicates
 */
export const validateBatch = (items: LegacyParsedOrderItem[]): BatchValidationResult => {
    const validItems: LegacyParsedOrderItem[] = [];
    const invalidItems: Array<{ item: LegacyParsedOrderItem; index: number; errors: string[] }> = [];
    const skuCounts = new Map<string, number>();
    const duplicates: string[] = [];

    items.forEach((item, index) => {
        // Count SKUs for duplicate detection
        const sku = item.partNumber?.trim().toUpperCase();
        if (sku) {
            skuCounts.set(sku, (skuCounts.get(sku) || 0) + 1);
        }

        // Validate item
        const validation = validateOrderItem(item);

        if (validation.isValid) {
            validItems.push(item);
        } else {
            invalidItems.push({ item, index, errors: validation.errors });
        }
    });

    // Find duplicates
    skuCounts.forEach((count, sku) => {
        if (count > 1) {
            duplicates.push(sku);
        }
    });

    return {
        validItems,
        invalidItems,
        duplicates,
    };
};
