import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { formatTL } from "@/lib/shared";

export default async function Paketler() {
  const { db } = await requireAdmin();
  const { data } = await db.from("bundles").select("id, slug, name, price, active, items:bundle_items(quantity)").order("sort");
  return (
    <>
      <div className="pn-head">
        <h1>Paketler</h1>
        <Link href="/panel/paketler/yeni" className="btn btn-sm">Yeni paket</Link>
      </div>
      <div className="pn-card" style={{ padding: 0 }}>
        <table className="pn-table">
          <thead><tr><th>Paket</th><th>Ürün sayısı</th><th>Fiyat</th><th>Durum</th></tr></thead>
          <tbody>
            {(data ?? []).map((b) => (
              <tr key={b.id}>
                <td><Link className="link" href={`/panel/paketler/${b.id}`}>{b.name}</Link></td>
                <td className="num">{(b.items as { quantity: number }[]).reduce((t, i) => t + i.quantity, 0)}</td>
                <td className="num">{formatTL(Number(b.price))}</td>
                <td><span className="badge" data-tone={b.active ? "ok" : "off"}>{b.active ? "Yayında" : "Taslak"}</span></td>
              </tr>
            ))}
            {(data ?? []).length === 0 && <tr><td colSpan={4} className="muted" style={{ padding: 32, textAlign: "center" }}>Henüz paket yok.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
