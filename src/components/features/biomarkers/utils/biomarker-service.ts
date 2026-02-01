import { DashboardItem } from '@/components/features/biomarkers/types';

import { getSegmentsForBiomarker } from './segment-logic';
import { parseBiomarkerData } from './csv-parser';
import { BiomarkerRow } from './clinical-schemas';
import { CLINICAL_CONFIG } from '@/components/features/biomarkers/constants/clinical-constants';


// Central Configuration for Scalability
const SHEET_CONFIG = {
    spreadsheetId: process.env.NEXT_PUBLIC_GOOGLE_SHEET_ID || '',
    tabs: [
        {
            name: process.env.NEXT_PUBLIC_SHEET_TAB_BIOMARKERS_NAME || 'Biomarkers',
            gid: process.env.NEXT_PUBLIC_SHEET_TAB_BIOMARKERS_GID || ''
        },
        {
            name: process.env.NEXT_PUBLIC_SHEET_TAB_METRICS_NAME || 'Metrics',
            gid: process.env.NEXT_PUBLIC_SHEET_TAB_METRICS_GID || ''
        }
    ]
};

const FALLBACK_DEFAULTS: Record<string, number> = {
    'Creatinine': 0.63,
    'Metabolic Health Score': 75
};

// Validate Config (Optional but recommended to debug missing env vars)
if (!SHEET_CONFIG.spreadsheetId) {
    console.warn("WARNING: NEXT_PUBLIC_GOOGLE_SHEET_ID is not set in .env");
}

// Helper: Construct CSV URL
const getCsvUrl = (gid: string) =>
    `https://docs.google.com/spreadsheets/d/${SHEET_CONFIG.spreadsheetId}/export?format=csv&gid=${gid}`;


// Helper: Normalize string to camelCase for ID/Success lookups
const toCamelCase = (str: string) => {
    return str
        .replaceAll(/(?:^\w|[A-Z]|\b\w)/g, (word, index) =>
            index === 0 ? word.toLowerCase() : word.toUpperCase()
        )
        .replaceAll(/\s+/g, '');
};


/**
 * Extracts a numeric value from a "Graph Value" row.
 * Expected format: "{Biomarker Name} Graph Value: {Number}" or similar.
 */
function extractValueFromRow(name: string): number | null {
    // Look for a number at the end of the string, allowing for decimals
    const match = name.match(/:\s*([\d.]+)/);
    if (match && match[1]) {
        return Number.parseFloat(match[1]);
    }
    return null;
}

/**
 * Normalizes a "Graph Value" row name to match its parent biomarker.
 * e.g., "Creatine Graph Value: 0.65" -> "Creatinine" (fuzzy match handling)
 * or "Metabolic Health Score Graph Value: 78" -> "Metabolic Health Score"
 */
function normalizeValueRowName(rowName: string): string {
    // 1. Remove "Graph Value: ..." suffix
    const cleanName = rowName.split('Graph Value')[0].trim();

    // 2. Handle known typos/mismatches via Config
    if (CLINICAL_CONFIG.DATA_CORRECTIONS[cleanName]) {
        return CLINICAL_CONFIG.DATA_CORRECTIONS[cleanName];
    }

    return cleanName;
}


export async function getAllBiomarkers(
    age: number,
    gender: 'Male' | 'Female',
    searchParams: { [key: string]: string | string[] | undefined }
): Promise<DashboardItem[]> {
    try {
        // Dynamic Parallel Fetching based on Config
        const fetchPromises = SHEET_CONFIG.tabs.map(tab =>
            fetch(getCsvUrl(tab.gid), { next: { revalidate: 0 } })
                .then(res => res.ok ? res.text() : '')
                .then(text => ({ text, tabName: tab.name })) // Pass tab name for fallback category
                .catch(err => {
                    console.error(`Failed to fetch tab ${tab.name}:`, err);
                    return { text: '', tabName: tab.name };
                })

        );

        const results = await Promise.all(fetchPromises);

        const definitions: { row: BiomarkerRow; tabName: string }[] = [];
        const valueMap = new Map<string, number>();

        // Phase 1: Parse and Segregate
        for (const { text, tabName } of results) {
            if (!text) continue;

            const rows = parseBiomarkerData(text);

            for (const row of rows) {
                const name = row.Biomarker_Name?.trim();
                if (!name) continue;

                if (name.includes('Graph Value')) {
                    // It's a value row
                    const validName = normalizeValueRowName(name);
                    const val = extractValueFromRow(name);
                    if (validName && val !== null) {
                        valueMap.set(validName, val);
                    }
                } else {
                    // It's a definition row
                    definitions.push({ row, tabName });
                }
            }
        }

        // Phase 2: Merge and Build Items
        const allItems: DashboardItem[] = [];

        for (const { row, tabName } of definitions) {
            const name = row.Biomarker_Name.trim();
            const id = row.id || name;

            // Priority: 1. URL Param -> 2. Spreadsheet "Graph Value" -> 3. Default 0
            const camelName = toCamelCase(name);
            const paramValue = searchParams[camelName] || searchParams[name] || searchParams[id];

            let value = 0;
            // Calculate base value first (Sheet or Fallback)
            let baseValue = 0;
            if (valueMap.has(name)) {
                baseValue = valueMap.get(name)!;
            } else if (FALLBACK_DEFAULTS[name]) {
                baseValue = FALLBACK_DEFAULTS[name];
            }

            // Determine final display value (URL param overrides base)
            if (paramValue) {
                value = Number(paramValue);
            } else {
                value = baseValue;
            }

            const category = row.Category || tabName;
            const data = getSegmentsForBiomarker([row], name, age, gender);

            allItems.push({
                id,
                name,
                value,
                originalValue: baseValue,
                category,
                data
            });
        }
        return allItems;

    } catch (error) {
        console.error("Failed to load biomarker data:", error);
        return [];
    }
}