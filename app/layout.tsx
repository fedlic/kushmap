import type { Metadata } from "next";
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
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1a1a2e" />
        <link rel="icon" href="/icon-192x192.svg" />
        <link rel="apple-touch-icon" href="/icon-192x192.svg" />
      </head>
      <body className="antialiased">
        <AgeGate />
        {children}
      </body>
    </html>
  );
}
