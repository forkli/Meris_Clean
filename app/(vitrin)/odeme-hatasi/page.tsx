import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Ödeme tamamlanamadı", robots: { index: false } };

export default function OdemeHatasi() {
  return (
    <div className="wrap prose">
      <h1>Ödeme tamamlanamadı.</h1>
      <p>Kartından para çekilmedi. Bu genellikle banka onayının (3D Secure) tamamlanmamasından ya da kart limitinden olur.</p>
      <p>Sepetin duruyor; tekrar deneyebilir ya da başka bir kart kullanabilirsin.</p>
      <p style={{ marginTop: 28, display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Link href="/odeme" className="btn">Tekrar dene</Link>
        <a href="https://wa.me/905523953548" className="btn btn-line">WhatsApp’tan yaz</a>
      </p>
    </div>
  );
}
