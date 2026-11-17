"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { formatTL } from "@/lib/shared";

const FIELDS = [
  { name: "name", label: "Ad soyad", auto: "name", type: "text", full: true },
  { name: "email", label: "E-posta", auto: "email", type: "email", hint: "Sipariş özetini buraya göndeririz." },
  { name: "phone", label: "Telefon", auto: "tel", type: "tel", hint: "Kargo bilgisi için." },
  { name: "address", label: "Açık adres", auto: "street-address", type: "textarea", full: true },
  { name: "district", label: "İlçe", auto: "address-level2", type: "text" },
  { name: "city", label: "İl", auto: "address-level1", type: "text" },
  { name: "tckn", label: "T.C. kimlik no (isteğe bağlı)", auto: "off", type: "text", full: true, hint: "Faturanın kimlik numaranla kesilmesini istersen yaz." },
] as const;

export function OdemeForm() {
  const { items, totals, settings, ready } = useCart();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!ready) return <p className="muted">Sepet yükleniyor…</p>;
  if (items.length === 0)
    return (
      <div style={{ display: "grid", gap: 16, justifyItems: "start" }}>
        <p className="lead">Sepetin boş, ödenecek bir şey yok.</p>
        <Link href="/urunler" className="btn">Ürünlere bak</Link>
      </div>
    );

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const buyer = Object.fromEntries(FIELDS.map((f) => [f.name, String(fd.get(f.name) ?? "")]));
    setBusy(true);
    try {
      const res = await fetch("/api/odeme/baslat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lines: items.map((i) => ({ kind: i.kind, id: i.id, qty: i.qty })), buyer, consent: fd.get("consent") === "on" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.paymentPageUrl) {
        setError(data.error ?? "Ödeme başlatılamadı. Biraz sonra tekrar dene.");
        setBusy(false);
        return;
      }
      window.location.href = data.paymentPageUrl;
    } catch {
      setError("Bağlantı kurulamadı. İnternetini kontrol edip tekrar dene.");
      setBusy(false);
    }
  }

  const blocked = totals.minLeft > 0;

  return (
    <div className="checkout">
      <form onSubmit={submit} noValidate={false} aria-describedby={error ? "odeme-hata" : undefined}>
        <h1 className="display" style={{ fontSize: "clamp(56px, 8vw, 104px)", marginBottom: 28 }}>Teslimat</h1>
        <div className="form-grid">
          {FIELDS.map((f) => (
            <div key={f.name} className={`field${"full" in f && f.full ? " full" : ""}`}>
              <label htmlFor={f.name}>{f.label}</label>
              {f.type === "textarea" ? (
                <textarea id={f.name} name={f.name} className="textarea" autoComplete={f.auto} required minLength={10} />
              ) : (
                <input
                  id={f.name}
                  name={f.name}
                  type={f.type}
                  className="input"
                  autoComplete={f.auto}
                  required={f.name !== "tckn"}
                  inputMode={f.name === "tckn" ? "numeric" : f.type === "tel" ? "tel" : undefined}
                  pattern={f.name === "tckn" ? "\\d{11}" : undefined}
                  placeholder={f.name === "phone" ? "05xx xxx xx xx" : undefined}
                />
              )}
              {"hint" in f && f.hint && <span className="hint">{f.hint}</span>}
            </div>
          ))}
          <label className="check full">
            <input type="checkbox" name="consent" required />
            <span>
              <Link className="link" href="/mesafeli-satis" target="_blank">Mesafeli satış sözleşmesini</Link> ve{" "}
              <Link className="link" href="/iade" target="_blank">iade koşullarını</Link> okudum, onaylıyorum.{" "}
              Kişisel verilerim <Link className="link" href="/kvkk" target="_blank">KVKK aydınlatma metnine</Link> göre işlenir.
            </span>
          </label>
        </div>
        {error && <p id="odeme-hata" className="alert alert-error" role="alert" style={{ marginTop: 20 }}>{error}</p>}
        <button className="btn btn-block" style={{ marginTop: 24 }} disabled={busy || blocked}>
          {busy ? "Ödeme sayfası açılıyor…" : `Kartla öde · ${formatTL(totals.total)}`}
        </button>
        <p className="muted" style={{ fontSize: 14, marginTop: 12 }}>
          Kart bilgilerini iyzico’nun güvenli sayfasında gireceksin; kart numaran bizim sunucumuza hiç gelmez.
        </p>
      </form>

      <aside className="checkout-summary" aria-label="Sipariş özeti">
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>Siparişin</h2>
        <ul role="list">
          {items.map((i) => (
            <li key={i.kind + i.id} className="line" style={{ ["--item" as string]: i.color, gridTemplateColumns: "48px 1fr auto" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={i.image} alt="" style={{ width: 48, height: 58 }} />
              <div><strong>{i.name}</strong><span className="sub">{i.label} · {i.qty} adet</span></div>
              <span className="num" style={{ fontWeight: 700 }}>{formatTL(i.price * i.qty)}</span>
            </li>
          ))}
        </ul>
        <div style={{ paddingTop: 12 }}>
          <div className="sum-row"><span>Ürünler</span><span>{formatTL(totals.subtotal)}</span></div>
          <div className="sum-row"><span>Kargo</span><span>{totals.shipping === 0 ? "Ücretsiz" : formatTL(totals.shipping)}</span></div>
          <div className="sum-row total"><span>Toplam</span><span>{formatTL(totals.total)}</span></div>
          {blocked && <p className="alert alert-error" style={{ marginTop: 12 }}>En az {formatTL(settings.min_order_amount)} tutarında sipariş verilebilir. {formatTL(totals.minLeft)} daha ekle.</p>}
        </div>
      </aside>
    </div>
  );
}
