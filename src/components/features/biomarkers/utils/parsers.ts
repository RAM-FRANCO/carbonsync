
import { BiomarkerRow } from './clinical-schemas';
import { CLINICAL_CONFIG } from '@/components/features/biomarkers/constants/clinical-constants';

// --- Types ---

export type RangeType = 'optimal' | 'inRange' | 'outOfRange';

export interface AgeBracket {
    minAge: number;
    maxAge: number;
    // The raw string values from the CSV for each range type
    ranges: {
        optimal?: string;
        inRange?: string;
        outOfRange?: string;
    };
}

export interface GenderConfig {
    brackets: AgeBracket[];
}

export type BiomarkerConfig = {
    Male: GenderConfig;
    Female: GenderConfig;
}

// --- Helpers ---

/**
 * Parses a single CSV row into a structured configuration tree.
 * Structure: Gender -> Age Bracket -> Ranges
 * optimizing lookup time to O(1) after parsing.
 */
export function extractBiomarkerConfig(row: BiomarkerRow): BiomarkerConfig {
    const config: BiomarkerConfig = {
        Male: { brackets: [] },
        Female: { brackets: [] }
    };

    // Regex to decompose header: "Gender_MinAge-MaxAge_Type"
    // Examples: "Male_18-35_Optimal", "Female_50+_In range"
    // Groups: 1=Gender, 2=MinAge, 3=MaxAge(opt), 4=Plus(opt), 5=Type
    const headerRegex = /^(Male|Female)_(\d+)(?:-(\d+))?(\+)?_(.+)$/i;

    // Helper to normalize the range type key
    const normalizeType = (suffix: string): RangeType | null => {
        const s = suffix.toLowerCase().replace(/\s+/g, ''); // "In range" -> "inrange"
        if (s === 'optimal') return 'optimal';
        if (s === 'inrange') return 'inRange';
        if (s === 'outofrange') return 'outOfRange';
        return null;
    };

    // Single pass over all keys
    Object.entries(row).forEach(([key, value]) => {
        if (!value) return; // Skip empty values

        const match = headerRegex.exec(key);
        if (!match) return;

        const gender = match[1] as 'Male' | 'Female'; // normalized by match, but casing needs care
        // Ensure strictly 'Male' or 'Female' key
        const genderKey = gender.toLowerCase() === 'male' ? 'Male' : 'Female';

        const minAge = parseInt(match[2], 10);
        let maxAge = minAge; // Default to single year if no range

        if (match[3]) {
            maxAge = parseInt(match[3], 10);
        } else if (match[4] === '+') {
            maxAge = Number.MAX_SAFE_INTEGER; // Handle extreme ages like 10000
        }

        const typeStr = match[5];
        const rangeType = normalizeType(typeStr);
        if (!rangeType) return;


        // Find or create the age bracket in the correct gender bucket
        const targetConfig = config[genderKey];
        let bracket = targetConfig.brackets.find(b => b.minAge === minAge && b.maxAge === maxAge);

        if (!bracket) {
            bracket = {
                minAge,
                maxAge,
                ranges: {}
            };
            targetConfig.brackets.push(bracket);
        }

        bracket.ranges[rangeType] = value as string;
    });

    // Sort brackets by age for deterministic matching (though specific age matching doesn't strictly need sort)
    config.Male.brackets.sort((a, b) => a.minAge - b.minAge);
    config.Female.brackets.sort((a, b) => a.minAge - b.minAge);

    return config;
}

export function extractBiomarkerInfo(row: BiomarkerRow, gender: string) {
    const unit = row[CLINICAL_CONFIG.COLUMNS.UNIT] || '';

    // Schema normalization replaces spaces with underscores
    // "Standard Reference Range Male" -> "Standard_Reference_Range_Male"
    const stdRefKeyUnderscore = `${CLINICAL_CONFIG.COLUMNS.STD_REF_PREFIX.replace(/\s+/g, '_')}_${gender}`;
    const stdRefKeySpaces = `${CLINICAL_CONFIG.COLUMNS.STD_REF_PREFIX} ${gender}`;

    // Try underscore first, then spaces, then fuzzy
    let standardReference = row[stdRefKeyUnderscore] || row[stdRefKeySpaces];

    if (!standardReference) {
        const normalizeKey = (k: string) => k.toLowerCase().replace(/[\s_]+/g, '');
        const target = `standardreferencerange${gender.toLowerCase()}`;

        const fuzzyKey = Object.keys(row).find(k => normalizeKey(k) === target);

        if (fuzzyKey) {
            standardReference = row[fuzzyKey];
        } else {
            // Fallback to generic "Standard Reference Range"
            standardReference = row['Standard_Reference_Range'] || row['Standard Reference Range'] || 'N/A';
        }
    }

    // Keep the Label clean (with spaces) for display if possible, or use the found value
    const referenceLabel = stdRefKeySpaces;

    return { unit, standardReference: standardReference || 'N/A', referenceLabel };
}

export function determineRangeStrings(
    row: BiomarkerRow,
    age: number,
    gender: 'Male' | 'Female',
    standardReference: string
) {
    // 1. Build the Tree
    const config = extractBiomarkerConfig(row);

    // 2. Select Gender Branch
    const genderConfig = config[gender];

    // 3. Find Matching Age Bracket
    // We look for a bracket that strictly contains the current age.
    const bracket = genderConfig.brackets.find(b => age >= b.minAge && age <= b.maxAge);

    if (bracket) {
        return {
            optimalStr: bracket.ranges.optimal || (standardReference !== 'N/A' ? standardReference : undefined),
            inRangeStr: bracket.ranges.inRange,
            outOfRangeStr: bracket.ranges.outOfRange
        };
    }

    // Fallback: If no specific bracket found, we only have standard reference
    return {
        optimalStr: standardReference !== 'N/A' ? standardReference : undefined,
        inRangeStr: undefined,
        outOfRangeStr: undefined
    };
}
