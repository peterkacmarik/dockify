import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { read, utils } from 'xlsx';

// --- Types ---

export interface LegacyParsedOrderItem {
    partNumber: string;
    quantity: number;
    description?: string;
    price?: number;
    isValid: boolean;
    validationError?: string;
}

export interface DetectedColumn {
    column_index: number;
    header: string;
    suggested_field: string | null; // 'sku' | 'quantity' | 'description' | 'price' | null
    confidence: number;
    reason: string[];
}

export interface FileSummary {
    rows: number;
    cols: number;
    sample_rows: string[][];
    all_rows: string[][]; // Full dataset for mapping
}

export interface GlobalInferences {
    delimiter: string | null;
    decimal_separator: string | null;
    currency: string | null;
}

export interface MappingAction {
    type: 'apply_mapping';
    mapping: Record<string, number>; // field -> column_index
}

export interface RowWarning {
    row: number; // 0-indexed relative to data rows
    issue: string; // e.g. 'quantity_missing'
    details: string;
}

export interface ExcelParseResult {
    file_summary: FileSummary;
    detected_columns: DetectedColumn[];
    global_inferences: GlobalInferences;
    overall_confidence: number;
    actions: MappingAction[];
    warnings: RowWarning[];
    ai_enhanced?: boolean;
}

// --- Configuration ---

import { analyzeWithLLM } from './llmParser';

const SAMPLE_ROW_COUNT = 5;
const ANALYSIS_ROW_LIMIT = 200;
const CONFIDENCE_THRESHOLD_LLM = 0.75;

interface FieldConfig {
    keywords: string[];
    pattern?: RegExp;
}

const KNOWN_FIELDS: Record<string, FieldConfig> = {
    partNumber: {
        keywords: ['sku', 'item', 'item code', 'part', 'part no', 'part number', 'code', 'product_id'],
        pattern: /^[A-Z0-9\-\/\.]{3,}$/i, // Basic alphanumeric + separators
    },
    quantity: {
        keywords: ['qty', 'quantity', 'amount', 'q', 'count'],
    },
    description: {
        keywords: ['desc', 'description', 'name', 'job', 'product name'],
    },
    price: {
        keywords: ['price', 'unit price', 'amount', 'cost', 'unit cost'],
    },
};

// --- Main Function ---

