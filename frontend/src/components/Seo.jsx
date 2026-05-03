import React from 'react';

/**
 * <Seo /> renders metadata into the document <head> using React 19's
 * native ability to hoist <title>, <meta>, <link>, and <script> tags.
 *
 * Props:
 *   title           - Page title (full text shown in browser tab + search)
 *   description     - Meta description (~155 chars)
 *   keywords        - Comma-separated keywords (legacy SEO, still nice to have)
 *   canonical       - Absolute canonical URL for this page
 *   image           - OpenGraph / Twitter share image (absolute URL)
 *   jsonLd          - Optional JSON-LD object (or array) injected as schema.org data
 */
export default function Seo({
  title,
  description,
  keywords,
  canonical,
  image = 'https://duskypdf.com/og-cover.png',
  jsonLd,
}) {
  const url = canonical || (typeof window !== 'undefined' ? window.location.href : 'https://duskypdf.com/');

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={url} />

      {/* OpenGraph */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content="DuskyPDF" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* JSON-LD structured data */}
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
    </>
  );
}
