"use client";

import { useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { formatTL } from "@/lib/shared";

export function BundleBuy({ bundle }: { bundle: { id: string; slug: string; name: string; price: number; image: string; count: number } }) {
  const { add, setOpen } = useCart();
  const [qty, setQty] = useState(1);
  return (
    <>
      <div className="pdp-price"><strong>{formatTL(bundle.price * qty)}</strong>{qty > 1 && <span className="muted">{qty} paket</span>}</div>
      <div className="buy-row">
        <div className="qty" role="group" aria-label="Paket adedi">
          <button onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} aria-label="Bir azalt">−</button>
          <output aria-live="polite">{qty}</output>
          <button onClick={() => setQty((q) => Math.min(20, q + 1))} aria-label="Bir artır">+</button>
        </div>
        <button
          className="btn"
          onClick={() => {
            add({ kind: "bundle", id: bundle.id, name: bundle.name, label: `${bundle.count} ürün`, price: bundle.price, image: bundle.image, color: "#0E4C5A", href: `/paket/${bundle.slug}` }, qty);
            setOpen(true);
          }}
        >
          Paketi sepete ekle
        </button>
      </div>
    </>
  );
}
