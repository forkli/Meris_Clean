"use client";

import Image from "next/image";
import { useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { formatTL } from "@/lib/shared";

type V = { id: string; label: string; price: number; compare_at_price: number | null; sellable: boolean };
type Img = { src: string; alt: string };

export function ProductGallery({ images, name }: { images: Img[]; name: string }) {
  const [i, setI] = useState(0);
  const cur = images[i] ?? images[0];
  return (
    <div className="pdp-media">
      <div className="pdp-main">
        {cur && <Image src={cur.src} alt={cur.alt || name} width={900} height={1125} sizes="(max-width: 860px) 100vw, 55vw" priority />}
      </div>
      {images.length > 1 && (
        <div className="pdp-thumbs" role="group" aria-label="Ürün görselleri">
          {images.map((im, k) => (
            <button key={im.src} aria-pressed={k === i} onClick={() => setI(k)} aria-label={`Görsel ${k + 1}`}>
              <Image src={im.src} alt="" width={76} height={92} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function ProductBuy({
  product,
  variants,
  minOrder,
}: {
  product: { slug: string; name: string; color: string; image: string };
  variants: V[];
  minOrder: number;
}) {
  const { add, setOpen } = useCart();
  const first = variants.find((v) => v.sellable) ?? variants[0];
  const [vid, setVid] = useState(first?.id);
  const [qty, setQty] = useState(1);
  const v = variants.find((x) => x.id === vid) ?? first;
  if (!v) return null;

  function addToCart() {
    add({ kind: "variant", id: v.id, name: product.name, label: v.label, price: v.price, image: product.image, color: product.color, href: `/urun/${product.slug}` }, qty);
    setOpen(true);
  }

  return (
    <>
      <div className="pdp-price">
        <strong>{formatTL(v.price * qty)}</strong>
        {v.compare_at_price && v.compare_at_price > v.price && <s>{formatTL(v.compare_at_price * qty)}</s>}
        {qty > 1 && <span className="muted">{qty} × {formatTL(v.price)}</span>}
      </div>
      {variants.length > 1 && (
        <div className="variant-row" role="group" aria-label="Boyut">
          {variants.map((x) => (
            <button key={x.id} className="variant" aria-pressed={x.id === v.id} disabled={!x.sellable} onClick={() => setVid(x.id)}>
              {x.label}
            </button>
          ))}
        </div>
      )}
      <div className="buy-row">
        <div className="qty" role="group" aria-label="Adet">
          <button onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} aria-label="Bir azalt">−</button>
          <output aria-live="polite">{qty}</output>
          <button onClick={() => setQty((q) => Math.min(50, q + 1))} aria-label="Bir artır">+</button>
        </div>
        <button className="btn btn-liquid" onClick={addToCart} disabled={!v.sellable}>
          Sepete ekle
        </button>
      </div>
      <p className="pdp-note">En az {formatTL(minOrder)} tutarında sipariş verilebilir; farklı ürünleri sepette birleştirebilirsin.</p>
    </>
  );
}
