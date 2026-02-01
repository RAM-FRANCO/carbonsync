'use client';

import { ChevronLeft, X } from 'lucide-react';
import React from 'react';

import { ClinicalRangeChart } from '@/components/ui/custom/ClinicalRangeChart';
import { BiomarkerResult } from '@/components/features/biomarkers/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface DetailedItem {
  id: string;
  name: string;
  value: number;
  data: BiomarkerResult;
}

interface Props {
  selectedItem: DetailedItem | null;
  onClose: () => void;
  date: string;
}

export function BiomarkerDetailModal({
  selectedItem,
  onClose,
  date,
}: Readonly<Props>) {
  if (!selectedItem) return null;

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl gap-0 overflow-hidden rounded-3xl border-none p-0 shadow-2xl bg-white sm:rounded-3xl [&>button]:hidden">
        {/* Custom Header to match design exactly, mixing shadcn parts */}
        <DialogHeader className="flex flex-row items-center justify-between border-b border-gray-100 p-6 space-y-0">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="md:hidden -ml-2 rounded-full p-2 transition-colors hover:bg-gray-100"
            >
              <ChevronLeft className="h-5 w-5 text-gray-500" />
            </button>
            <DialogTitle className="text-xl font-bold text-gray-900">
              {selectedItem.name}
            </DialogTitle>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </DialogHeader>

        {/* Modal Body: The Chart */}
        <div className="bg-gray-50/50 p-8">
          <ClinicalRangeChart
            value={selectedItem.value}
            unit={selectedItem.data.unit ?? ''}
            date={date}
            ranges={selectedItem.data.segments}
            className="max-w-full"
          />

          <div className="text-blue-800 mt-8 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm">
            <strong>Clinical Note:</strong> This graph represents your values
            against the {date} reference dataset. Standard reference ranges are
            indicated by the standard deviations.
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end border-t border-gray-100 bg-gray-50 p-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-200 bg-white px-6 py-2 font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
