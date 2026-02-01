
export interface RangeSegment {
    label: string;
    min: number;
    max: number;
    color: string;
    status: 'Optimal' | 'In range' | 'Out of range';
}

export interface ClinicalRangeChartProps {
    value: number;
    unit: string;
    date: string;
    ranges: RangeSegment[];
    className?: string;
}
