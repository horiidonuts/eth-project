import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

// latin-ext covers Turkish characters (ş, ğ, ı, İ …).
const geistSans = Geist({ variable: "--font-sans", subsets: ["latin", "latin-ext"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin", "latin-ext"] });

export const metadata: Metadata = {
  title: { default: "ZK E-Oylama", template: "%s · ZK E-Oylama" },
  description: "Sıfır bilgi ispatlı, blokzincir tabanlı elektronik oylama (bitirme projesi).",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="tr" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <SiteHeader />
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">{children}</main>
        <footer className="border-t py-4 text-center text-xs text-muted-foreground">
          Geliştirme sürümü · Tüm veriler sentetiktir · İspatlar şimdilik sahte (mock)
        </footer>
      </body>
    </html>
  );
}
