import type { Metadata } from "next";
import { Cairo, Tajawal } from "next/font/google";
import "./globals.css";
import ConvexClientProvider from "@/components/ConvexClientProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const tajawal = Cairo({
  subsets: ["arabic",
    "latin"
  ],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://w-ai.online"),
  title: {
    template: "%s - w-ai.online",
    default: "w-ai.online - أتمت واتساب للأعمال بالذكاء الاصطناعي",
  },
  description: "منصة شاملة لأتمتة واتساب للأعمال بالذكاء الاصطناعي. وفر 50% من وقتك وزد مبيعاتك 3x مع ردود تلقائية ذكية وإدارة محادثات موحدة.",
  keywords: [
    "واتساب للأعمال",
    "WhatsApp Business",
    "أتمتة واتساب",
    "ذكاء اصطناعي",
    "AI",
    "chatbot",
    "إدارة محادثات",
    "حملات تسويقية",
    "واتساب API",
    "Meta Business",
    "automation",
    "customer service",
    "w-ai",
    "w-ai.online"
  ],
  authors: [{ name: "w-ai.online" }],
  creator: "w-ai.online",
  publisher: "w-ai.online",
  applicationName: "w-ai.online",
  referrer: "origin-when-cross-origin",
  openGraph: {
    type: "website",
    locale: "ar_SA",
    url: "https://w-ai.online",
    siteName: "w-ai.online",
    title: "w-ai.online - أتمت واتساب للأعمال بالذكاء الاصطناعي",
    description: "منصة شاملة لأتمتة واتساب للأعمال بالذكاء الاصطناعي. وفر 50% من وقتك وزد مبيعاتك 3x مع ردود تلقائية ذكية وإدارة محادثات موحدة.",
    images: [
      {
        url: "/w-ai.b.jpg",
        width: 1200,
        height: 630,
        alt: "w-ai.online - أتمت واتساب للأعمال",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "w-ai.online - أتمت واتساب للأعمال بالذكاء الاصطناعي",
    description: "منصة شاملة لأتمتة واتساب للأعمال بالذكاء الاصطناعي. وفر 50% من وقتك وزد مبيعاتك 3x",
    images: ["/w-ai.b.jpg"],
    creator: "@w-ai-online",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/manifest.json",
  alternates: {
    canonical: "https://w-ai.online",
    languages: {
      "ar-SA": "https://w-ai.online",
      "en-US": "https://w-ai.online",
    },
  },
  category: "business",
  classification: "Business Automation Software",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "w-ai.online",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "1000",
    },
    "description": "منصة شاملة لأتمتة واتساب للأعمال بالذكاء الاصطناعي",
    "url": "https://w-ai.online",
  };

  const organizationData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "w-ai.online",
    "url": "https://w-ai.online",
    "logo": "https://w-ai.online/android-chrome-512x512.png",
    "description": "منصة شاملة لأتمتة واتساب للأعمال بالذكاء الاصطناعي",
    "sameAs": [],
  };

  const websiteData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "w-ai.online",
    "url": "https://w-ai.online",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://w-ai.online/search?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html lang="ar" dir="rtl">
      <head>
        <meta name="theme-color" content="#1D4F34" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="w-ai.online" />
        <meta name="format-detection" content="telephone=no" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="manifest" href="/site.webmanifest" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationData) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteData) }}
        />
      </head>
      <body
        className={`${tajawal.className} antialiased font-sans`}
      >
        <ConvexClientProvider>
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
