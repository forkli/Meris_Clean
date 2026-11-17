import Link from "next/link";

export default function NotFound() {
  return (
    <main className="wrap prose">
      <h1>Bu sayfa silinmiş.</h1>
      <p>Aradığın sayfa yok ya da ürün satıştan kalktı.</p>
      <p style={{ marginTop: 24 }}><Link href="/urunler" className="btn">Ürünlere dön</Link></p>
    </main>
  );
}
