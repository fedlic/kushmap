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
      <body className="antialiased">
        <AgeGate />
        {children}
      </body>
    </html>
  );
}
