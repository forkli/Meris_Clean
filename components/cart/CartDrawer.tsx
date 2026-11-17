"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { useCart } from "./CartProvider";
import { Close } from "@/components/icons";
import { formatTL } from "@/lib/shared";

export function CartDrawer() {
  const { items, open, setOpen, setQty, remove, totals, settings } = useCart();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "Tab" && panelRef.current) {
        const f = panelRef.current.querySelectorAll<HTMLElement>("a[href],button:not([disabled])");
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
      prev?.focus();
    };
  }, [open, setOpen]);

  const progress = settings.free_shipping_threshold > 0 ? Math.min(100, (totals.subtotal / settings.free_shipping_threshold) * 100) : 100;

  return (
    <>
      <div className="drawer-backdrop" data-open={open} onClick={() => setOpen(false)} aria-hidden="true" />
      <div ref={panelRef} className="drawer" data-open={open} role="dialog" aria-modal="true" aria-labelledby="sepet-baslik" inert={!open}>
        <div className="drawer-head">
          <h2 id="sepet-baslik">Sepetin</h2>
          <button ref={closeRef} className="icon-btn" onClick={() => setOpen(false)} aria-label="Sepeti kapat">
            <Close />
          </button>
        </div>

        <div className="drawer-body">
          {items.length === 0 ? (
            <div className="drawer-empty">
              <p className="muted">Sepetin boş. Hangi yüzeyi temizleyeceğini seç, sana uygun ürünü bul.</p>
              <Link href="/urunler" className="btn" onClick={() => setOpen(false)}>Ürünlere bak</Link>
            </div>
          ) : (
            <ul role="list">
              {items.map((i) => (
                <li key={i.kind + i.id} className="line" style={{ ["--item" as string]: i.color }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={i.image} alt="" loading="lazy" />
                  <div>
                    <Link href={i.href} onClick={() => setOpen(false)} style={{ textDecoration: "none" }}>
                      <strong>{i.name}</strong>
                    </Link>
                    <span className="sub">{i.label} · {formatTL(i.price)}</span>
                    <div className="qty" role="group" aria-label={`${i.name} adedi`}>
                      <button onClick={() => setQty(i.kind, i.id, i.qty - 1)} aria-label="Bir azalt">−</button>
                      <output aria-live="polite">{i.qty}</output>
                      <button onClick={() => setQty(i.kind, i.id, i.qty + 1)} aria-label="Bir artır" disabled={i.qty >= 50}>+</button>
                    </div>
                  </div>
                  <div className="line-end">
                    <span>{formatTL(i.price * i.qty)}</span>
                    <button className="line-remove" onClick={() => remove(i.kind, i.id)}>Çıkar</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="drawer-foot">
            <div className="meter" aria-hidden="true"><i style={{ width: `${progress}%` }} /></div>
            <p className="meter-note">
              {totals.freeLeft > 0 ? <>Kargonun ücretsiz olmasına {formatTL(totals.freeLeft)} kaldı.</> : <>Kargo ücretsiz.</>}
            </p>
            <div className="sum-row"><span>Ürünler</span><span>{formatTL(totals.subtotal)}</span></div>
            <div className="sum-row"><span>Kargo</span><span>{totals.shipping === 0 ? "Ücretsiz" : formatTL(totals.shipping)}</span></div>
            <div className="sum-row total"><span>Toplam</span><span>{formatTL(totals.total)}</span></div>
            {totals.minLeft > 0 ? (
              <>
                <p className="meter-note" style={{ marginTop: 10 }}>
                  En az {formatTL(settings.min_order_amount)} tutarında sipariş verebilirsin. {formatTL(totals.minLeft)} daha ekle.
                </p>
                <button className="btn btn-block" disabled>Ödemeye geç</button>
              </>
            ) : (
              <Link href="/odeme" className="btn btn-block" style={{ marginTop: 14 }} onClick={() => setOpen(false)}>
                Ödemeye geç
              </Link>
            )}
          </div>
        )}
      </div>
    </>
  );
}
