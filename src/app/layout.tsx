import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Variable font; `opsz` lets Inter pick the right optical size (HANDOFF §4.2).
const inter = Inter({
  subsets: ["latin"],
  axes: ["opsz"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Maintenance requests",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
