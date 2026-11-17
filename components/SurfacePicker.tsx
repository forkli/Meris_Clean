"use client";

import Link from "next/link";
import { useState } from "react";
import type { ProductCard } from "@/lib/cards";
import { SURFACES, formatTL } from "@/lib/shared";

export function SurfacePicker({ products }: { products: ProductCard[] }) {
  const available = SURFACES.filter((s) => products.some((p) => p.surfaces.includes(s.key)));
  const [active, setActive] = useState<string>(available[0]?.key ?? "mutfak");
  const list = products.filter((p) => p.surfaces.includes(active));
  const activeName = SURFACES.find((s) => s.key === active)?.name ?? "";

  return (
    <div className="surface">
      <div className="surface-list" role="group" aria-label="Temizlenecek yüzey">
        {available.map((s) => {
          const n = products.filter((p) => p.surfaces.includes(s.key)).length;
          return (
            <button key={s.key} className="surface-word" aria-pressed={active === s.key} onClick={() => setActive(s.key)}>
              {s.name}
              <small>{n} ürün</small>
            </button>
          );
        })}
      </div>
      <div className="surface-panel" aria-live="polite">
        <h3>{activeName} için</h3>
        <div className="surface-items" key={active}>
          {list.length === 0 && <p className="surface-empty">Bu yüzey için ürün yakında.</p>}
          {list.map((p) => (
            <Link key={p.slug} href={`/urun/${p.slug}`} className="surface-item" style={{ ["--item" as string]: p.color }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.image} alt="" loading="lazy" />
              <div>
                <strong>{p.name}</strong>
                {p.tagline && <span>{p.tagline}</span>}
              </div>
              <span className="price">{formatTL(p.priceFrom)}</span>
            </Link>
          ))}
        </div>
        <p style={{ marginTop: 20 }}>
          <Link className="link" href={`/urunler?yuzey=${active}`}>{activeName} ürünlerinin hepsi</Link>
        </p>
      </div>
    </div>
  );
}
