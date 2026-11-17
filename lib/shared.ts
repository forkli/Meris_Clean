// Hem sunucuda hem tarayıcıda kullanılan küçük yardımcılar.

export const SURFACES = [
  { key: "mutfak", name: "Mutfak" },
  { key: "banyo", name: "Banyo" },
  { key: "cam", name: "Cam & ayna" },
  { key: "zemin", name: "Zemin" },
  { key: "camasir", name: "Halı & çamaşır" },
  { key: "arac", name: "Araç" },
  { key: "profesyonel", name: "Şantiye" },
] as const;

export const surfaceName = (key: string) => SURFACES.find((s) => s.key === key)?.name ?? key;

const tl = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 2 });
export const formatTL = (n: number) => `${tl.format(n)} TL`;

/** Ürün görseli yolu: "/img/..." yerel dosya, aksi halde Supabase Storage yolu. */
export function imageUrl(path: string, supabaseUrl?: string): string {
  if (path.startsWith("/") || path.startsWith("http")) return path;
  const base = supabaseUrl ?? process.env.SUPABASE_URL ?? "";
  return `${base}/storage/v1/object/public/product-images/${path}`;
}

export function slugify(s: string): string {
  const map: Record<string, string> = { ç: "c", ğ: "g", ı: "i", İ: "i", ö: "o", ş: "s", ü: "u", Ç: "c", Ğ: "g", Ö: "o", Ş: "s", Ü: "u" };
  return s
    .replace(/[çğıİöşüÇĞÖŞÜ]/g, (c) => map[c] ?? c)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Satılabilir varyant: fiyatı girilmiş ve stokta. */
export const sellable = (v: { price: number; in_stock: boolean }) => Number(v.price) > 0 && v.in_stock;
