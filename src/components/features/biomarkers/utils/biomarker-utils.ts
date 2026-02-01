import { BiomarkerData, BiomarkerResult, RangeSegment } from "@/components/features/biomarkers/types";

export type BiomarkerStatus = 'optimal' | 'in range' | 'out of range';

export const STATUS_CONFIG = {
    optimal: { color: "bg-emerald-500", label: "Optimal" },
    'in range': { color: "bg-amber-400", label: "In range" },
    'out of range': { color: "bg-rose-500", label: "Out of range" },
};

/**
 * Determines the status of a biomarker value based on its segments.
 */
export function getBiomarkerStatus(value: number, segments: RangeSegment[]): BiomarkerStatus {
    const matchingSegments = segments.filter(r => value >= r.min && value <= r.max);

    if (matchingSegments.length > 0) {
        // Priority: Optimal > In range > Out of range
        if (matchingSegments.some(s => s.status === 'Optimal')) return 'optimal';
        if (matchingSegments.some(s => s.status === 'In range')) return 'in range';
        return 'out of range';
    }

    return 'out of range';
}

/**
 * Returns the color class for a given status.
 */
export function getBiomarkerColor(status: BiomarkerStatus): string {
    return STATUS_CONFIG[status]?.color || STATUS_CONFIG['in range'].color;
}

/**
 * Derives display properties for a biomarker card from a raw dashboard item.
 */
export function deriveBiomarkerDisplayProps(item: {
    id: string;
    name: string;
    value: number;
    data: BiomarkerResult;
    category?: string;
}): BiomarkerData {
    const { data, value } = item;
    const { segments, standardReference, referenceLabel, unit } = data;

    const status = getBiomarkerStatus(value, segments);

    // Determine Ranges for Mini-Chart
    const optimalSegment = segments.find(r => r.status === 'Optimal');

    // Sort segments for range bounds
    const sorted = [...segments].sort((a, b) => a.min - b.min);
    const min = sorted[0]?.min || 0;
    const max = sorted.at(-1)?.max || 100;

    // Use referenceLabel from parser, fallback to standardReference or generic label
    // If referenceLabel is a specific column header like "Standard Reference Range Male", use it.
    // If it's a key like "Standard Reference Range", maybe just use "Reference"?
    // The previous logic had "Reference" as fallback.
    // Let's rely on what the parser gave us, or fallback to 'Reference'.
    const effectiveReferenceLabel = referenceLabel ? referenceLabel : 'Reference';

    return {
        name: item.name,
        value: item.value,
        unit: unit || '',
        category: item.category || 'General',
        status,
        segments,
        range: {
            min,
            max,
            optimalStart: optimalSegment?.min,
            optimalEnd: optimalSegment?.max
        },
        referenceLabel: effectiveReferenceLabel,
        // We can pass the actual text value too if needed, usually mapped to `referenceText` in Card
        standardReference
    };
}
