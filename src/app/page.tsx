import BiomarkerDashboard from '@/components/features/biomarkers/BiomarkerDashboard';
import BiomarkerDataError from '@/components/features/biomarkers/components/BiomarkerDataError';
import { getAllBiomarkers } from '@/components/features/biomarkers/utils/biomarker-service';

export const metadata = {
  title: 'Biomarker Dashboard | CarbonSync',
  description: 'Live interactive clinical biomarker dashboard',
};

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;

  const age = Number.parseInt(resolvedParams.age as string) || 30;
  const gender = (resolvedParams.gender as string) === 'Female' ? 'Female' : 'Male';

  const dashboardItems = await getAllBiomarkers(age, gender, resolvedParams);
  
  if (dashboardItems.length === 0) {
    return <BiomarkerDataError />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Clinical Dashboard</h1>
          <p className="mt-2 text-gray-500">Live view of your biomarker panel results.</p>
        </div>

        {/* Client-Side Dashboard (Handles Modal state) */}
        <BiomarkerDashboard 
            items={dashboardItems}
            date="Aug 15, 2025"
        />

        <div className="mt-12 text-center text-sm text-gray-400">
          <p>Data source: Live Google Sheet (CSV)</p>
          <p>Ranges automatically adjust based on Age/Gender selection above.</p>
        </div>

      </div>
    </div>
  );
}
