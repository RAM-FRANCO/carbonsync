import React, { useMemo } from 'react';

import { cn } from '@/lib/utils';

import { ChartMarker } from './ChartMarker';
import { type RangeSegment } from './types';
import { getSegmentStyles, RANGE_STATUS_PRIORITY } from './utils';

interface ClinicalRangeGridProps {
  ranges: RangeSegment[];
  value: number;
  unit?: string;
  className?: string;
  style?: React.CSSProperties
  isReversed?: boolean
  showTimeline?: boolean
}

// Helper to calculate marker position within a segment (0 to 1)
const calculateMarkerPosition = (value: number, segment: RangeSegment): number => {
    const rangeSpan = segment.max - segment.min;
    if (rangeSpan === 0) return 0.5;
    
    // Calculate percentage and clamp between 0 and 1
    const rawPercent = (value - segment.min) / rangeSpan;
    return Math.min(Math.max(rawPercent, 0), 1);
};

// Sub-component for individual grid rows to keep the main component clean
// This is not exported as it's specific to this grid implementation
const RangeRow = ({
  segment,
  isActive,
  isTop,
  isReversed,
  markerPositionPercent,
  value,
  unit,
}: {
  segment: RangeSegment;
  isActive: boolean;
  isTop: boolean;
  isReversed: boolean;
  markerPositionPercent: number;
  value: number;
  unit?: string;
}) => {
  const styles = getSegmentStyles(segment.status);
  
  // Format range text
  const rangeText = isTop ? `≥ ${segment.min.toFixed(2)}` : segment.min.toFixed(2);

  return (
    <div 
      className={cn(
        "relative w-full h-full flex items-center group transition-all duration-300 rounded-r-lg",
        isActive && styles.bg,
        isReversed && "flex-row-reverse"
      )}
    >
        {/* Column 1: The colored bar segment */}
        <div className="h-full flex items-center justify-center">
            <div className={cn(
                "w-full h-full opacity-90 transition-all rounded-full",
                styles.bar,
                isReversed ? "w-1" : "w-1.5"
            )} />
        </div>

        {/* Column 2: Labels */}
        {!isReversed && (
        <div className="ml-8 flex flex-col justify-center">
            <span className="text-[10px] text-slate-400 tabular-nums leading-tight">
              {rangeText}
            </span>
            <span className={cn(
              "text-xs font-bold transition-colors leading-tight",
              isActive ? "text-slate-900" : "text-slate-700"
            )}>
              {segment.label}
            </span>
        </div>
        )}

        {/* Render Markers if Active */}
        {isActive && (
            <div 
                className={cn(
                    "absolute inset-y-0 pointer-events-none",
                    isReversed ? "inset-x-0" : "left-32 right-8"
                )}
            >
                <ChartMarker 
                    className={cn(
                        "absolute",
                        isReversed 
                            ? "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" 
                            : "left-1/4 -translate-x-1/2 translate-y-1/2"
                    )}
                    style={{ 
                        bottom: isReversed ? undefined : `${markerPositionPercent * 100}%`
                    }}
                    innerColor={styles.dot}
                    outerColor={styles.glow}
                    variant="value"
                    size={isReversed ? 'small' : 'default'}
                    label=""
                    value={`${value} ${unit || ''}`}
                    textColor={styles.text}
                />

                {!isReversed && (
                    <ChartMarker 
                        className="absolute left-3/4 -translate-x-1/2 translate-y-1/2"
                        style={{ 
                            bottom: `${markerPositionPercent * 100}%`
                        }}
                        innerColor="bg-slate-400"
                        outerColor="bg-slate-100 hover:bg-slate-200"
                        variant="action"
                        label="Schedule your annual re-test"
                        actionLabel="Book now"
                        onAction={() => console.log('Book now clicked')}
                        onClick={() => console.log('Marker clicked')}
                    />
                )}
            </div>
        )}
    </div>
  );
};

export const ClinicalRangeGrid = ({
  ranges,
  value,
  unit,
  className,
  style,
  isReversed = false,
  showTimeline = false
}: ClinicalRangeGridProps) => {
  // Sort ranges by min value (Low -> High)
  const sortedRanges = useMemo(() => {
    return [...ranges].sort((a, b) => a.min - b.min);
  }, [ranges]);

  // For rendering in a Grid (Top -> Bottom), we need High -> Low order
  const displayRanges = useMemo(() => {
    return [...sortedRanges].reverse();
  }, [sortedRanges]);

  // Calculate dynamic grid rows: Optimal gets more space (3fr), others get 1fr
  const gridTemplateRows = useMemo(() => {
     return displayRanges.map(segment => 
        segment.status === 'Optimal' ? '3fr' : '1fr'
     ).join(' ');
  }, [displayRanges]);

  // Determine the single "best" segment to show the marker on
  const bestMatchSegment = useMemo(() => {
     // 1. Find all segments that contain the value
     const matching = sortedRanges.filter(r => value >= r.min && value <= r.max);

     // 2. Exact match found
     if (matching.length === 1) return matching[0];

     // 3. Multiple matches (overlap) - pick highest priority
     if (matching.length > 1) {
         return matching.toSorted((a, b) => 
            (RANGE_STATUS_PRIORITY[b.status] || 0) - (RANGE_STATUS_PRIORITY[a.status] || 0)
         )[0];
     }

     // 4. No match - find nearest segment
     // Since ranges are sorted, we can check ends
     if (sortedRanges.length > 0) {
        const first = sortedRanges[0];
        const last = sortedRanges.at(-1)!;
        
        if (value < first.min) return first;
        if (value > last.max) return last;
        
        return first;
     }

     return null;
  }, [sortedRanges, value]);

  return (
    <div 
      className={cn("relative grid w-full h-full gap-y-1 border-b border-slate-100 pb-1", className)}
      style={{ 
        gridTemplateRows: gridTemplateRows,
        ...style
    }}
    >
       {displayRanges.map((segment, i) => (
          <RangeRow
            key={`${segment.min}-grid-row-${i}`}
            segment={segment}
            isActive={segment === bestMatchSegment}
            isTop={i === 0}
            isReversed={isReversed}
            markerPositionPercent={segment === bestMatchSegment ? calculateMarkerPosition(value, segment) : 0}
            value={value}
            unit={unit}
          />
       ))}

       {/* Global Overlays (Dashed Line) */}
       {showTimeline && (
        <div 
          className={cn(
              "absolute inset-y-0 pointer-events-none",
              isReversed ? "inset-x-0" : "left-32 right-8"
          )}
        >
          <div 
            className={cn(
                "absolute top-0 bottom-0 w-px opacity-30 -translate-x-1/2",
                isReversed ? "left-1/2" : "left-1/4"
            )}
            style={{ 
              backgroundImage: `linear-gradient(to bottom, #f43f5e 50%, transparent 50%)`,
              backgroundSize: '1px 24px'
            }} 
          />
        </div>
       )}
    </div>
  );
};
