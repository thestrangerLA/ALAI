
import { getCalculation, getAllCalculations, saveCalculation } from '@/services/tourCalculatorService';
import TourCalculatorClientPage from './client-page';
import type { SavedCalculation } from '@/lib/types';
import StaticExportWrapper from '@/components/StaticExportWrapper';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getCalculationData(id: string) {
    let calculation = await getCalculation(id);
    if (!calculation && id === 'default') {
        const newCalculationData: Omit<SavedCalculation, 'id'| 'savedAt'> = {
            name: 'Default Calculation',
            tourInfo: {
                mouContact: '',
                groupCode: 'Default Group',
                destinationCountry: '',
                program: 'Default Calculation',
                startDate: new Date(),
                endDate: new Date(),
                numDays: 1,
                numNights: 0,
                numPeople: 1,
                travelerInfo: ''
            },
            allCosts: {
                accommodations: [],
                trips: [],
                flights: [],
                trainTickets: [],
                entranceFees: [],
                meals: [],
                guides: [],
                documents: [],
            }
        };
        await saveCalculation(newCalculationData, 'default');
        calculation = await getCalculation(id);
    }
    return calculation;
}

function LoadingFallback() {
    return (
        <div className="flex min-h-screen w-full flex-col items-center justify-center bg-muted/40">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">Loading Calculation...</p>
        </div>
    );
}

export default async function TourProgramPage({ params }: { params: { id: string } }) {
    const { id } = params;
    const calculationData = await getCalculationData(id);

    if (!calculationData) {
        return (
             <div className="flex min-h-screen w-full flex-col items-center justify-center bg-muted/40">
                <p>ບໍ່ພົບຂໍ້ມູນການຄຳນວນ</p>
             </div>
        )
    }

    return (
        <StaticExportWrapper fallback={<LoadingFallback/>}>
            <TourCalculatorClientPage initialCalculation={calculationData} />
        </StaticExportWrapper>
    );
}
