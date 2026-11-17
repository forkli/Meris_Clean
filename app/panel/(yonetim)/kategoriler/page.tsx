import { redirect } from "next/navigation";
import { requireAdmin, refreshStorefront } from "@/lib/admin";
import { slugify } from "@/lib/shared";

type SP = Promise<{ hata?: string }>;

async function add(fd: FormData) {
  "use server";
  const { db } = await requireAdmin();
  const name = String(fd.get("name") ?? "").trim();
  if (!name) redirect("/panel/kategoriler?hata=ad");
  const { data: last } = await db.from("categories").select("sort").order("sort", { ascending: false }).limit(1).maybeSingle();
  const { error } = await db.from("categories").insert({ name, slug: slugify(name), sort: (last?.sort ?? 0) + 1 });
  if (error) redirect("/panel/kategoriler?hata=ayni");
  refreshStorefront();
  redirect("/panel/kategoriler");
}

async function rename(fd: FormData) {
  "use server";
  const { db } = await requireAdmin();
  const name = String(fd.get("name") ?? "").trim();
  if (name) await db.from("categories").update({ name }).eq("id", String(fd.get("id")));
  refreshStorefront();
  redirect("/panel/kategoriler");
}

async function remove(fd: FormData) {
  "use server";
  const { db } = await requireAdmin();
  await db.from("categories").delete().eq("id", String(fd.get("id")));
  refreshStorefront();
  redirect("/panel/kategoriler");
}

export default async function Kategoriler({ searchParams }: { searchParams: SP }) {
  const { db } = await requireAdmin();
  const { hata } = await searchParams;
  const { data: cats } = await db.from("categories").select("id, name, slug, sort, products(count)").order("sort");

  return (
    <>
      <div className="pn-head"><h1>Kategoriler</h1></div>
      {hata && <p className="alert alert-error" style={{ marginBottom: 16 }}>{hata === "ayni" ? "Bu adla bir kategori zaten var." : "Kategori adını yaz."}</p>}
      <div className="pn-card" style={{ maxWidth: 720 }}>
        <table className="pn-table">
          <thead><tr><th>Ad</th><th>Ürün</th><th></th></tr></thead>
          <tbody>
            {(cats ?? []).map((c) => {
              const n = (c.products as unknown as { count: number }[])?.[0]?.count ?? 0;
              return (
                <tr key={c.id}>
                  <td>
                    <form action={rename} style={{ display: "flex", gap: 8 }}>
                      <input type="hidden" name="id" value={c.id} />
                      <input name="name" defaultValue={c.name} className="input" style={{ minHeight: 40 }} aria-label="Kategori adı" />
                      <button className="btn btn-line btn-sm">Kaydet</button>
                    </form>
                  </td>
                  <td className="num">{n}</td>
                  <td>
                    <form action={remove}>
                      <input type="hidden" name="id" value={c.id} />
                      <button className="btn btn-danger btn-sm" title={n ? "Bu kategorideki ürünler kategorisiz kalır" : undefined}>Sil</button>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <form action={add} style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <input name="name" className="input" placeholder="Yeni kategori adı" style={{ minHeight: 44 }} aria-label="Yeni kategori adı" />
          <button className="btn btn-sm">Ekle</button>
        </form>
        <p className="muted" style={{ fontSize: 13, marginTop: 10 }}>Kategoriler sitenin alt bilgisinde ve ürün sayfasındaki yol satırında görünür. Bir kategoriyi silersen içindeki ürünler silinmez, kategorisiz kalır.</p>
      </div>
    </>
  );
}
