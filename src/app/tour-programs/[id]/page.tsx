// src/app/tour-programs/[id]/page.tsx
import { getTourProgram, getAllTourPrograms } from '@/services/tourProgramService';
import TourProgramClientPage from './client-page';
import type { TourProgram } from '@/lib/types';
import StaticExportWrapper from '@/components/StaticExportWrapper';

export const dynamicParams = true; // Allow new programs to be created

export async function generateStaticParams() {
    try {
        const programs = await getAllTourPrograms();
        return programs.map((prog) => ({
            id: prog.id,
        }));
    } catch (error) {
        console.error("Failed to generate static params for tour programs", error);
        return [];
    }
}

async function getProgramData(id: string): Promise<TourProgram | null> {
    try {
        const program = await getTourProgram(id);
        return program;
    } catch (error) {
        console.error(`Failed to get program data for id: ${id}`, error);
        return null;
    }
}

function LoadingFallback() {
    return (
        <div className="flex min-h-screen w-full flex-col items-center justify-center bg-muted/40">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">Loading Program Details...</p>
        </div>
    );
}

export default async function TourProgramPage({ params }: { params: { id: string } }) {
    const { id } = params;
    const programData = await getProgramData(id);

    if (!programData) {
        return (
             <div className="flex min-h-screen w-full flex-col items-center justify-center bg-muted/40">
                <p className="text-red-500">ບໍ່ພົບຂໍ້ມູນໂປຣແກຣມ</p>
             </div>
        )
    }

    return (
        <StaticExportWrapper fallback={<LoadingFallback/>}>
            <TourProgramClientPage initialProgram={programData} />
        </StaticExportWrapper>
    