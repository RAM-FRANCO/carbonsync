export * from '../utils/clinical-schemas';
import { RangeSegment, BiomarkerResult } from '../utils/clinical-schemas';


export interface BiomarkerRange {
    min: number;
    max: number;
    optimalStart?: number;
    optimalEnd?: number;
}

export interface BiomarkerData {
    name: string;
    value: number;
    unit: string;
    category: string;
    status: 'optimal' | 'in range' | 'out of range';
    range?: BiomarkerRange;
    segments?: RangeSegment[];
    referenceLabel?: string;
    standardReference?: string;
}

// Raw CSV Row structure
export interface BiomarkerCSVRow {
    marker_name: string;
    current_value: string;
    unit: string;
    category: string;
    min_range?: string;
    max_range?: string;
    optimal_start?: string;
    optimal_end?: string;
    [key: string]: string | undefined;
}

export interface DashboardItem {
    id: string;
    name: string;
    value: number;
    originalValue?: number; // The value from the sheet/defaults, ignoring simulation overrides
    category: string;
    data: BiomarkerResult;
}
