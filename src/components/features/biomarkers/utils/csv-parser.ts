import Papa from 'papaparse';
import { BiomarkerRow, BiomarkerRowSchema } from './clinical-schemas';
import { CLINICAL_CONFIG } from '@/components/features/biomarkers/constants/clinical-constants';

/**
 * Normalizes CSV headers to match the expected schema keys.
 * Handles spaces vs underscores and case variations.
 * e.g., "Biomarker Name" -> "Biomarker_Name"
 * e.g., "Male 18-35 Optimal" -> "Male_18-35_Optimal"
 */
export function normalizeCsvHeader(header: string): string {
    const trimmed = header.trim();

    // If it's empty, return as is
    if (!trimmed) return trimmed;

    // Replace sequences of spaces with a single underscore
    // This handles "Biomarker Name" -> "Biomarker_Name"
    // And "Male 10-20 Optimal" -> "Male_10-20_Optimal"
    const normalized = trimmed.replace(/\s+/g, '_');

    return normalized;
}

export function parseBiomarkerData(csvContent: string): BiomarkerRow[] {
    const result = Papa.parse<any>(csvContent, {
        header: true,
        skipEmptyLines: true,
        transformHeader: normalizeCsvHeader,
    });

    // Validate with Zod and filter out invalid rows if necessary, 
    // or just valid rows. Here we map and safeParse.
    const validRows: BiomarkerRow[] = [];

    result.data.forEach((row, index) => {
        const parseResult = BiomarkerRowSchema.safeParse(row);
        if (parseResult.success) {
            validRows.push(parseResult.data);
        } else {
            console.warn(`Row ${index} invalid:`, parseResult.error);
        }
    });

    return validRows;
}

/**
 * Optimizaton: Create a map for faster lookups if processing many biomarkers.
 */
export function createBiomarkerMap(data: BiomarkerRow[]): Map<string, BiomarkerRow> {
    const map = new Map<string, BiomarkerRow>();
    data.forEach(row => {
        if (row.Biomarker_Name) {
            map.set(row.Biomarker_Name.trim(), row);
        }
    });
    return map;
}
