import type { Metadata, Viewport } from "next";
import { Schibsted_Grotesk, Sofia_Sans_Extra_Condensed } from "next/font/google";
import "./globals.css";

const body = Schibsted_Grotesk({ subsets: ["latin", "latin-ext"], variable: "--font-body", display: "swap" });
const display = Sofia_Sans_Extra_Condensed({
  subsets: ["latin", "latin-ext"],
  weight: ["600", "800"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL || "https://merisclean.com"),
  title: { default: "Meris Clean — Doğadan evinize temizlik", template: "%s — Meris Clean" },
  description:
    "Prolinex doğal temizlik ürünleri. Fosfat, klor ve amonyak içermeyen formüller; mutfak, banyo, cam, araç ve zemin için. Türkiye geneline 1–3 iş gününde teslimat.",
  openGraph: { type: "website", locale: "tr_TR", siteName: "Meris Clean" },
};

export const viewport: Viewport = { themeColor: "#f1f5f5" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={`${body.variable} ${display.variable}`}>
      <body>{children}</body>
    </html>
  );
}
