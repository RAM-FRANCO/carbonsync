import React from 'react';

interface Option {
  label: string;
  value: string;
  activeClassName?: string;
}

interface SegmentedControlProps {
  label: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
}

export function SegmentedControl({ label, options, value, onChange }: Readonly<SegmentedControlProps>) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-semibold text-gray-700">{label}</label>
      <div className="flex bg-gray-100 p-1 rounded-lg">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              value === option.value
                ? `bg-white shadow-sm ${option.activeClassName || 'text-blue-600'}`
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
