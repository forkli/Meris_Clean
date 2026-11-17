import Link from "next/link";
import Image from "next/image";
import { FogHero } from "@/components/FogHero";
import { SurfacePicker } from "@/components/SurfacePicker";
import { ShelfItem } from "@/components/ShelfItem";
import { getBundles, getProducts, getSettings } from "@/lib/catalog";
import { toCard } from "@/lib/cards";
import { formatTL, imageUrl } from "@/lib/shared";

export default async function Home() {
  const [products, bundles, settings] = await Promise.all([getProducts(), getBundles(), getSettings()]);
  const cards = products.map(toCard);
  const featured = cards.filter((_, i) => products[i].featured);
  const heroBottles = (featured.length ? featured : cards).slice(0, 4).map((c) => ({ src: c.image, alt: c.name }));
  const bundle = bundles[0];
  const bundleList = bundle ? bundle.items.reduce((t, i) => t + Number(i.variant.price) * i.quantity, 0) : 0;

  return (
    <>
      <FogHero bottles={heroBottles} />

      <section className="band" aria-labelledby="yuzey-baslik">
        <div className="wrap">
          <div className="band-head">
            <h2 id="yuzey-baslik">Neyi temizleyeceksin?</h2>
            <p className="muted">Her yüzeyin kiri farklı. Bir oda seç, o yüzey için yapılmış ürünleri gör.</p>
          </div>
          <SurfacePicker products={cards} />
        </div>
      </section>

      {featured.length > 0 && (
        <section className="band-tight" aria-labelledby="raf-baslik">
          <div className="wrap">
            <div className="band-head">
              <h2 id="raf-baslik">En çok alınanlar</h2>
              <Link href="/urunler" className="link">Tüm ürünler ({cards.length})</Link>
            </div>
            <div className="shelf">
              {featured.map((p, i) => <ShelfItem key={p.slug} p={p} priority={i < 2} />)}
            </div>
          </div>
        </section>
      )}

      <section className="zero band" aria-labelledby="sifir-baslik">
        <div className="wrap">
          <h2 id="sifir-baslik" className="sr-only">İçermediği maddeler</h2>
          <div className="zero-grid">
            <div className="zero-cell"><span className="display">0</span><p>fosfat</p></div>
            <div className="zero-cell"><span className="display">0</span><p>klor</p></div>
            <div className="zero-cell"><span className="display">0</span><p>amonyak</p></div>
          </div>
          <p className="zero-foot">
            Prolinex formülleri bitkisel özlerle çalışır ve biyolojik olarak parçalanır. Eldivensiz kullanılabilir, temizlediği yüzeye zarar vermez.
          </p>
        </div>
      </section>

      {bundle && (
        <section className="band" aria-labelledby="paket-baslik">
          <div className="wrap bundle-band">
            <div className="bundle-row" aria-hidden="true">
              {bundle.items.map((i) => {
                const img = i.variant.product.images.find((x) => x.path.includes("-sise")) ?? i.variant.product.images[0];
                return img ? <Image key={i.variant_id} src={imageUrl(img.path)} alt="" width={300} height={420} /> : null;
              })}
            </div>
            <div>
              <h2 id="paket-baslik">{bundle.name}</h2>
              {bundle.description && <p className="lead" style={{ marginTop: 14 }}>{bundle.description}</p>}
              <div className="bundle-price">
                <strong>{formatTL(bundle.price)}</strong>
                {bundleList > bundle.price && <s>{formatTL(bundleList)}</s>}
              </div>
              <Link href={`/paket/${bundle.slug}`} className="btn">Paketi incele</Link>
            </div>
          </div>
        </section>
      )}

      <section className="band-tight" aria-label="Teslimat ve ödeme">
        <div className="wrap">
          <dl className="facts">
            <div><dt>1–3 iş günü</dt><dd>Sipariş aynı gün hazırlanır.</dd></div>
            <div><dt>{formatTL(settings.free_shipping_threshold)} üzeri kargo bedava</dt><dd>Altında kargo {formatTL(settings.shipping_fee)}.</dd></div>
            <div><dt>Güvenli ödeme</dt><dd>Kart bilgin iyzico üzerinden işlenir.</dd></div>
            <div><dt>Sorun mu var?</dt><dd><a className="link" href="https://wa.me/905523953548">WhatsApp’tan yaz</a></dd></div>
          </dl>
        </div>
      </section>
    </>
  );
}
