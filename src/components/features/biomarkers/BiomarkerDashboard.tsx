'use client';

import { useState } from 'react';

import { deriveBiomarkerDisplayProps } from './utils/biomarker-utils';
import { DashboardItem } from '@/components/features/biomarkers/types';

import BiomarkerControls from './BiomarkerControls';
import { BiomarkerCard } from './components/BiomarkerCard';
import { BiomarkerDetailModal } from './components/BiomarkerDetailModal';

interface BiomarkerDashboardProps {
  items: DashboardItem[];
  date: string;
}

export default function BiomarkerDashboard({ 
  items,
  date 
}: Readonly<BiomarkerDashboardProps>) {
  
  // State for Modal (ID of selected item)
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Get selected item data safely
  const selectedItem = items.find(i => i.id === selectedId);

  return (
    <div className="space-y-8">
      
      {/* 1. Global Controls */}
      <BiomarkerControls />

      {/* 2. Generic Card Grid */}
      <div className="flex flex-col gap-8">
        {items.map(item => (
            <BiomarkerCard 
              key={item.id}
              data={deriveBiomarkerDisplayProps(item)}
              onClick={() => setSelectedId(item.id)}
            />
        ))}
        {items.length === 0 && (
           <div className="text-center py-12 text-gray-400">No data available</div>
        )}
      </div>

      {/* 3. The Modal Overlay */}
      <BiomarkerDetailModal 
          selectedItem={selectedItem || null}
          onClose={() => setSelectedId(null)}
          date={date}
      />

    </div>
  );
}

