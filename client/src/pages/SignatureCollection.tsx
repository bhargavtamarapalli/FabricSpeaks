import React from "react";
import PageLayout from "@/components/PageLayout";
import LuxurySignatureCollection from "@/components/LuxurySignatureCollection";

export default function SignatureCollectionPage() {
    return (
        <PageLayout className="min-h-screen bg-stone-100 dark:bg-black font-sans transition-colors duration-300">
            <main className="pt-20">
                <LuxurySignatureCollection />
            </main>
        </PageLayout>
    );
}
