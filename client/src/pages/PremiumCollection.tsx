import { LuxurySignatureCollection } from "@/components/LuxurySignatureCollection";
import { Helmet } from "react-helmet-async";

export default function PremiumCollection() {
    return (
        <>
            <Helmet>
                <title>Premium Collection – Fabric Speaks</title>
                <meta
                    name="description"
                    content="Explore our exclusive Luxury Signature Collection – the most premium apparel curated for discerning tastes."
                />
            </Helmet>

            <LuxurySignatureCollection />
        </>
    );
}
