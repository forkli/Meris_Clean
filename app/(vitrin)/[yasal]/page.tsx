import type { Metadata } from "next";
import { readFile } from "node:fs/promises";
import path from "node:path";

// Metinler eski siteden birebir taşındı: content/yasal/*.html (sabit, güvenilir içerik).
const PAGES = {
  kvkk: "KVKK aydınlatma metni",
  gizlilik: "Gizlilik politikası",
  iade: "İade ve iptal politikası",
  "mesafeli-satis": "Mesafeli satış sözleşmesi",
} as const;
type Key = keyof typeof PAGES;

export const dynamicParams = false;
export function generateStaticParams() {
  return Object.keys(PAGES).map((yasal) => ({ yasal }));
}

type Params = Promise<{ yasal: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { yasal } = await params;
  return { title: PAGES[yasal as Key] };
}

export default async function YasalSayfa({ params }: { params: Params }) {
  const { yasal } = await params;
  const html = await readFile(path.join(process.cwd(), "content/yasal", `${yasal}.html`), "utf8");
  return <article className="wrap prose" dangerouslySetInnerHTML={{ __html: html }} />;
}
