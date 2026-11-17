import { redirect } from "next/navigation";
import { requireAdmin, refreshStorefront } from "@/lib/admin";

type SP = Promise<{ kaydedildi?: string; hata?: string }>;

async function save(fd: FormData) {
  "use server";
  const { db } = await requireAdmin();
  const n = (k: string) => Number(String(fd.get(k) ?? "").replace(",", "."));
  const row = { shipping_fee: n("shipping_fee"), free_shipping_threshold: n("free_shipping_threshold"), min_order_amount: n("min_order_amount") };
  if (Object.values(row).some((v) => !Number.isFinite(v) || v < 0)) redirect("/panel/ayarlar?hata=1");
  await db.from("settings").update({ ...row, updated_at: new Date().toISOString() }).eq("id", 1);
  refreshStorefront();
  redirect("/panel/ayarlar?kaydedildi=1");
}

export default async function Ayarlar({ searchParams }: { searchParams: SP }) {
  const { db } = await requireAdmin();
  const { kaydedildi, hata } = await searchParams;
  const { data: s } = await db.from("settings").select("*").eq("id", 1).single();

  return (
    <>
      <div className="pn-head"><h1>Kargo & ayarlar</h1></div>
      {kaydedildi && <p className="alert alert-ok" style={{ marginBottom: 16 }}>Kaydedildi; sitedeki sepet ve ödeme hesapları güncellendi.</p>}
      {hata && <p className="alert alert-error" style={{ marginBottom: 16 }}>Tutarlar sıfır ya da pozitif bir sayı olmalı.</p>}
      <form action={save} className="pn-card" style={{ maxWidth: 560, display: "grid", gap: 16 }}>
        <div className="field">
          <label htmlFor="shipping_fee">Kargo ücreti (TL)</label>
          <input id="shipping_fee" name="shipping_fee" className="input" inputMode="decimal" defaultValue={Number(s?.shipping_fee ?? 60)} />
        </div>
        <div className="field">
          <label htmlFor="free_shipping_threshold">Ücretsiz kargo sınırı (TL)</label>
          <input id="free_shipping_threshold" name="free_shipping_threshold" className="input" inputMode="decimal" defaultValue={Number(s?.free_shipping_threshold ?? 1000)} />
          <span className="hint">Sepet bu tutara ulaşınca kargo ücretsiz olur.</span>
        </div>
        <div className="field">
          <label htmlFor="min_order_amount">En düşük sipariş tutarı (TL)</label>
          <input id="min_order_amount" name="min_order_amount" className="input" inputMode="decimal" defaultValue={Number(s?.min_order_amount ?? 500)} />
          <span className="hint">Bunun altındaki sepetlerde ödeme butonu kapalı kalır. Sınır istemiyorsan 0 yaz.</span>
        </div>
        <button className="btn">Kaydet</button>
      </form>
    </>
  );
}
