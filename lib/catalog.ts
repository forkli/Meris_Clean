import "server-only";
import { unstable_cache } from "next/cache";
import { publicClient } from "@/lib/supabase/clients";
import type { Bundle, Category, Product, Settings } from "@/lib/types";
import { fx, fixturesOn } from "@/lib/fixtures";

const PRODUCT_SELECT =
  "*, variants:product_variants(*), images:product_images(*), category:categories(*)";

function normalize(p: Product): Product {
  return {
    ...p,
    variants: [...(p.variants ?? [])]
      .map((v) => ({ ...v, price: Number(v.price), compare_at_price: v.compare_at_price == null ? null : Number(v.compare_at_price) }))
      .sort((a, b) => a.sort - b.sort),
    images: [...(p.images ?? [])].sort((a, b) => a.sort - b.sort),
  };
}

async function _getCategories(): Promise<Category[]> {
  if (fixturesOn()) return fx.categories();
  const { data, error } = await publicClient().from("categories").select("*").order("sort");
  if (error) throw error;
  return data ?? [];
}

async function _getProducts(opts: { featured?: boolean } = {}): Promise<Product[]> {
  if (fixturesOn()) return fx.products().filter((p) => !opts.featured || p.featured);
  let q = publicClient().from("products").select(PRODUCT_SELECT).eq("active", true).order("sort");
  if (opts.featured) q = q.eq("featured", true);
  const { data, error } = await q;
  if (error) throw error;
  // Satılabilir en az bir varyantı olmayan ürün vitrine çıkmaz.
  return (data as Product[]).map(normalize).filter((p) => p.variants.some((v) => v.price > 0));
}

async function _getProduct(slug: string): Promise<Product | null> {
  if (fixturesOn()) return fx.products().find((p) => p.slug === slug) ?? null;
  const { data, error } = await publicClient()
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();
  if (error) throw error;
  return data ? normalize(data as Product) : null;
}

const BUNDLE_SELECT =
  "*, items:bundle_items(variant_id, quantity, variant:product_variants(*, product:products(id, slug, name, color, images:product_images(*))))";

async function _getBundles(): Promise<Bundle[]> {
  if (fixturesOn()) return fx.bundles();
  const { data, error } = await publicClient().from("bundles").select(BUNDLE_SELECT).eq("active", true).order("sort");
  if (error) throw error;
  return (data as Bundle[]).map((b) => ({ ...b, price: Number(b.price) }));
}

async function _getBundle(slug: string): Promise<Bundle | null> {
  if (fixturesOn()) return fx.bundles().find((b) => b.slug === slug) ?? null;
  const { data, error } = await publicClient().from("bundles").select(BUNDLE_SELECT).eq("slug", slug).eq("active", true).maybeSingle();
  if (error) throw error;
  return data ? { ...(data as Bundle), price: Number((data as Bundle).price) } : null;
}

async function _getSettings(): Promise<Settings> {
  if (fixturesOn()) return fx.settings();
  const { data } = await publicClient().from("settings").select("*").eq("id", 1).maybeSingle();
  return {
    shipping_fee: Number(data?.shipping_fee ?? 60),
    free_shipping_threshold: Number(data?.free_shipping_threshold ?? 1000),
    min_order_amount: Number(data?.min_order_amount ?? 500),
  };
}

// Vitrin verisi önbellekte tutulur; panelde kayıt yapılınca "katalog" etiketi anında yenilenir.
const opts = { tags: ["katalog"], revalidate: 300 };
export const getCategories = unstable_cache(_getCategories, ["categories"], opts);
export const getProducts = unstable_cache(_getProducts, ["products"], opts);
export const getProduct = unstable_cache(_getProduct, ["product"], opts);
export const getBundles = unstable_cache(_getBundles, ["bundles"], opts);
export const getBundle = unstable_cache(_getBundle, ["bundle"], opts);
export const getSettings = unstable_cache(_getSettings, ["settings"], opts);
