'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { LabeledInput } from '@/components/ui/custom/LabeledInput';
import { SegmentedControl } from '@/components/ui/custom/SegmentedControl';


export default function BiomarkerControls() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize state from URL or props (Server Data) or hard fallback
  const [age, setAge] = useState(searchParams.get('age') || '30');
  const [gender, setGender] = useState(searchParams.get('gender') || 'Male');
  
  const updateParams = useCallback(() => {
    const params = new URLSearchParams(searchParams);
    params.set('age', age);
    params.set('gender', gender);
    // Remove "simulation" params that were previously here

    // Only push if params actually changed to prevent infinite loop
    if (params.toString() !== searchParams.toString()) {
      router.push(`?${params.toString()}`);
    }
  }, [age, gender, router, searchParams]);

  // Debounce update for all inputs
  useEffect(() => {
    const timer = setTimeout(() => {
      updateParams();
    }, 500);
    return () => clearTimeout(timer);
  }, [age, gender, updateParams]);
  

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-6 mb-8">
      
      {/* Top Row: Demographics (Affects Ranges) */}
      <div className="flex flex-wrap gap-6 items-center">
        <h3 className="text-gray-400 font-bold text-xs uppercase tracking-wider w-full md:w-auto">User Demographics</h3>
        
        <SegmentedControl
          label="Gender"
          value={gender}
          onChange={setGender}
          options={[
            { label: 'Male', value: 'Male', activeClassName: 'text-blue-600' },
            { label: 'Female', value: 'Female', activeClassName: 'text-pink-600' },
          ]}
        />

        <LabeledInput
          label="Age"
          id="age"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          min="0"
          max="120"
          className="w-24"
        />

        <div className="ml-auto text-sm text-gray-500">
           Reading from: <span className="font-semibold text-gray-900">{gender}, {age} years old</span> column
        </div>
      </div>

    </div>
  );
}
