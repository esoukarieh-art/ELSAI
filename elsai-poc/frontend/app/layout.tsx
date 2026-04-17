import "./globals.css";
import type { Metadata, Viewport } from "next";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Assistant social numérique anonyme`,
    template: `%s — ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  generator: "Next.js",
  keywords: [
    "assistant social",
    "droits sociaux",
    "CAF",
    "aide sociale",
    "anonyme",
    "gratuit",
    "France",
    "jeunes",
    "119",
    "accompagnement social",
  ],
  authors: [{ name: "ELSAI" }],
  creator: "ELSAI",
  manifest: "/manifest.json",
  icons: {
    icon: "/logo-elsai.svg",
    apple: "/logo-elsai.svg",
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Assistant social numérique anonyme`,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/logo-elsai.svg",
        width: 512,
        height: 512,
        alt: "Logo ELSAI",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Assistant social numérique anonyme`,
    description: SITE_DESCRIPTION,
    images: ["/logo-elsai.svg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  category: "social services",
};

export const viewport: Viewport = {
  themeColor: "#5A7E6B",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen font-sans">
        <a
          href="#contenu"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:bg-elsai-pin focus:text-elsai-creme focus:px-4 focus:py-2 focus:rounded-organic focus:shadow-organic focus:font-semibold"
        >
          Aller au contenu principal
        </a>
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `if ('serviceWorker' in navigator) {
              window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(()=>{}));
            }`,
          }}
        />
      </body>
    </html>
  );
}
