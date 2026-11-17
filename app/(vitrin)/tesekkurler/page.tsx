import type { Metadata } from "next";
import Link from "next/link";
import { ClearCart } from "./ClearCart";

export const metadata: Metadata = { title: "Siparişin alındı", robots: { index: false } };

type SP = Promise<{ siparis?: string }>;

export default async function Tesekkurler({ searchParams }: { searchParams: SP }) {
  const { siparis } = await searchParams;
  return (
    <div className="wrap prose">
      <ClearCart />
      <h1>Siparişin alındı.</h1>
      {siparis && <p>Sipariş numaran: <strong className="num">{siparis}</strong></p>}
      <p>Ödemen onaylandı. Siparişini bugün hazırlayıp kargoya veriyoruz; 1–3 iş günü içinde kapında olur. Kargo takip numarasını telefonuna göndereceğiz.</p>
      <p>Bir sorun olursa <a className="link" href="https://wa.me/905523953548">WhatsApp’tan</a> ya da <a className="link" href="mailto:info@merisclean.com">info@merisclean.com</a> adresinden yaz.</p>
      <p style={{ marginTop: 28 }}><Link href="/urunler" className="btn">Alışverişe devam et</Link></p>
    </div>
  );
}
