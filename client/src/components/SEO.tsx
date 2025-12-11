import { Helmet } from "react-helmet-async";

interface SEOProps {
    title: string;
    description?: string;
    image?: string;
    url?: string;
    type?: "website" | "article" | "product";
    structuredData?: object;
}

export function SEO({
    title,
    description = "Fabric Speaks - Premium Sustainable Fashion",
    image = "/og-image.jpg",
    url = typeof window !== 'undefined' ? window.location.href : '',
    type = "website",
    structuredData
}: SEOProps) {
    const siteTitle = "Fabric Speaks";
    const fullTitle = `${title} | ${siteTitle}`;

    return (
        <Helmet>
            {/* Basic Meta Tags */}
            <title>{fullTitle}</title>
            <meta name="description" content={description} />
            <link rel="canonical" href={url} />

            {/* Open Graph */}
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={image} />
            <meta property="og:url" content={url} />
            <meta property="og:type" content={type} />
            <meta property="og:site_name" content={siteTitle} />

            {/* Twitter Card */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={image} />

            {/* Structured Data */}
            {structuredData && (
                <script type="application/ld+json">
                    {JSON.stringify(structuredData)}
                </script>
            )}
        </Helmet>
    );
}
