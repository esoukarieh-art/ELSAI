import "./globals.css";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "ELSAI — Assistant social numérique",
  description:
    "Permanence d'accueil numérique, anonyme et empathique. Disponible 24h/24.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#1a5490",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen">
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
