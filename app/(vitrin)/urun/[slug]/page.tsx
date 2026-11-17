import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductBuy, ProductGallery } from "@/components/ProductBuy";
import { ShelfItem } from "@/components/ShelfItem";
import { getProduct, getProducts, getSettings } from "@/lib/catalog";
import { toCard } from "@/lib/cards";
import { imageUrl, sellable, surfaceName } from "@/lib/shared";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const p = await getProduct((await params).slug);
  if (!p) return { title: "Ürün bulunamadı" };
  const img = p.images[0] ? imageUrl(p.images[0].path) : undefined;
  return {
    title: p.name,
    description: p.tagline ?? undefined,
    openGraph: { title: p.name, description: p.tagline ?? undefined, images: img ? [img] : undefined },
  };
}

export default async function UrunSayfasi({ params }: { params: Params }) {
  const { slug } = await params;
  const [p, all, settings] = await Promise.all([getProduct(slug), getProducts(), getSettings()]);
  if (!p || !p.variants.some(sellable)) notFound();

  const images = p.images.map((i) => ({ src: imageUrl(i.path), alt: i.alt ?? p.name }));
  const card = toCard(p);
  const related = all
    .filter((x) => x.id !== p.id && x.surfaces.some((s) => p.surfaces.includes(s)))
    .slice(0, 4)
    .map(toCard);
  const variants = p.variants
    .filter((v) => v.price > 0)
    .map((v) => ({ id: v.id, label: v.label, price: v.price, compare_at_price: v.compare_at_price, sellable: sellable(v) }));

  const minPrice = Math.min(...variants.filter((v) => v.sellable).map((v) => v.price));
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.tagline ?? undefined,
    image: images.map((i) => i.src),
    brand: { "@type": "Brand", name: "Prolinex" },
    offers: { "@type": "AggregateOffer", priceCurrency: "TRY", lowPrice: minPrice, offerCount: variants.length, availability: "https://schema.org/InStock" },
  };

  return (
    <div style={{ ["--liquid" as string]: p.color }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <div className="wrap pdp">
        <ProductGallery images={images} name={p.name} />
        <div className="pdp-buy">
          <nav aria-label="Konum" className="muted" style={{ fontSize: 14, marginBottom: 14 }}>
            <Link href="/urunler" className="link" style={{ fontWeight: 500 }}>Ürünler</Link>
            {p.category && <> / <Link href={`/urunler?kategori=${p.category.slug}`} className="link" style={{ fontWeight: 500 }}>{p.category.name}</Link></>}
          </nav>
          <h1 className="display pdp-name">{p.name}</h1>
          {p.tagline && <p className="pdp-tag">{p.tagline}</p>}
          <ProductBuy product={{ slug: p.slug, name: p.name, color: p.color, image: card.image }} variants={variants} minOrder={settings.min_order_amount} />

          <div className="pdp-facts">
            {p.description && (
              <details open>
                <summary>Ne yapar?</summary>
                <div className="body">{p.description.split(/\n\n+/).map((para, i) => <p key={i}>{para}</p>)}</div>
              </details>
            )}
            {p.usage && (
              <details>
                <summary>Nasıl kullanılır?</summary>
                <div className="body"><p>{p.usage}</p></div>
              </details>
            )}
            {p.ingredients.length > 0 && (
              <details>
                <summary>İçerik</summary>
                <div className="body">
                  <p>{p.ingredients.join(", ")}. Fosfat, klor ve amonyak içermez.</p>
                </div>
              </details>
            )}
            <details>
              <summary>Kargo ve iade</summary>
              <div className="body">
                <p>Sipariş aynı gün hazırlanır, 1–3 iş gününde teslim edilir. {settings.free_shipping_threshold} TL üzeri kargo ücretsizdir.</p>
                <p>Teslimattan itibaren 14 gün içinde cayma hakkın var. <Link className="link" href="/iade">İade koşulları</Link></p>
              </div>
            </details>
          </div>
          {p.surfaces.length > 0 && (
            <div className="surface-tags">
              {p.surfaces.map((s) => <Link key={s} href={`/urunler?yuzey=${s}`}>{surfaceName(s)}</Link>)}
            </div>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section className="band" aria-labelledby="birlikte-baslik">
          <div className="wrap">
            <div className="band-head"><h2 id="birlikte-baslik">Aynı yüzeyler için</h2></div>
            <div className="shelf">{related.map((r) => <ShelfItem key={r.slug} p={r} />)}</div>
          </div>
        </section>
      )}
    </div>
  );
}
