// This file is no longer used as the daily history is now shown in an accordion
// on the main history page. It can be safely deleted.
// We are keeping it to avoid breaking navigation during the transition.
// To re-enable, you would need to change the Link in sales/history/page.tsx back.

'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DeprecatedDailySalesPage() {
    const router = useRouter();
    useEffect(() => {
        // Redirect back to the main history page
        router.replace('/sales/history');
    }, [router]);

    return (
        <div className="flex min-h-screen w-full flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-slate-100">
            <p>ຫນ้านີ້ບໍ່ໄດ້ຖືກນໍາໃຊ້ອີກຕໍ່ໄປ. ກະລຸນາກັບໄປທີ່ປະຫວັດການຂາຍ.</p>
            <p>Redirecting you back...</p>
        </div>
    );
}
