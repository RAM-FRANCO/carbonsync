"use client";

import { ClinicalRangeGrid } from "@/components/ui/custom/ClinicalRangeChart/ClinicalRangeGrid";
import { RangeSegment } from "@/components/ui/custom/ClinicalRangeChart/types";

import { STATUS_CONFIG } from "../utils/biomarker-utils";
import { cn } from "@/lib/utils";
import { BiomarkerData } from "@/components/features/biomarkers/types";

interface BiomarkerCardProps {
  data: BiomarkerData;
  onClick: () => void;
}

const mapRangeToSegments = (range?: BiomarkerData['range']): RangeSegment[] => {
  if (!range) return [];
  
  const { min, max, optimalStart, optimalEnd } = range;
  
  // If we only have min/max, just show one "In range" segment? 
  // Or if we lack optimal ranges, we can't show the optimal zone.
  if (optimalStart === undefined || optimalEnd === undefined) {
    return [{
      label: 'Reference',
      min: min,
      max: max,
      color: 'bg-slate-200',
      status: 'In range'
    }];
  }

  return [
    {
      label: 'Low',
      min: min,
      max: optimalStart,
      color: 'bg-amber-400',
      status: 'In range' // Using 'In range' as "borderline" or "standardRef" vs "optimal"
    },
    {
      label: 'Optimal',
      min: optimalStart,
      max: optimalEnd,
      color: 'bg-emerald-500',
      status: 'Optimal'
    },
    {
      label: 'High',
      min: optimalEnd,
      max: max,
      color: 'bg-amber-400',
      status: 'In range'
    }
  ];
};

export function BiomarkerCard({ data, onClick }: BiomarkerCardProps) {
  const { name, value, unit, status, range, segments } = data;

  // Use passed segments as source of truth if available, otherwise fallback to mapping
  const ranges = segments ? (segments as RangeSegment[]) : mapRangeToSegments(range);

  
  // Reference Text: Prioritize explicit Standard Reference from data (e.g., from CSV column "Standard Reference Range Male")
  // otherwise fallback to constructing it from the numeric ranges (Optimal > Standard).
  let referenceText = data.standardReference && data.standardReference !== 'N/A' 
    ? data.standardReference 
    : 'N/A';

  if (referenceText === 'N/A' && range) {
    if (range.optimalStart !== undefined && range.optimalEnd !== undefined) {
      referenceText = `${range.optimalStart} - ${range.optimalEnd}`;
    } else {
      referenceText = `${range.min} - ${range.max}`;
    }
  }

  // Use referenceLabel from data, fallback to "Reference"
  const referenceLabel = data.referenceLabel || 'Reference';

  const currentStatus = STATUS_CONFIG[status] || STATUS_CONFIG['in range'];

  return (
    <div 
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick();
        }
      }}
      className={cn(
        "group relative grid grid-cols-2 sm:flex sm:items-center w-full p-4 bg-white border border-slate-100 rounded-xl transition-all hover:shadow-md hover:border-blue-500/30 cursor-pointer gap-4",
      )}
    >
      {/* 1. Name */}
      <div className="col-span-2 sm:w-48 sm:shrink-0">
        <h3 className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
          {name}
        </h3>
      </div>

      {/* 2. Status Bullet + Name */}
      <div className="col-span-1 sm:w-32 sm:shrink-0 flex items-center gap-2">
        <div className={cn("w-2 h-2 rounded-full", currentStatus.color)} />
        <span className="text-xs font-medium text-slate-600 capitalize">
          {status}
        </span>
      </div>

      {/* 3. Value + Units */}
      <div className="col-span-1 sm:w-32 sm:shrink-0 flex items-baseline gap-1">
        <span className="text-lg font-bold text-slate-900">{value}</span>
        <span className="text-xs text-slate-500 font-medium">{unit}</span>
      </div>

      {/* 4. Range / Reference Standard */}
      <div className="col-span-2 sm:flex-1 flex flex-col justify-center">
        <div className="text-[10px] text-slate-400 uppercase tracking-wide font-medium mb-1 truncate" title={referenceLabel}>
          {referenceLabel}
        </div>
        <div className="text-xs text-slate-700 font-medium">
          {referenceText}
        </div>
      </div>

      {/* 5. The ClinicalRangeGrid (Mini) */}
      <div className="col-span-2 w-full sm:w-32 h-12 relative shrink-0">
         <div className="absolute inset-0 flex flex-col gap-px">
             <ClinicalRangeGrid 
                ranges={ranges}
                value={value}
                className="gap-px border-none pb-0"
                style={{ }}
                isReversed={true}
             />
             
         </div>
      </div>

    </div>
  );
}
