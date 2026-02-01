
import {
    BiomarkerResult,
    BiomarkerRow,
} from './clinical-schemas';
import {
    extractBiomarkerInfo,
    determineRangeStrings
} from './parsers';
import {
    computeBoundaries,
    buildSegmentsFromBoundaries
} from './range-math';

// --- Logic Implementation ---

export function getSegmentsForBiomarker(
    data: BiomarkerRow[],
    biomarkerName: string,
    age: number,
    gender: 'Male' | 'Female'
): BiomarkerResult {
    const row = data.find((r) => r.Biomarker_Name?.trim() === biomarkerName);
    if (!row) {
        console.warn(`Biomarker not found: ${biomarkerName}`);
        return { segments: [], standardReference: 'N/A', unit: '' };
    }

    // 1. Parse Metadata & Reference Strings (Parser Logic)
    const { unit, standardReference, referenceLabel } = extractBiomarkerInfo(row, gender);
    const { optimalStr, inRangeStr, outOfRangeStr } = determineRangeStrings(row, age, gender, standardReference);

    // 2. Compute Numeric Boundaries (Math Logic)
    const { graphMin, inMin, optMin, optMax, inMax, graphMax } = computeBoundaries(
        optimalStr,
        inRangeStr,
        outOfRangeStr,
        row,
        gender
    );

    // 3. Build Segments (Math/Visual Logic)
    const segments = buildSegmentsFromBoundaries(graphMin, inMin, optMin, optMax, inMax, graphMax);

    // 4. Determine Display Reference
    let displayReference = 'N/A';
    if (standardReference && standardReference !== 'N/A') {
        displayReference = standardReference;
    } else if (optimalStr) {
        displayReference = optimalStr;
    } else if (inRangeStr) {
        displayReference = inRangeStr;
    }

    // Use optimalStr as the standard reference display if available, as it represents the applied range
    return {
        segments,
        standardReference: displayReference,
        referenceLabel,
        unit
    };
}
