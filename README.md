# CarbonSync Biomarker Dashboard

A live interactive clinical biomarker dashboard built with Next.js, parsing data dynamically from Google Sheets.

## Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Setup**
   Create a `.env.local` file based on `.env.example` with the following variables:
   ```env
   NEXT_PUBLIC_GOOGLE_SHEET_ID=your_sheet_id
   NEXT_PUBLIC_SHEET_TAB_BIOMARKERS_NAME=Biomarkers
   NEXT_PUBLIC_SHEET_TAB_BIOMARKERS_GID=0
   NEXT_PUBLIC_SHEET_TAB_METRICS_NAME=Metrics
   NEXT_PUBLIC_SHEET_TAB_METRICS_GID=123456
   ```

3. **Run Development Server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

## Data Structure & Tradeoffs

The application's parser (`csv-parser.ts` and `segment-logic.ts`) relies on **strict column naming conventions**. Any changes to the Google Sheet structure outside of these rules will result in data being ignored or errors.

### Strict Naming Rules
1.  **Column Names are Normalized**: Spaces in headers are converted to underscores (e.g., "Reference Range" -> `Reference_Range`). Capitalization is generally preserved or normalized in specific matchers.
2.  **Required Columns**:
    - `Biomarker Name` (Exact match required)
    - `Unit` (Optional, but recommended)
    - `Standard Reference Range` (Or similar variants like `Standard Reference Range Male`)
    - `Graph Range` / `Graph Range Female`
3.  **Age Bracket Pattern**:
    - Columns defining age-specific ranges **MUST** follow the pattern: `[Gender] [MinAge]-[MaxAge] [Status]` (Spaces are converted to underscores).
    - **Status Keywords** (MUST be one of these exact formats):
        - `Optimal`
        - `InRange` (No spaces!)
        - `OutOfRange` (No spaces!)
    - Examples:
        - `Male 18-35 Optimal` -> OK
        - `Female 50+ InRange` -> OK
        - `Female 50+ In range` -> **BROKEN** (becomes `In_range` which fails matching)
    - **Tradeoff**: Changing the order or adding spaces in the status keyword will break the parser.

### Requirement Ambiguity
One of the main tradeoffs is that the requirements aren't fully defined yet.

### Source of Truth Dilemma: CSV vs. User Input
Contemplating whether to add manual input fields for **Metabolic Health Score** and **Creatinine** to allow for simulations, or to strictly follow the CSV as the single source of truth to ensure absolute data consistency. Currently, relying solely on the CSV ensures absolute data consistency and architectural simplicity but limits the user's ability to experiment with "what-if" scenarios. 

## File Structure

```
src/
├── app/                  # Next.js App Router (pages & layouts)
├── components/
│   ├── features/         # Feature-specific logic
│   │   └── biomarkers/   # Biomarker dashboard components & logic
│   └── ui/               # Base UI components (shadcn/Radix)
└── lib/                  # Utilities, helpers, and API services
```


