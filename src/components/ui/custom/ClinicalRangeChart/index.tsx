
"use client";

import React from 'react';

import { cn } from '@/lib/utils';

import { ClinicalRangeGrid } from './ClinicalRangeGrid';
import { type ClinicalRangeChartProps } from './types';

export const ClinicalRangeChart = React.memo(function ClinicalRangeChart({
  value,
  unit,
  date,
  ranges,
  className,
}: ClinicalRangeChartProps) {

  return (
    <section 
      className={cn("flex flex-row w-full max-w-2xl font-sans p-4 items-center gap-4", className)}
      aria-label={`Clinical range chart for ${date}, value ${value} ${unit}`}
    >
       {/* Chart Area */}
       <div className="relative flex flex-col flex-1 h-[300px] w-full gap-1">
          
          {/* Main Grid Container for Rows */}
          <ClinicalRangeGrid 
            ranges={ranges}
            value={value}
            unit={unit}
            showTimeline={true}
            className="flex-1 min-h-0"
          />

          {/* Bottom Labels Section */}
          <div className="relative h-12 w-full">
             <div className="absolute inset-y-0 left-32 right-8">
                {/* Latest Result Label */}
                <div className="absolute left-1/4 -translate-x-1/2 flex flex-col items-center text-center">
                    <span className="text-[10px] font-bold text-slate-700 whitespace-nowrap">Latest result</span>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap leading-tight">{date}</span>
                </div>

                {/* Future Label */}
                <div className="absolute left-3/4 -translate-x-1/2 flex flex-col items-center text-center">
                    <span className="text-[10px] text-slate-400">2026</span>
                </div>
             </div>
          </div>
       </div>
    </section>
  );
});

export default ClinicalRangeChart;
