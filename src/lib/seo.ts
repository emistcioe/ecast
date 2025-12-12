/**
 * SEO Configuration and Metadata Utilities
 * Centralized SEO settings for the ECAST website
 */

export const siteConfig = {
  name: "ECAST - Electronic and Communication Arts and Science",
  shortName: "ECAST",
  description:
    "ECAST (Electronic and Communication Arts and Science) is a dynamic student club at Thapathali Campus Institute of Engineering, fostering innovation in electronics, communication, and technology through workshops, projects, and research.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://ecast.tcioe.edu.np",
  ogImage: `${
    process.env.NEXT_PUBLIC_SITE_URL || "https://ecast.tcioe.edu.np"
  }/og-image.png`,
  keywords: [
    "ECAST",
    "Thapathali Campus",
    "IOE",
    "Electronics Club",
    "Communication Engineering",
    "Student Club Nepal",
    "Engineering Club",
    "Technology Club",
    "Innovation",
    "Research",
    "Workshops",
    "Projects",
    "Nepal Engineering",
    "TCIOE",
  ],
  authors: [{ name: "ECAST Team" }],
  creator: "ECAST",
  publisher: "ECAST - Thapathali Campus",
  locale: "en_US",
  type: "website",

  // Social Media
  social: {
    facebook: "https://www.facebook.com/ecast.tcioe",
    instagram: "https://www.instagram.com/ecast.tcioe",
    twitter: "https://twitter.com/ecast_tcioe",
    linkedin: "https://www.linkedin.com/company/ecast-tcioe",
    github: "https://github.com/EMISTCIOE",
  },

  // Contact
  email: "ecast@tcioe.edu.np",

  // Organization Schema
  organization: {
    "@type": "Organization",
    name: "ECAST",
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://ecast.tcioe.edu.np",
    logo: `${
      process.env.NEXT_PUBLIC_SITE_URL || "https://ecast.tcioe.edu.np"
    }/logo.png`,
    description:
      "Electronic and Communication Arts and Science Club at Thapathali Campus",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Kathmandu",
      addressCountry: "NP",
    },
  },
};

interface MetadataProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
  keywords?: string[];
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
  tags?: string[];
  noindex?: boolean;
  canonical?: string;
}

/**
 * Generate complete SEO metadata for a page
 */
export function generateMetadata({
  title,
  description = siteConfig.description,
  image = siteConfig.ogImage,
  url,
  type = "website",
  keywords = siteConfig.keywords,
  author,
  publishedTime,
  modifiedTime,
  section,
  tags = [],
  noindex = false,
  canonical,
}: MetadataProps = {}) {
  const pageTitle = title ? `${title} | ${siteConfig.name}` : siteConfig.name;
  const pageUrl = url ? `${siteConfig.url}${url}` : siteConfig.url;
  const canonicalUrl = canonical || pageUrl;

  return {
    title: pageTitle,
    description,
    keywords: [...keywords, ...tags].join(", "),
    canonical: canonicalUrl,
    openGraph: {
      title: pageTitle,
      description,
      url: pageUrl,
      siteName: siteConfig.name,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title || siteConfig.name,
        },
      ],
      locale: siteConfig.locale,
      type,
      ...(publishedTime && { publishedTime }),
      ...(modifiedTime && { modifiedTime }),
      ...(author && { authors: [author] }),
      ...(section && { section }),
      ...(tags.length > 0 && { tags }),
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description,
      images: [image],
      creator: "@ecast_tcioe",
      site: "@ecast_tcioe",
    },
    robots: {
      index: !noindex,
      follow: !noindex,
      googleBot: {
        index: !noindex,
        follow: !noindex,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    ...(author && { author }),
  };
}

/**
 * Generate JSON-LD structured data
 */
export function generateJsonLd(data: any) {
  return {
    __html: JSON.stringify(data),
  };
}

/**
 * Generate Article JSON-LD
 */
export function generateArticleJsonLd({
  title,
  description,
  image,
  datePublished,
  dateModified,
  author,
  url,
}: {
  title: string;
  description: string;
  image: string;
  datePublished: string;
  dateModified?: string;
  author: string;
  url: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    image,
    datePublished,
    dateModified: dateModified || datePublished,
    author: {
      "@type": "Person",
      name: author,
    },
    publisher: siteConfig.organization,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
  };
}

/**
 * Generate Event JSON-LD
 */
export function generateEventJsonLd({
  name,
  description,
  image,
  startDate,
  endDate,
  location,
  url,
}: {
  name: string;
  description: string;
  image: string;
  startDate: string;
  endDate?: string;
  location: string;
  url: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name,
    description,
    image,
    startDate,
    endDate,
    location: {
      "@type": "Place",
      name: location,
    },
    organizer: siteConfig.organization,
    url,
  };
}

/**
 * Generate Person JSON-LD
 */
export function generatePersonJsonLd({
  name,
  image,
  jobTitle,
  url,
  description,
}: {
  name: string;
  image?: string;
  jobTitle?: string;
  url: string;
  description?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name,
    ...(image && { image }),
    ...(jobTitle && { jobTitle }),
    url,
    ...(description && { description }),
    affiliation: siteConfig.organization,
  };
}

/**
 * Generate BreadcrumbList JSON-LD
 */
export function generateBreadcrumbJsonLd(
  items: { name: string; url: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${siteConfig.url}${item.url}`,
    })),
  };
}

/**
 * Generate Research/ScholarlyArticle JSON-LD
 */
export function generateResearchJsonLd({
  title,
  description,
  authors,
  datePublished,
  journalName,
  url,
}: {
  title: string;
  description: string;
  authors: string;
  datePublished: string;
  journalName?: string;
  url: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "ScholarlyArticle",
    headline: title,
    description,
    author: authors.split(",").map((name) => ({
      "@type": "Person",
      name: name.trim(),
    })),
    datePublished,
    ...(journalName && {
      isPartOf: {
        "@type": "Periodical",
        name: journalName,
      },
    }),
    publisher: siteConfig.organization,
    url,
  };
}
