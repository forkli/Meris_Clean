import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { imageUrl } from "@/lib/shared";
import { ProductForm, type ProductFormData } from "../ProductForm";

type Params = Promise<{ id: string }>;
type SP = Promise<{ kaydedildi?: string }>;

export default async function UrunDuzenle({ params, searchParams }: { params: Params; searchParams: SP }) {
  const { db } = await requireAdmin();
  const { id } = await params;
  const { kaydedildi } = await searchParams;

  const [{ data: cats }, { data: p }] = await Promise.all([
    db.from("categories").select("id, name").order("sort"),
    id === "yeni"
      ? Promise.resolve({ data: null })
      : db.from("products").select("*, variants:product_variants(*), images:product_images(*)").eq("id", id).maybeSingle(),
  ]);

  if (id !== "yeni" && !p) notFound();

  const initial: ProductFormData = p
    ? {
        id: p.id,
        name: p.name,
        slug: p.slug,
        tagline: p.tagline ?? "",
        description: p.description ?? "",
        usage: p.usage ?? "",
        ingredients: (p.ingredients ?? []).join(", "),
        surfaces: p.surfaces ?? [],
        color: p.color,
        category_id: p.category_id ?? "",
        featured: p.featured,
        active: p.active,
        variants: [...p.variants]
          .sort((a: { sort: number }, b: { sort: number }) => a.sort - b.sort)
          .map((v: { id: string; label: string; price: number; compare_at_price: number | null; sku: string | null; in_stock: boolean }) => ({
            id: v.id,
            label: v.label,
            price: Number(v.price) > 0 ? String(Number(v.price)) : "",
            compare_at_price: v.compare_at_price == null ? "" : String(Number(v.compare_at_price)),
            sku: v.sku ?? "",
            in_stock: v.in_stock,
          })),
        images: [...p.images]
          .sort((a: { sort: number }, b: { sort: number }) => a.sort - b.sort)
          .map((i: { id: string; path: string }) => ({ id: i.id, url: imageUrl(i.path) })),
      }
    : { name: "", slug: "", tagline: "", description: "", usage: "", ingredients: "", surfaces: [], color: "#0E4C5A", category_id: "", featured: false, active: false, variants: [], images: [] };

  return (
    <>
      <div className="pn-head"><h1>{p ? p.name : "Yeni ürün"}</h1></div>
      <ProductForm key={p?.updated_at ?? "yeni"} initial={initial} categories={cats ?? []} saved={!!kaydedildi} />
    </>
  );
}
