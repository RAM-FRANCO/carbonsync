
import { CLINICAL_CONFIG } from '@/components/features/biomarkers/constants/clinical-constants';
import {
    BiomarkerRow,
    RangeSegment,
    parseRangeString,
} from './clinical-schemas';


// --- Types ---

export interface NumericRange {
    min: number | null;
    max: number | null;
}

export interface InRangeBoundaries {
    inMin: number | null;
    inMax: number | null;
    optMin: number | null;
    optMax: number | null;
}

export interface GraphBoundaries {
    graphMin: number;
    graphMax: number;
}

// --- Helpers ---

/**
 * Adds a segment to the list if valid.
 */
export function addSegment(
    segments: RangeSegment[],
    min: number,
    max: number,
    status: RangeSegment['status']
) {
    if (max <= min) return;

    let color: string = CLINICAL_CONFIG.COLORS.CRITICAL;
    if (status === CLINICAL_CONFIG.STATUS.OPTIMAL) color = CLINICAL_CONFIG.COLORS.OPTIMAL;
    if (status === CLINICAL_CONFIG.STATUS.IN_RANGE) color = CLINICAL_CONFIG.COLORS.WARNING;

    segments.push({
        min,
        max,
        status,
        label: status,
        color
    });
}

export function inferInRange(
    optimal: NumericRange,
    inRangeRaw: NumericRange,
    outOfRangeRaw: NumericRange
): InRangeBoundaries {
    const optMin = optimal.min;
    const optMax = optimal.max;

    // Start with explicitly provided InRange, or default to Optimal if InRange is missing BUT Optimal exists
    let inMin = inRangeRaw.min ?? optMin;
    let inMax = inRangeRaw.max ?? optMax;

    // If InRange was NOT explicit (both null), try to infer from OutOfRange
    if (inRangeRaw.min === null && inRangeRaw.max === null) {
        if (outOfRangeRaw.max !== null) {
            inMin = outOfRangeRaw.max;
            // Note: OutOfRange max=60 means (<60). The Warning zone starts at 60.
        }
        if (outOfRangeRaw.min !== null) {
            inMax = outOfRangeRaw.min;
            // Note: OutOfRange min=100 means (>100). The Warning zone ends at 100.
        }
    }

    // Validation/Clamping: ONLY if Optimal exists.
    if (optMin !== null && inMin !== null && inMin > optMin) {
        console.warn(`[Parser Warning] InRange min (${inMin}) is greater than Optimal min (${optMin}). Clamping to Optimal.`);
        inMin = optMin;
    }
    if (optMax !== null && inMax !== null && inMax < optMax) {
        console.warn(`[Parser Warning] InRange max (${inMax}) is less than Optimal max (${optMax}). Clamping to Optimal.`);
        inMax = optMax;
    }

    // Ensure sanity: InRange must enclose Optimal (if Optimal exists)
    if (optMin !== null && inMin !== null) inMin = Math.min(inMin, optMin);
    if (optMax !== null && inMax !== null) inMax = Math.max(inMax, optMax);

    return { inMin, inMax, optMin, optMax };
}

export function resolveGraphBounds(
    row: BiomarkerRow,
    gender: 'Male' | 'Female',
    inMin: number,
    inMax: number,
    optMin: number,
    optMax: number
): GraphBoundaries {
    const graphKey = (gender === 'Female' && row[CLINICAL_CONFIG.COLUMNS.GRAPH_RANGE_FEMALE])
        ? CLINICAL_CONFIG.COLUMNS.GRAPH_RANGE_FEMALE
        : CLINICAL_CONFIG.COLUMNS.GRAPH_RANGE;

    const graphVal = graphKey ? row[graphKey] : undefined;
    const graphRaw = parseRangeString(graphVal);

    let graphMin = graphRaw.min;
    let graphMax = graphRaw.max;

    if (graphMin === null || graphMax === null) {
        const rangeSpan = inMax - inMin || optMax - optMin || 10;
        const padding = rangeSpan * 0.5; // 50% padding

        // Allow graph to go negative if values dictate
        if (graphMin === null) graphMin = 0;
        if (graphMax === null) graphMax = (inMax !== null ? inMax : optMax) + padding;
    }
    return { graphMin: graphMin!, graphMax: graphMax! };
}

