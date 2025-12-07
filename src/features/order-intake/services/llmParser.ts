import { generateGeminiResponse } from '../../../lib/gemini';
import { ExcelParseResult, FileSummary } from './excelParser';

export const analyzeWithLLM = async (summary: FileSummary): Promise<Partial<ExcelParseResult>> => {
    const prompt = `
    You are an AI Data Analyst. Analyze the following spreadsheet extract to identify standard e-commerce order fields.
    
    Standard Fields to Detect:
    - sku (Product Code, Item Number, Part #)
    - quantity (Qty, Count, Amount)
    - description (Product Name, Desc)
    - price (Unit Price, Cost)

    Input Data:
    Headers: (See sample rows)
    
    Sample Rows (First 5):
    ${JSON.stringify(summary.sample_rows)}

    Task:
    1. Identify which column index corresponds to 'sku', 'quantity', 'description', 'price'.
    2. Ignore irrelevant columns.
    3. Provide a confidence score (0.0 - 1.0) and a reason.

    Output Format (Strict JSON, no markdown):
    {
        "detected_columns": [
            { "column_index": 0, "header": "Name found in row 0", "suggested_field": "sku", "confidence": 0.95, "reason": ["reasoning"] }
        ],
        "overall_confidence": 0.9
    }
    `;

    // Fix: We need to pass the actual full prompt effectively.
    // The summary.sample_rows contains the data.
    // Let's refine the prompt construction.
    const refinedPrompt = buildPrompt(summary);

    try {
        const jsonStr = await generateGeminiResponse(refinedPrompt);
        const cleanJson = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed: any = JSON.parse(cleanJson);

        return {
            detected_columns: parsed.detected_columns,
            overall_confidence: parsed.overall_confidence
        };

    } catch (error: any) {
        if (error.message?.includes('429') || error.message?.includes('Quota')) {
            console.warn('Gemini Quota Exceeded (Free Tier) - skipping AI analysis');
        } else {
            console.warn('LLM Analysis skipped:', error.message);
        }
        // Fallback: return empty or throw, allowing original parser result to stand
        return { overall_confidence: 0 };
    }
};

const buildPrompt = (summary: FileSummary): string => {
    return `
    Analyze this CSV/Excel data snippet to map columns to: sku, quantity, description, price.
    
    Data (First ${summary.rows < 5 ? summary.rows : 5} rows):
    ${JSON.stringify(summary.sample_rows, null, 2)}
    
    Return JSON only:
    {
      "detected_columns": [
        { "column_index": number, "header": string, "suggested_field": "sku"|"quantity"|"description"|"price"|null, "confidence": number, "reason": string[] }
      ],
      "overall_confidence": number
    }
    `;
}
