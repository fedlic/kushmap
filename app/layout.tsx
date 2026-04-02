import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";
import AgeGate from "@/components/AgeGate";

export const metadata: Metadata = {
  title: "KUSHMAP — Thailand Cannabis Dispensary Directory",
  description: "Find the best cannabis dispensaries in Thailand. Browse 2,900+ weed shops in Bangkok, Phuket, Chiang Mai, Pattaya and more. Reviews, photos, hours, menus and amenities.",
  keywords: "cannabis dispensary Thailand, weed shop Bangkok, marijuana dispensary Phuket, cannabis Chiang Mai, dispensary Thailand, weed delivery Thailand",
  openGraph: {
    title: "KUSHMAP — Thailand Cannabis Dispensary Directory",
    description: "Find the best cannabis dispensaries in Thailand. Browse 2,900+ weed shops in Bangkok, Phuket, Chiang Mai, Pattaya and more.",
    url: "https://kushmap.vercel.app",
    siteName: "KUSHMAP",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "KUSHMAP — Thailand Cannabis Dispensary Directory",
    description: "Find the best cannabis dispensaries in Thailand. 2,900+ shops with reviews and photos.",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://kushmap.vercel.app",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8620642498629308"
          crossOrigin="anonymous"
        />
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-N306SPPJ0E" />
        <script dangerouslySetInnerHTML={{ __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-N306SPPJ0E');` }} />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1a1a2e" />
        <link rel="icon" href="/icon-192x192.svg" />
        <link rel="apple-touch-icon" href="/icon-192x192.svg" />
      </head>
      <body className="antialiased">
        <Analytics />
        <AgeGate />
        {children}
        <footer className="border-t border-gray-200 bg-white px-4 py-5">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
            <span>&copy; 2026 KUSHMAP by FEDLIC TOKYO LLC</span>
            <nav className="flex items-center gap-4">
              <a href="/privacy" className="hover:text-green-600 transition-colors">Privacy Policy</a>
              <a href="/terms" className="hover:text-green-600 transition-colors">Terms of Service</a>
              <a href="mailto:info@fedlic.tokyo" className="hover:text-green-600 transition-colors">Contact</a>
            </nav>
          </div>
        </footer>
      </body>
    </html>
  );
}
