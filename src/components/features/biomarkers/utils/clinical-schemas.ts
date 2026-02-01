import { z } from 'zod';

// --- Types ---

export const NumericRangeSchema = z.object({
    min: z.number().nullable(),
    max: z.number().nullable(),
});

export type NumericRange = z.infer<typeof NumericRangeSchema>;

export const RangeSegmentSchema = z.object({
    min: z.number(),
    max: z.number(),
    label: z.string(),
    color: z.string(),
    status: z.enum(['Optimal', 'In range', 'Out of range']),
});

export type RangeSegment = z.infer<typeof RangeSegmentSchema>;

export const BiomarkerResultSchema = z.object({
    segments: z.array(RangeSegmentSchema),
    standardReference: z.string(),
    referenceLabel: z.string().optional(),
    unit: z.string(),
});

export type BiomarkerResult = z.infer<typeof BiomarkerResultSchema>;

// Input Row Schema (matches CSV structure but with validation)
export const BiomarkerRowSchema = z.object({
    Biomarker_Name: z.string(),
    Unit: z.string().optional().default(''),
    Category: z.string().optional(),
    id: z.string().optional(),
    'Standard Reference Range': z.string().optional(),
    'Graph Range': z.string().optional(),
    'Graph Range Female': z.string().optional(),
}).catchall(z.string().optional()); // For dynamic columns like "Male_18-39_Optimal"

export type BiomarkerRow = z.infer<typeof BiomarkerRowSchema>;


// --- Helpers & Transforms ---

/**
 * Parses a range string like "0.75-1.0", "<0.6", or ">1.2" into numeric bounds.
 */
export function parseRangeString(str: string | undefined | null): NumericRange {
    if (!str?.trim()) return { min: null, max: null };

    // Normalize dashes and clean string
    const normalized = str.replaceAll(/[\u2013\u2014]/g, '-');
    const cleaned = normalized.replaceAll(/[^\d.\-<>=]/g, '');

    if (cleaned.includes('<')) {
        const val = Number.parseFloat(cleaned.replaceAll(/[<=]/g, ''));
        return { min: null, max: val };
    }
    if (cleaned.includes('>')) {
        const val = Number.parseFloat(cleaned.replaceAll(/[>=]/g, ''));
        return { min: val, max: null };
    }
    // Regex to match "min - max" allowing optional negative signs
    // Matches: "-5.2 - -1.0", "10-20", "-5 - 0"
    // Capture groups: 1=min, 2=max
    // Note: We use [\u2013\u2014\-] for the separator coverage after normalization
    const rangeRegex = /^(-?[\d.]+)\s*-\s*(-?[\d.]+)$/;
    const match = cleaned.match(rangeRegex);

    if (match) {
        const min = Number.parseFloat(match[1]);
        const max = Number.parseFloat(match[2]);
        return {
            min: Number.isNaN(min) ? null : min,
            max: Number.isNaN(max) ? null : max
        };
    }

    // Fallback: If no range separator found, try single number
    const val = Number.parseFloat(cleaned);
    return Number.isNaN(val) ? { min: null, max: null } : { min: val, max: val };
}

// Zod Schema for a range string that automatically parses to NumericRange
export const ParsedRangeSchema = z.union([z.string(), z.undefined(), z.null()])
    .transform(parseRangeString);
