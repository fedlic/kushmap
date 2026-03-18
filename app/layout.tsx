import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KUSHMAP — Thailand Cannabis Dispensary Directory",
  description: "Find the best cannabis dispensaries in Thailand. Browse 2,900+ weed shops in Bangkok, Phuket, Chiang Mai, Pattaya and more. Reviews, photos, hours.",
  keywords: "cannabis dispensary Thailand, weed shop Bangkok, marijuana dispensary Phuket, cannabis Chiang Mai, dispensary Thailand",
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
