import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KUSHMAP — Thailand Cannabis Directory",
  description: "Find and review cannabis shops in Thailand",
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
