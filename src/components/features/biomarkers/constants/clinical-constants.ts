export const CLINICAL_CONFIG = {
    // Keywords to look for in column headers
    KEYWORDS: {
        OPTIMAL: 'Optimal',
        IN_RANGE: 'In range',
        OUT_OF_RANGE: 'Out of range',
    },
    // Standard column names that are always present or specific
    COLUMNS: {
        UNIT: 'Unit',
        STD_REF_PREFIX: 'Standard Reference Range',
        GRAPH_RANGE: 'Graph Range',
        GRAPH_RANGE_FEMALE: 'Graph Range Female',
    },
    // Visuals
    COLORS: {
        OPTIMAL: 'bg-green-500',
        WARNING: 'bg-amber-400',
        CRITICAL: 'bg-red-400'
    },
    STATUS: {
        OPTIMAL: 'Optimal',
        IN_RANGE: 'In range',
        OUT_OF_RANGE: 'Out of range'
    } as const,

    // Data Normalization / Typos Fixes
    DATA_CORRECTIONS: {
        'Creatine': 'Creatinine',
    } as Record<string, string>
};
