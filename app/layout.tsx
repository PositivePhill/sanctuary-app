import type { Metadata, Viewport } from "next";
import { Inter, Merriweather } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

const merriweather = Merriweather({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-merriweather",
});

export const metadata: Metadata = {
    title: "SANCTUARY",
    description: "Church community platform for prayer, devotionals, praise reports, and events.",
    manifest: "/site.webmanifest",
    icons: {
        icon: "/favicon.ico",
        shortcut: "/favicon.ico",
        apple: "/apple-touch-icon.png",
    },
};

export const viewport: Viewport = {
    themeColor: "#f97316",
};

export default function RootLayout({
                                     children,
                                   }: {
  children: React.ReactNode;
}) {
  return (
      <html lang="en" className={`${inter.variable} ${merriweather.variable}`}>
      <body className="font-sans bg-stone-50 text-slate-900 antialiased">
      {children}
      </body>
      </html>
  );
}