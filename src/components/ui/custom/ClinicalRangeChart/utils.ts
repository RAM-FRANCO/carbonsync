
import { type RangeSegment } from './types';

export const RANGE_STATUS_PRIORITY: Record<RangeSegment['status'], number> = {
    'Optimal': 3,
    'In range': 2,
    'Out of range': 1,
};

export const getSegmentStyles = (status: RangeSegment['status']) => {
    switch (status) {
        case 'Optimal':
            return {
                bar: 'bg-emerald-500',
                bg: 'bg-emerald-500/10',
                dot: 'bg-emerald-500',
                glow: 'bg-emerald-100',
                text: 'text-emerald-400'
            };
        case 'In range':
            return {
                bar: 'bg-amber-400',
                bg: 'bg-amber-400/10',
                dot: 'bg-amber-400',
                glow: 'bg-amber-100',
                text: 'text-amber-400'
            };
        case 'Out of range':
            return {
                bar: 'bg-rose-500',
                bg: 'bg-rose-500/10',
                dot: 'bg-rose-500',
                glow: 'bg-rose-100',
                text: 'text-rose-400'
            };
        default:
            return {
                bar: 'bg-slate-400',
                bg: 'bg-slate-400/10',
                dot: 'bg-slate-400',
                glow: 'bg-slate-100',
                text: 'text-slate-400'
            };
    }
};
