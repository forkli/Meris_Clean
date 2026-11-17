import type { Metadata } from "next";
import Link from "next/link";
import { ShelfItem } from "@/components/ShelfItem";
import { getCategories, getProducts } from "@/lib/catalog";
import { toCard } from "@/lib/cards";
import { SURFACES, surfaceName } from "@/lib/shared";

export const metadata: Metadata = {
  title: "Ürünler",
  description: "Mutfak, banyo, cam, zemin, halı ve araç için Prolinex doğal temizlik ürünleri.",
};

type SP = Promise<{ yuzey?: string; kategori?: string }>;

export default async function Urunler({ searchParams }: { searchParams: SP }) {
  const { yuzey, kategori } = await searchParams;
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);
  const cards = products.map(toCard);
  const list = cards.filter((c) => (!yuzey || c.surfaces.includes(yuzey)) && (!kategori || c.category === kategori));
  const cat = categories.find((c) => c.slug === kategori);
  const title = yuzey ? surfaceName(yuzey) : cat ? cat.name : "Ürünler";
  const usedSurfaces = SURFACES.filter((s) => cards.some((c) => c.surfaces.includes(s.key)));

  return (
    <div className="wrap" style={{ paddingBottom: 120 }}>
      <div className="catalog-head">
        <h1 className="display catalog-title">{title}</h1>
        <nav className="filters" aria-label="Yüzeye göre filtrele">
          <Link className="chip" href="/urunler" aria-current={!yuzey && !kategori ? "true" : undefined}>Hepsi</Link>
          {usedSurfaces.map((s) => (
            <Link key={s.key} className="chip" href={`/urunler?yuzey=${s.key}`} aria-current={yuzey === s.key ? "true" : undefined}>
              {s.name}
            </Link>
          ))}
        </nav>
      </div>
      {list.length === 0 ? (
        <p className="lead">Bu seçimde satışta ürün yok. <Link className="link" href="/urunler">Tüm ürünlere dön</Link>.</p>
      ) : (
        <div className="catalog-grid">
          {list.map((p, i) => <ShelfItem key={p.slug} p={p} priority={i < 4} />)}
        </div>
      )}
    </div>
  );
}
