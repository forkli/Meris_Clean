import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { formatTL } from "@/lib/shared";
import { STATUS, statusTone } from "./status";

type SP = Promise<{ durum?: string; q?: string }>;

export default async function Siparisler({ searchParams }: { searchParams: SP }) {
  const { db } = await requireAdmin();
  const { durum, q } = await searchParams;

  let query = db.from("orders").select("id, buyer_name, buyer_phone, product_name, total_price, status, created_at").order("created_at", { ascending: false }).limit(200);
  if (durum === "tumu") {
    /* hepsi */
  } else if (durum) query = query.eq("status", durum);
  else query = query.not("status", "in", "(odeme_bekleniyor,odeme_basarisiz)");
  if (q) query = query.or(`id.ilike.%${q.replace(/[%,()]/g, "")}%,buyer_name.ilike.%${q.replace(/[%,()]/g, "")}%`);
  const { data: orders } = await query;

  const { data: counts } = await db.from("orders").select("status");
  const count = (s: string) => (counts ?? []).filter((o) => o.status === s).length;

  return (
    <>
      <div className="pn-head"><h1>Siparişler</h1></div>
      <form className="pn-tabs" role="search">
        <input name="q" defaultValue={q} className="input" placeholder="Sipariş no ya da müşteri" style={{ maxWidth: 260, minHeight: 40 }} aria-label="Sipariş ara" />
        <Link className="chip" href="/panel/siparisler" aria-current={!durum ? "true" : undefined}>Ödenenler</Link>
        {Object.entries(STATUS).map(([k, label]) => (
          <Link key={k} className="chip" href={`/panel/siparisler?durum=${k}`} aria-current={durum === k ? "true" : undefined}>
            {label} ({count(k)})
          </Link>
        ))}
        <Link className="chip" href="/panel/siparisler?durum=tumu" aria-current={durum === "tumu" ? "true" : undefined}>Tümü</Link>
      </form>
      <div className="pn-card" style={{ padding: 0, overflowX: "auto" }}>
        <table className="pn-table">
          <thead>
            <tr><th>Sipariş</th><th>Müşteri</th><th className="hide-sm">Ürünler</th><th>Tutar</th><th>Durum</th><th className="hide-sm">Tarih</th></tr>
          </thead>
          <tbody>
            {(orders ?? []).map((o) => (
              <tr key={o.id}>
                <td><Link href={`/panel/siparisler/${o.id}`} className="link num">{o.id}</Link></td>
                <td>{o.buyer_name}<div className="muted" style={{ fontSize: 13 }}>{o.buyer_phone}</div></td>
                <td className="hide-sm" style={{ maxWidth: 320 }}>{o.product_name}</td>
                <td className="num" style={{ fontWeight: 700 }}>{formatTL(Number(o.total_price))}</td>
                <td><span className="badge" data-tone={statusTone(o.status)}>{STATUS[o.status as keyof typeof STATUS] ?? o.status}</span></td>
                <td className="hide-sm num">{new Date(o.created_at).toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" })}</td>
              </tr>
            ))}
            {(orders ?? []).length === 0 && <tr><td colSpan={6} className="muted" style={{ padding: 32, textAlign: "center" }}>Bu filtrede sipariş yok.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
