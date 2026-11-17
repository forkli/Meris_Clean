import "server-only";
import { serviceClient } from "@/lib/supabase/clients";
import { getSettings } from "@/lib/catalog";
import type { CartLine, OrderItem, Settings } from "@/lib/types";

export class CartError extends Error {}

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Sepeti VERİTABANI fiyatlarıyla yeniden hesaplar. Tarayıcıdan gelen hiçbir fiyat kullanılmaz.
 * Pasif ürün, fiyatsız/stoksuz varyant veya pasif paket varsa hata verir.
 */
export async function priceCart(lines: CartLine[]): Promise<{ items: OrderItem[]; subtotal: number; shipping: number; total: number; settings: Settings }> {
  const clean = lines
    .filter((l) => l && (l.kind === "variant" || l.kind === "bundle") && typeof l.id === "string")
    .map((l) => ({ kind: l.kind, id: l.id, qty: Math.floor(Number(l.qty)) }));
  if (clean.length === 0) throw new CartError("Sepetin boş.");
  if (clean.length > 40) throw new CartError("Sepette çok fazla satır var.");
  if (clean.some((l) => !(l.qty >= 1 && l.qty <= 50))) throw new CartError("Ürün adedi 1 ile 50 arasında olmalı.");

  const db = serviceClient();
  const variantIds = clean.filter((l) => l.kind === "variant").map((l) => l.id);
  const bundleIds = clean.filter((l) => l.kind === "bundle").map((l) => l.id);

  const [{ data: variants, error: ve }, { data: bundles, error: be }, settings] = await Promise.all([
    variantIds.length
      ? db.from("product_variants").select("id, label, price, in_stock, product:products(name, active)").in("id", variantIds)
      : Promise.resolve({ data: [], error: null }),
    bundleIds.length
      ? db.from("bundles").select("id, name, price, active").in("id", bundleIds)
      : Promise.resolve({ data: [], error: null }),
    getSettings(),
  ]);
  if (ve || be) throw new Error("Fiyatlar okunamadı");

  type VRow = { id: string; label: string; price: number; in_stock: boolean; product: { name: string; active: boolean } | null };
  type BRow = { id: string; name: string; price: number; active: boolean };

  const items: OrderItem[] = clean.map((l) => {
    if (l.kind === "variant") {
      const v = (variants as unknown as VRow[]).find((x) => x.id === l.id);
      const price = Number(v?.price);
      if (!v || !v.product?.active || !v.in_stock || !(price > 0)) throw new CartError("Sepetteki bir ürün artık satışta değil. Sepetini güncelleyip tekrar dene.");
      return { kind: "variant", id: v.id, name: v.product.name, label: v.label, qty: l.qty, unit_price: price, line_total: round2(price * l.qty) };
    }
    const b = (bundles as BRow[]).find((x) => x.id === l.id);
    const price = Number(b?.price);
    if (!b || !b.active || !(price > 0)) throw new CartError("Sepetteki paket artık satışta değil. Sepetini güncelleyip tekrar dene.");
    return { kind: "bundle", id: b.id, name: b.name, label: "Paket", qty: l.qty, unit_price: price, line_total: round2(price * l.qty) };
  });

  const subtotal = round2(items.reduce((t, i) => t + i.line_total, 0));
  if (subtotal < settings.min_order_amount) throw new CartError(`En az ${settings.min_order_amount} TL tutarında sipariş verilebilir.`);
  const shipping = subtotal >= settings.free_shipping_threshold ? 0 : settings.shipping_fee;
  return { items, subtotal, shipping, total: round2(subtotal + shipping), settings };
}