export function computeBoundaries(
    optimalStr: string | undefined,
    inRangeStr: string | undefined,
    outOfRangeStr: string | undefined,
    row: BiomarkerRow,
    gender: 'Male' | 'Female'
) {
    const optimal = parseRangeString(optimalStr);
    const inRangeRaw = parseRangeString(inRangeStr);
    const outOfRangeRaw = parseRangeString(outOfRangeStr);

    // 1. Infer In-Range Boundaries
    const { inMin, inMax, optMin, optMax } = inferInRange(optimal, inRangeRaw, outOfRangeRaw);

    // 2. Resolve Graph Boundaries
    const safeInMin = inMin ?? 0;
    const safeInMax = inMax ?? 100;
    const safeOptMin = optMin ?? 0;
    const safeOptMax = optMax ?? 100;

    const { graphMin, graphMax } = resolveGraphBounds(
        row,
        gender,
        safeInMin,
        safeInMax,
        safeOptMin,
        safeOptMax
    );

    return { graphMin, inMin, optMin, optMax, inMax, graphMax };
}

export function buildSegmentsFromBoundaries(
    graphMin: number,
    inMin: number | null,
    optMin: number | null,
    optMax: number | null,
    inMax: number | null,
    graphMax: number
): RangeSegment[] {
    const segments: RangeSegment[] = [];

    // Scenario 1: No Reference Data at all (Both In-Range boundaries missing)
    if (inMin === null && inMax === null) {
        return []; // Return empty segments (Blank chart)
    }

    // Resolve effective boundaries for rendering (Close open-ended ranges with graph limits)
    const effInMin = inMin ?? graphMin;
    const effInMax = inMax ?? graphMax;

    // Scenario 2: Strict Optimal Missing (Yellow/Red only)
    if (optMin === null || optMax === null) {
        // Red: Bottom Out-of-Range -> In-Range
        // Only if we actually have a distinct bottom (inMin != null)
        if (inMin !== null) {
            addSegment(segments, graphMin, effInMin, CLINICAL_CONFIG.STATUS.OUT_OF_RANGE);
        }

        // Yellow: The whole In-Range zone
        addSegment(segments, effInMin, effInMax, CLINICAL_CONFIG.STATUS.IN_RANGE);

        // Red: Top In-Range -> Out-of-Range
        // Only if we actually have a distinct top (inMax != null)
        if (inMax !== null) {
            addSegment(segments, effInMax, graphMax, CLINICAL_CONFIG.STATUS.OUT_OF_RANGE);
        }

        return segments;
    }

    // Scenario 3: Standard 5-Zone (Red -> Yellow -> Green -> Yellow -> Red)
    // Red: Bottom Out-of-Range -> In-Range
    addSegment(segments, graphMin, effInMin, CLINICAL_CONFIG.STATUS.OUT_OF_RANGE);

    // Yellow: Bottom In-Range -> Optimal (Only if InRange extends beyond Optimal)
    addSegment(segments, effInMin, optMin, CLINICAL_CONFIG.STATUS.IN_RANGE);

    // Green: Optimal Zone
    addSegment(segments, optMin, optMax, CLINICAL_CONFIG.STATUS.OPTIMAL);

    // Yellow: Top Optimal -> In-Range
    addSegment(segments, optMax, effInMax, CLINICAL_CONFIG.STATUS.IN_RANGE);

    // Red: Top In-Range -> Out-of-Range
    addSegment(segments, effInMax, graphMax, CLINICAL_CONFIG.STATUS.OUT_OF_RANGE);

    return segments;
}