export const pickAndParseExcel = async (useLLM: boolean = true): Promise<ExcelParseResult | null> => {
    try {
        const result = await DocumentPicker.getDocumentAsync({
            type: [
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
                'application/vnd.ms-excel', // .xls
                'text/csv', // .csv
                'text/comma-separated-values', // .csv
            ],
            copyToCacheDirectory: true,
        });

        if (result.canceled || !result.assets || result.assets.length === 0) {
            return null;
        }

        const file = result.assets[0];
        const fileUri = file.uri;
        const fileName = file.name || '';
        const isCSV = fileName.toLowerCase().endsWith('.csv') || file.mimeType?.includes('csv');

        let rawData: string[][]; // Array of arrays of strings
        let globalInferences: GlobalInferences = { delimiter: null, decimal_separator: '.', currency: null };

        if (isCSV) {
            const fileContent = await FileSystem.readAsStringAsync(fileUri, { encoding: 'utf8' });
            const parseResult = parseCSV(fileContent);
            rawData = parseResult.data;
            globalInferences.delimiter = parseResult.delimiter;
        } else {
            const fileContent = await FileSystem.readAsStringAsync(fileUri, { encoding: 'base64' });
            const workbook = read(fileContent, { type: 'base64' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            // sheet_to_json with header: 1 returns array of arrays
            rawData = utils.sheet_to_json(sheet, { header: 1, defval: '' }) as string[][];
        }

        if (!rawData || rawData.length === 0) {
            throw new Error('Empty file');
        }

        let parseResult = analyzeFile(rawData, globalInferences);

        // --- LLM Fallback (if enabled) ---
        if (useLLM && parseResult.overall_confidence < CONFIDENCE_THRESHOLD_LLM) {
            console.log('Low confidence detected, triggering LLM analysis...');
            try {
                const llmResult = await analyzeWithLLM(parseResult.file_summary);
                if (llmResult.detected_columns && llmResult.detected_columns.length > 0) {
                    // Merge: Overwrite detected columns and confidence
                    parseResult.detected_columns = llmResult.detected_columns;
                    parseResult.overall_confidence = llmResult.overall_confidence || parseResult.overall_confidence;
                    parseResult.ai_enhanced = true;

                    // Re-generate actions based on new columns
                    const mapping: Record<string, number> = {};
                    parseResult.detected_columns.forEach(col => {
                        if (col.suggested_field && col.confidence > 0.4) {
                            mapping[col.suggested_field] = col.column_index;
                        }
                    });
                    parseResult.actions = [{ type: 'apply_mapping', mapping }];
                }
            } catch (llmError) {
                console.warn('LLM fallback failed, keeping rule-based result', llmError);
            }
        }

        return parseResult;

    } catch (error) {
        console.error('Error parsing file:', error);
        throw error;
    }
};

// --- Analysis Logic ---

const analyzeFile = (data: string[][], inferences: GlobalInferences): ExcelParseResult => {
    // 1. Identify Header Row (Naive approach: assume row 0 for now, improvement: scan first 5 rows)
    const headerRowIndex = 0;
    const headers = data[headerRowIndex].map(h => String(h).trim());
    const dataRows = data.slice(headerRowIndex + 1);

    // Limit data for analysis to save perf
    const analysisRows = dataRows.slice(0, ANALYSIS_ROW_LIMIT);

    // 2. Detect Columns
    const detected_columns: DetectedColumn[] = headers.map((header, index) => {
        return analyzeColumn(header, index, analysisRows);
    });

    // 3. Calculate Overall Confidence & Suggest Mapping
    const mapping: Record<string, number> = {};
    let totalConfidence = 0;
    let requiredFieldsFound = 0;

    // Greedy assignment: sort by confidence, assign to fields if not already taken
    const sortedCols = [...detected_columns].sort((a, b) => b.confidence - a.confidence);
    const assignedFields = new Set<string>();

    for (const col of sortedCols) {
        if (col.suggested_field && !assignedFields.has(col.suggested_field) && col.confidence > 0.4) {
            mapping[col.suggested_field] = col.column_index;
            assignedFields.add(col.suggested_field);
            totalConfidence += col.confidence;
            if (['sku', 'quantity'].includes(col.suggested_field)) {
                requiredFieldsFound++;
            }
        }
    }

    // Normalized metric: Average confidence of assigned fields, penalized if required missing
    const overall_confidence = assignedFields.size > 0
        ? (totalConfidence / assignedFields.size) * (requiredFieldsFound / 2) // /2 because sku+qty are critical
        : 0;

    // 4. Generate Warnings (Basic)
    const warnings: RowWarning[] = [];
    if (mapping['quantity'] !== undefined) {
        dataRows.forEach((row, idx) => {
            const qtyVal = row[mapping['quantity']];
            if (!qtyVal || isNaN(parseFloat(String(qtyVal)))) {
                if (warnings.length < 50) { // Limit warnings
                    warnings.push({
                        row: idx,
                        issue: 'quantity_invalid',
                        details: `Row ${idx + 2}: Invalid quantity '${qtyVal}'`
                    });
                }
            }
        });
    }

    return {
        file_summary: {
            rows: dataRows.length,
            cols: headers.length,
            sample_rows: dataRows.slice(0, SAMPLE_ROW_COUNT).map(row => row.map(c => String(c))),
            all_rows: dataRows.map(row => row.map(c => String(c))), // Full dataset
        },
        detected_columns,
        global_inferences: inferences,
        overall_confidence: Math.min(overall_confidence, 1.0),
        actions: overall_confidence > 0.5 ? [{ type: 'apply_mapping', mapping }] : [],
        warnings,
    };
};

const analyzeColumn = (header: string, index: number, rows: string[][]): DetectedColumn => {
    let bestField: string | null = null;
    let maxScore = 0;
    let reasons: string[] = [];

    const normHeader = header.toLowerCase().replace(/[^a-z0-9]/g, '');

    // Check against known fields
    for (const [field, config] of Object.entries(KNOWN_FIELDS)) {
        let score = 0;
        const fieldReasons: string[] = [];

        // A. Header Match (Weight: 0.6)
        if (config.keywords.some(k => normHeader.includes(k.replace(/\s/g, '')))) {
            score += 0.6;
            fieldReasons.push(`header_match: ${header}`);
        } else if (config.keywords.some(k => k.includes(normHeader)) && normHeader.length > 2) {
            // Partial reverse match
            score += 0.3;
            fieldReasons.push(`header_partial: ${header}`);
        }

        // B. Value Pattern (Weight: 0.3-0.4)
        let matchCount = 0;
        let validCount = 0;

        rows.forEach(row => {
            const val = String(row[index] || '').trim();
            if (!val) return;
            validCount++;

            if (field === 'quantity' || field === 'price') {
                // Numeric check
                // Remove currency symbols approx
                const cleanVal = val.replace(/,/, '.').replace(/[^0-9.]/g, '');
                if (!isNaN(parseFloat(cleanVal)) && parseFloat(cleanVal) >= 0) {
                    matchCount++;
                }
            } else if (field === 'partNumber') {
                if (config.pattern && config.pattern.test(val)) {
                    matchCount++;
                }
            } else if (field === 'description') {
                if (val.length > 5 && isNaN(parseFloat(val))) {
                    matchCount++;
                }
            }
        });

        const ratio = validCount > 0 ? matchCount / validCount : 0;

        if (ratio > 0.8) {
            score += 0.3;
            fieldReasons.push(`value_pattern_${field}: ${(ratio * 100).toFixed(0)}%`);
        } else if (ratio > 0.4) {
            score += 0.1;
        }

        if (score > maxScore) {
            maxScore = score;
            bestField = field;
            reasons = fieldReasons;
        }
    }

    return {
        column_index: index,
        header,
        suggested_field: maxScore > 0.3 ? bestField : null,
        confidence: Math.min(maxScore, 1.0),
        reason: reasons,
    };
};

// --- Utilities ---

const parseCSV = (content: string): { data: string[][]; delimiter: string } => {
    // Simple detection: check first line for common delimiters
    const firstLine = content.split('\n')[0];
    const delimiters = [',', ';', '\t', '|'];
    let bestDelimiter = ',';
    let maxCount = 0;

    for (const d of delimiters) {
        const count = firstLine.split(d).length - 1;
        if (count > maxCount) {
            maxCount = count;
            bestDelimiter = d;
        }
    }

    // Naive split (FIXME: strictly doesn't handle quoted delimiters correctly without a real parser lib)
    // For Phase 1 we use basic split, can upgrade to 'papaparse' or similar if robust parsing needed.
    // Ideally should use a library, but following constraint "no extra deps unless requested" if possible, 
    // though 'papaparse' is standard. For now, simple split handles basic cases.

    // Better Regex split to handle quotes: 
    // Matches: "quoted field" OR field_without_delimiter
    // But JS split regex is tricky for global replace.

    // Let's use a slightly better naive parser that respects quotes
    const rows: string[][] = [];
    const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);

    lines.forEach(line => {
        const row: string[] = [];
        let current = '';
        let inQuote = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuote = !inQuote;
            } else if (char === bestDelimiter && !inQuote) {
                row.push(current.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
                current = '';
            } else {
                current += char;
            }
        }
        row.push(current.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
        rows.push(row);
    });

    return { data: rows, delimiter: bestDelimiter };
};
