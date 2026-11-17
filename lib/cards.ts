import "server-only";
import type { Product } from "@/lib/types";
import { imageUrl, sellable } from "@/lib/shared";

/** Vitrinde ürün listelemek için gereken en küçük veri (istemciye bu gider). */
export type ProductCard = {
  slug: string;
  name: string;
  tagline: string | null;
  color: string;
  image: string;
  priceFrom: number;
  labels: string[];
  surfaces: string[];
  category: string | null;
};

export function toCard(p: Product): ProductCard {
  const sale = p.variants.filter(sellable);
  // Liste görselinde dekupe şişe tercih edilir (dosya adında "sise" geçen), yoksa ilk görsel.
  const img = p.images.find((i) => i.path.includes("-sise")) ?? p.images[0];
  return {
    slug: p.slug,
    name: p.name,
    tagline: p.tagline,
    color: p.color,
    image: img ? imageUrl(img.path) : "/img/urunler/yagcoz-sise.webp",
    priceFrom: sale.length ? Math.min(...sale.map((v) => v.price)) : 0,
    labels: sale.map((v) => v.label),
    surfaces: p.surfaces,
    category: p.category?.slug ?? null,
  };
}
