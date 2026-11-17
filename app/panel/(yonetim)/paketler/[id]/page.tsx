import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireAdmin, refreshStorefront } from "@/lib/admin";
import { formatTL, slugify } from "@/lib/shared";

type Params = Promise<{ id: string }>;
type SP = Promise<{ hata?: string; kaydedildi?: string }>;

async function save(fd: FormData) {
  "use server";
  const { db } = await requireAdmin();
  const id = String(fd.get("id") || "") || null;
  const name = String(fd.get("name") ?? "").trim();
  const price = Number(String(fd.get("price") ?? "").replace(",", "."));
  const back = `/panel/paketler/${id ?? "yeni"}`;
  if (!name || !(price > 0)) redirect(`${back}?hata=bilgi`);

  const items = [...fd.entries()]
    .filter(([k, v]) => k.startsWith("qty:") && Number(v) > 0)
    .map(([k, v]) => ({ variant_id: k.slice(4), quantity: Math.min(20, Math.floor(Number(v))) }));
  if (items.length === 0) redirect(`${back}?hata=urun`);

  const row = { name, slug: slugify(String(fd.get("slug") || name)), description: String(fd.get("description") ?? "").trim() || null, price, active: fd.get("active") === "on" };
  let bundleId = id;
  if (bundleId) {
    const { error } = await db.from("bundles").update(row).eq("id", bundleId);
    if (error) redirect(`${back}?hata=slug`);
  } else {
    const { data, error } = await db.from("bundles").insert(row).select("id").single();
    if (error) redirect(`${back}?hata=slug`);
    bundleId = data!.id;
  }
  await db.from("bundle_items").delete().eq("bundle_id", bundleId);
  await db.from("bundle_items").insert(items.map((i) => ({ ...i, bundle_id: bundleId })));
  refreshStorefront();
  redirect(`/panel/paketler/${bundleId}?kaydedildi=1`);
}

async function remove(fd: FormData) {
  "use server";
  const { db } = await requireAdmin();
  await db.from("bundles").delete().eq("id", String(fd.get("id")));
  refreshStorefront();
  redirect("/panel/paketler");
}

const ERR: Record<string, string> = {
  bilgi: "Paket adını ve 0’dan büyük bir fiyat gir.",
  urun: "Pakete en az bir ürün ekle (adet kutusuna 1 yaz).",
  slug: "Bu adres başka bir pakette kullanılıyor.",
};

export default async function PaketDuzenle({ params, searchParams }: { params: Params; searchParams: SP }) {
  const { db } = await requireAdmin();
  const { id } = await params;
  const { hata, kaydedildi } = await searchParams;

  const [{ data: b }, { data: products }] = await Promise.all([
    id === "yeni" ? Promise.resolve({ data: null }) : db.from("bundles").select("*, items:bundle_items(variant_id, quantity)").eq("id", id).maybeSingle(),
    db.from("products").select("id, name, active, variants:product_variants(id, label, price, sort)").order("sort"),
  ]);
  if (id !== "yeni" && !b) notFound();
  const qty = new Map<string, number>((b?.items ?? []).map((i: { variant_id: string; quantity: number }) => [i.variant_id, i.quantity]));

  return (
    <>
      <div className="pn-head"><h1>{b ? b.name : "Yeni paket"}</h1></div>
      {hata && <p className="alert alert-error" style={{ marginBottom: 16 }}>{ERR[hata] ?? "Kaydedilemedi."}</p>}
      {kaydedildi && <p className="alert alert-ok" style={{ marginBottom: 16 }}>Paket kaydedildi, sitede güncellendi.</p>}
      <form action={save} className="pn-grid-2">
        {b && <input type="hidden" name="id" value={b.id} />}
        <section className="pn-card">
          <h2>Pakette neler var?</h2>
          <p className="muted" style={{ fontSize: 14, marginBottom: 10 }}>Pakete eklemek istediğin boyutun yanına adet yaz.</p>
          <table className="pn-table">
            <tbody>
              {(products ?? []).flatMap((p) =>
                [...(p.variants as { id: string; label: string; price: number; sort: number }[])]
                  .sort((x, y) => x.sort - y.sort)
                  .map((v) => (
                    <tr key={v.id}>
                      <td>{p.name} <span className="muted">({v.label})</span>{!p.active && <span className="badge" data-tone="off" style={{ marginLeft: 6 }}>taslak</span>}</td>
                      <td className="num muted">{Number(v.price) > 0 ? formatTL(Number(v.price)) : "—"}</td>
                      <td style={{ width: 90 }}><input name={`qty:${v.id}`} type="number" min={0} max={20} defaultValue={qty.get(v.id) ?? ""} className="input" style={{ minHeight: 38 }} aria-label={`${p.name} ${v.label} adedi`} /></td>
                    </tr>
                  )),
              )}
            </tbody>
          </table>
        </section>
        <section className="pn-card" style={{ display: "grid", gap: 14 }}>
          <h2>Paket bilgisi</h2>
          <div className="field"><label htmlFor="name">Paket adı</label><input id="name" name="name" className="input" defaultValue={b?.name ?? ""} required /></div>
          <div className="field"><label htmlFor="slug">Sayfa adresi</label><input id="slug" name="slug" className="input" defaultValue={b?.slug ?? ""} placeholder="otomatik" /><span className="hint">merisclean.com/paket/…</span></div>
          <div className="field"><label htmlFor="price">Paket fiyatı (TL)</label><input id="price" name="price" className="input" inputMode="decimal" defaultValue={b ? Number(b.price) : ""} required /></div>
          <div className="field"><label htmlFor="description">Açıklama</label><textarea id="description" name="description" className="textarea" defaultValue={b?.description ?? ""} /></div>
          <label className="check"><input type="checkbox" name="active" defaultChecked={b?.active ?? true} /> Yayında</label>
          <button className="btn">Kaydet</button>
          <Link className="link" href="/panel/paketler">Paketlere dön</Link>
        </section>
      </form>
      {b && (
        <form action={remove} style={{ marginTop: 16 }}>
          <input type="hidden" name="id" value={b.id} />
          <button className="btn btn-danger btn-sm">Paketi sil</button>
        </form>
      )}
    </>
  );
}
