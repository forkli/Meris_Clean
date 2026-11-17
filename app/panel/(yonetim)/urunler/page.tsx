import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { formatTL, imageUrl } from "@/lib/shared";
import { RowControls } from "./RowControls";

type SP = Promise<{ q?: string; durum?: string; silindi?: string }>;

export default async function UrunListesi({ searchParams }: { searchParams: SP }) {
  const { db } = await requireAdmin();
  const { q, durum, silindi } = await searchParams;
  const { data } = await db
    .from("products")
    .select("id, slug, name, color, active, featured, sort, category:categories(name), variants:product_variants(label, price, in_stock), images:product_images(path, sort)")
    .order("sort")
    .order("name");

  type Row = { id: string; slug: string; name: string; color: string; active: boolean; featured: boolean; sort: number; category: { name: string } | null; variants: { label: string; price: number; in_stock: boolean }[]; images: { path: string; sort: number }[] };
  const all = (data ?? []) as unknown as Row[];
  const list = all.filter(
    (p) =>
      (!q || p.name.toLocaleLowerCase("tr").includes(q.toLocaleLowerCase("tr"))) &&
      (!durum || (durum === "yayinda" ? p.active : durum === "taslak" ? !p.active : durum === "one" ? p.featured : true)),
  );
  const counts = { all: all.length, live: all.filter((p) => p.active).length, draft: all.filter((p) => !p.active).length };

  return (
    <>
      <div className="pn-head">
        <h1>Ürünler</h1>
        <Link href="/panel/urunler/yeni" className="btn btn-sm">Yeni ürün ekle</Link>
      </div>
      {silindi && <p className="alert alert-ok" style={{ marginBottom: 16 }}>Ürün silindi.</p>}
      <form className="pn-tabs" role="search">
        <input name="q" defaultValue={q} className="input" placeholder="Ürün ara" style={{ maxWidth: 260, minHeight: 40 }} aria-label="Ürün ara" />
        <Link className="chip" href="/panel/urunler" aria-current={!durum ? "true" : undefined}>Hepsi ({counts.all})</Link>
        <Link className="chip" href="/panel/urunler?durum=yayinda" aria-current={durum === "yayinda" ? "true" : undefined}>Yayında ({counts.live})</Link>
        <Link className="chip" href="/panel/urunler?durum=taslak" aria-current={durum === "taslak" ? "true" : undefined}>Taslak ({counts.draft})</Link>
        <Link className="chip" href="/panel/urunler?durum=one" aria-current={durum === "one" ? "true" : undefined}>Öne çıkan</Link>
      </form>
      <div className="pn-card" style={{ padding: 0, overflowX: "auto" }}>
        <table className="pn-table">
          <thead>
            <tr>
              <th style={{ width: 60 }}></th>
              <th>Ürün</th>
              <th className="hide-sm">Boyut ve fiyat</th>
              <th>Yayında</th>
              <th className="hide-sm">Öne çıkan</th>
              <th className="hide-sm">Sıra</th>
            </tr>
          </thead>
          <tbody>
            {list.map((p) => {
              const img = [...p.images].sort((a, b) => a.sort - b.sort)[0];
              const priced = p.variants.filter((v) => Number(v.price) > 0);
              return (
                <tr key={p.id}>
                  <td>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {img ? <img className="pn-thumb" src={imageUrl(img.path)} alt="" /> : <div className="pn-thumb" />}
                  </td>
                  <td>
                    <Link href={`/panel/urunler/${p.id}`} style={{ fontWeight: 700 }}><span className="pn-dot" style={{ background: p.color }} />{p.name}</Link>
                    <div className="muted" style={{ fontSize: 13 }}>{p.category?.name ?? "Kategorisiz"}</div>
                  </td>
                  <td className="hide-sm">
                    {priced.length === 0 ? <span className="badge" data-tone="warn">Fiyat girilmedi</span> : priced.map((v) => `${v.label}: ${formatTL(Number(v.price))}`).join(" · ")}
                  </td>
                  <RowControls id={p.id} active={p.active} featured={p.featured} />
                </tr>
              );
            })}
            {list.length === 0 && (
              <tr><td colSpan={6} style={{ padding: 32, textAlign: "center" }} className="muted">Bu filtrede ürün yok.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
