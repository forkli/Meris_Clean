import "server-only";
import { readFileSync } from "node:fs";
import path from "node:path";
import type { Bundle, Category, Product, Settings } from "@/lib/types";

/**
 * Yalnızca yerel geliştirme: MC_FIXTURES=1 iken vitrin, veritabanı yerine supabase/seed.sql
 * içindeki başlangıç kataloğunu kullanır. Tasarımı veritabanı kurulmadan görmek için.
 */
export const fixturesOn = () => process.env.NODE_ENV !== "production" && process.env.MC_FIXTURES === "1";

type Raw = { slug: string; name: string; cat: string; color: string; featured?: boolean; active?: boolean; sort: number; tagline?: string | null; description?: string; usage?: string; ingredients?: string[]; surfaces?: string[]; variants: { label: string; price: number }[]; images: string[] };

let cache: { products: Product[]; categories: Category[]; bundles: Bundle[] } | null = null;

function load() {
  if (cache) return cache;
  const sql = readFileSync(path.join(process.cwd(), "supabase/seed.sql"), "utf8");
  const json = sql.split("$json$")[1];
  const raw = JSON.parse(json) as Raw[];
  const categories: Category[] = [...sql.matchAll(/\('([a-z]+)', '([^']+)', (\d+)\)/g)].map((m) => ({ id: m[1], slug: m[1], name: m[2], sort: Number(m[3]) }));
  const products: Product[] = raw
    .filter((r) => r.active)
    .map((r) => ({
      id: r.slug, slug: r.slug, name: r.name, tagline: r.tagline ?? null, description: r.description ?? null, usage: r.usage ?? null,
      ingredients: r.ingredients ?? [], surfaces: r.surfaces ?? [], color: r.color, category_id: r.cat, featured: !!r.featured, active: true, sort: r.sort,
      category: categories.find((c) => c.slug === r.cat) ?? null,
      variants: r.variants.map((v, i) => ({ id: `${r.slug}-${i}`, product_id: r.slug, label: v.label, sku: null, price: v.price, compare_at_price: null, in_stock: true, sort: i })),
      images: r.images.map((p, i) => ({ id: `${r.slug}-img-${i}`, product_id: r.slug, path: p, alt: r.name, sort: i })),
    }));
  const four = products.filter((p) => ["yagcoz", "wc-banyo", "silikonlu", "sihirli-su"].includes(p.slug));
  const bundles: Bundle[] = [{
    id: "dortlu-mix", slug: "dortlu-mix", name: "4'lü Mix Paket", price: 500, active: true, sort: 1,
    description: "Mutfak, banyo, cam ve genel temizlik için dört ürün tek pakette: Yağçöz, WC Banyo, Silikonlu ve Sihirli Su.",
    items: four.map((p) => ({ variant_id: p.variants[0].id, quantity: 1, variant: { ...p.variants[0], product: { id: p.id, slug: p.slug, name: p.name, color: p.color, images: p.images } } })),
  }];
  cache = { products, categories, bundles };
  return cache;
}

export const fx = {
  categories: () => load().categories,
  products: () => load().products,
  bundles: () => load().bundles,
  settings: (): Settings => ({ shipping_fee: 60, free_shipping_threshold: 1000, min_order_amount: 500 }),
};
