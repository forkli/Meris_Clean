import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { formatTL } from "@/lib/shared";
import type { OrderItem } from "@/lib/types";
import { EDITABLE, STATUS, statusTone } from "../status";

type Params = Promise<{ id: string }>;
type SP = Promise<{ kaydedildi?: string }>;

async function updateOrder(fd: FormData) {
  "use server";
  const { db } = await requireAdmin();
  const id = String(fd.get("id"));
  const status = String(fd.get("status"));
  if (!(EDITABLE as readonly string[]).includes(status)) return;
  await db
    .from("orders")
    .update({
      status,
      tracking_no: String(fd.get("tracking_no") ?? "").trim() || null,
      note: String(fd.get("note") ?? "").trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  revalidatePath("/panel/siparisler");
  redirect(`/panel/siparisler/${encodeURIComponent(id)}?kaydedildi=1`);
}

export default async function SiparisDetay({ params, searchParams }: { params: Params; searchParams: SP }) {
  const { db } = await requireAdmin();
  const { id } = await params;
  const { kaydedildi } = await searchParams;
  const { data: o } = await db.from("orders").select("*").eq("id", decodeURIComponent(id)).maybeSingle();
  if (!o) notFound();
  const items = (o.items ?? []) as OrderItem[];
  const paid = !["odeme_bekleniyor", "odeme_basarisiz"].includes(o.status);

  return (
    <>
      <div className="pn-head">
        <h1 className="num">{o.id}</h1>
        <span className="badge" data-tone={statusTone(o.status)}>{STATUS[o.status as keyof typeof STATUS] ?? o.status}</span>
      </div>
      {kaydedildi && <p className="alert alert-ok" style={{ marginBottom: 16 }}>Sipariş güncellendi.</p>}
      <div className="pn-grid-2">
        <div>
          <section className="pn-card">
            <h2>Ürünler</h2>
            <table className="pn-table">
              <tbody>
                {items.length > 0
                  ? items.map((i, k) => (
                      <tr key={k}><td>{i.name} <span className="muted">({i.label})</span></td><td className="num">{i.qty} × {formatTL(i.unit_price)}</td><td className="num" style={{ textAlign: "right", fontWeight: 700 }}>{formatTL(i.line_total)}</td></tr>
                    ))
                  : <tr><td colSpan={3}>{o.product_name} × {o.quantity}</td></tr>}
                <tr><td colSpan={2}>Kargo</td><td className="num" style={{ textAlign: "right" }}>{formatTL(Number(o.shipping_fee ?? 0))}</td></tr>
                <tr><td colSpan={2} style={{ fontWeight: 700 }}>Toplam</td><td className="num" style={{ textAlign: "right", fontWeight: 700 }}>{formatTL(Number(o.total_price))}</td></tr>
              </tbody>
            </table>
            <p className="muted" style={{ fontSize: 13, marginTop: 10 }}>
              {o.paid_at ? `Ödeme: ${new Date(o.paid_at).toLocaleString("tr-TR")} · iyzico no: ${o.payment_id}` : paid ? `iyzico no: ${o.payment_id ?? "—"}` : "Bu sipariş için ödeme alınmadı."}
            </p>
          </section>
          <section className="pn-card">
            <h2>Teslimat</h2>
            <p><strong>{o.buyer_name}</strong></p>
            <p><a className="link" href={`tel:${o.buyer_phone}`}>{o.buyer_phone}</a> · <a className="link" href={`mailto:${o.buyer_email}`}>{o.buyer_email}</a></p>
            <p style={{ marginTop: 8 }}>{o.buyer_address}{o.district ? `, ${o.district}` : ""}{o.city ? ` / ${o.city}` : ""}</p>
          </section>
        </div>
        <section className="pn-card">
          <h2>Durum ve kargo</h2>
          {paid ? (
            <form action={updateOrder} style={{ display: "grid", gap: 14 }}>
              <input type="hidden" name="id" value={o.id} />
              <div className="field">
                <label htmlFor="status">Durum</label>
                <select id="status" name="status" className="select" defaultValue={o.status}>
                  {EDITABLE.map((s) => <option key={s} value={s}>{STATUS[s]}</option>)}
                </select>
              </div>
              <div className="field">
                <label htmlFor="tracking_no">Kargo takip no</label>
                <input id="tracking_no" name="tracking_no" className="input" defaultValue={o.tracking_no ?? ""} />
              </div>
              <div className="field">
                <label htmlFor="note">Not (yalnızca sen görürsün)</label>
                <textarea id="note" name="note" className="textarea" defaultValue={o.note ?? ""} />
              </div>
              <button className="btn">Kaydet</button>
            </form>
          ) : (
            <p className="muted">Ödemesi tamamlanmamış siparişlerin durumu değiştirilemez. Müşteri ödemeyi tamamlarsa otomatik olarak “Yeni” durumuna geçer.</p>
          )}
          <p style={{ marginTop: 16 }}><Link className="link" href="/panel/siparisler">Siparişlere dön</Link></p>
        </section>
      </div>
    </>
  );
}
