import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BundleBuy } from "@/components/BundleBuy";
import { getBundle } from "@/lib/catalog";
import { formatTL, imageUrl } from "@/lib/shared";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const b = await getBundle((await params).slug);
  return b ? { title: b.name, description: b.description ?? undefined } : { title: "Paket bulunamadı" };
}

export default async function PaketSayfasi({ params }: { params: Params }) {
  const b = await getBundle((await params).slug);
  if (!b || b.items.length === 0) notFound();

  const items = b.items.map((i) => {
    const img = i.variant.product.images.find((x) => x.path.includes("-sise")) ?? i.variant.product.images[0];
    return { ...i, src: img ? imageUrl(img.path) : "" };
  });
  const listTotal = items.reduce((t, i) => t + Number(i.variant.price) * i.quantity, 0);
  const count = items.reduce((t, i) => t + i.quantity, 0);

  return (
    <div className="wrap" style={{ paddingBottom: 120 }}>
      <div className="pdp">
        <div className="pdp-media">
          <div className="pdp-main pdp-main--bundle">
            <div className="bundle-row">
              {items.map((i) => i.src && <Image key={i.variant_id} src={i.src} alt={i.variant.product.name} width={300} height={420} priority />)}
            </div>
          </div>
        </div>
        <div className="pdp-buy">
          <h1 className="display pdp-name">{b.name}</h1>
          {b.description && <p className="pdp-tag">{b.description}</p>}
          {listTotal > b.price && <p className="muted" style={{ marginTop: 18 }}>Ayrı ayrı alırsan {formatTL(listTotal)}; pakette {formatTL(listTotal - b.price)} daha az ödersin.</p>}
          <BundleBuy bundle={{ id: b.id, slug: b.slug, name: b.name, price: b.price, image: items[0]?.src ?? "", count }} />
          <div className="pdp-facts">
            <details open>
              <summary>Pakette ne var?</summary>
              <ul className="body" role="list" style={{ gap: 0 }}>
                {items.map((i) => (
                  <li key={i.variant_id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderTop: "1px solid var(--mist)" }}>
                    <Link className="link" href={`/urun/${i.variant.product.slug}`}>{i.variant.product.name}</Link>
                    <span>{i.quantity} × {i.variant.label}</span>
                  </li>
                ))}
              </ul>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
}
