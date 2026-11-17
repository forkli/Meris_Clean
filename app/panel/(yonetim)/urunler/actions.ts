"use server";

import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { requireAdmin, refreshStorefront } from "@/lib/admin";
import { SURFACES, slugify } from "@/lib/shared";

type VariantIn = { id?: string; label: string; price: string | number; compare_at_price?: string | number | null; sku?: string; in_stock: boolean };
type ImageIn = { id?: string; path?: string; upload?: number; alt?: string };

export type SaveState = { error?: string; ok?: boolean };

const num = (v: unknown) => {
  const n = Number(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : NaN;
};

export async function saveProduct(_: SaveState, fd: FormData): Promise<SaveState> {
  const { db } = await requireAdmin();

  const id = String(fd.get("id") || "") || null;
  const name = String(fd.get("name") ?? "").trim();
  const slug = slugify(String(fd.get("slug") || name));
  if (!name) return { error: "Ürün adını yaz." };
  if (!slug) return { error: "Adres (slug) oluşturulamadı; ürün adını kontrol et." };

  let variants: VariantIn[] = [];
  let images: ImageIn[] = [];
  try {
    variants = JSON.parse(String(fd.get("variants") ?? "[]"));
    images = JSON.parse(String(fd.get("images") ?? "[]"));
  } catch {
    return { error: "Form verisi okunamadı, sayfayı yenileyip tekrar dene." };
  }
  variants = variants.filter((v) => String(v.label ?? "").trim());
  if (variants.length === 0) return { error: "En az bir boyut/varyant ekle (ör. 750 ml)." };
  for (const v of variants) {
    const p = num(v.price);
    if (!(p >= 0)) return { error: `“${v.label}” için fiyat geçersiz.` };
    const c = v.compare_at_price === "" || v.compare_at_price == null ? null : num(v.compare_at_price);
    if (c !== null && !(c >= 0)) return { error: `“${v.label}” için eski fiyat geçersiz.` };
  }

  const active = fd.get("active") === "on";
  if (active && !variants.some((v) => num(v.price) > 0 && v.in_stock)) {
    return { error: "Ürünü yayına almak için en az bir boyuta fiyat gir ve stokta işaretle." };
  }

  const surfaces = fd.getAll("surfaces").map(String).filter((s) => SURFACES.some((x) => x.key === s));
  const color = /^#[0-9a-f]{6}$/i.test(String(fd.get("color"))) ? String(fd.get("color")) : "#0E4C5A";
  const row = {
    name,
    slug,
    tagline: String(fd.get("tagline") ?? "").trim() || null,
    description: String(fd.get("description") ?? "").trim() || null,
    usage: String(fd.get("usage") ?? "").trim() || null,
    ingredients: String(fd.get("ingredients") ?? "").split(",").map((s) => s.trim()).filter(Boolean),
    surfaces,
    color,
    category_id: String(fd.get("category_id") || "") || null,
    featured: fd.get("featured") === "on",
    active,
    updated_at: new Date().toISOString(),
  };

  let productId = id;
  if (productId) {
    const { error } = await db.from("products").update(row).eq("id", productId);
    if (error) return { error: error.code === "23505" ? "Bu adres (slug) başka bir üründe kullanılıyor." : `Kaydedilemedi: ${error.message}` };
  } else {
    const { data: maxSort } = await db.from("products").select("sort").order("sort", { ascending: false }).limit(1).maybeSingle();
    const { data, error } = await db.from("products").insert({ ...row, sort: (maxSort?.sort ?? 0) + 1 }).select("id").single();
    if (error) return { error: error.code === "23505" ? "Bu adres (slug) başka bir üründe kullanılıyor." : `Kaydedilemedi: ${error.message}` };
    productId = data.id;
  }

  // Varyantlar: formda olmayanları sil, olanları güncelle/ekle.
  const { data: existingV } = await db.from("product_variants").select("id").eq("product_id", productId);
  const keepV = new Set(variants.map((v) => v.id).filter(Boolean));
  const dropV = (existingV ?? []).map((v) => v.id).filter((vid) => !keepV.has(vid));
  if (dropV.length) await db.from("product_variants").delete().in("id", dropV);
  for (const [i, v] of variants.entries()) {
    const vr = {
      product_id: productId,
      label: v.label.trim(),
      price: num(v.price),
      compare_at_price: v.compare_at_price === "" || v.compare_at_price == null ? null : num(v.compare_at_price),
      sku: v.sku?.trim() || null,
      in_stock: !!v.in_stock,
      sort: i + 1,
    };
    const { error } = v.id ? await db.from("product_variants").update(vr).eq("id", v.id) : await db.from("product_variants").insert(vr);
    if (error) return { error: `Varyant kaydedilemedi: ${error.message}` };
  }

  // Görseller: yeni dosyaları yükle, sırayı kaydet, çıkarılanları sil.
  const files = fd.getAll("uploads").filter((f): f is File => f instanceof File && f.size > 0);
  const { data: existingI } = await db.from("product_images").select("id, path").eq("product_id", productId);
  const keepI = new Set(images.map((i) => i.id).filter(Boolean));
  const dropI = (existingI ?? []).filter((i) => !keepI.has(i.id));
  if (dropI.length) {
    await db.from("product_images").delete().in("id", dropI.map((i) => i.id));
    const storagePaths = dropI.map((i) => i.path).filter((p) => !p.startsWith("/"));
    if (storagePaths.length) await db.storage.from("product-images").remove(storagePaths);
  }
  for (const [i, im] of images.entries()) {
    if (im.id) {
      await db.from("product_images").update({ sort: i + 1 }).eq("id", im.id);
      continue;
    }
    const file = typeof im.upload === "number" ? files[im.upload] : undefined;
    if (!file) continue;
    if (file.size > 5 * 1024 * 1024) return { error: "Görsellerden biri 5 MB’tan büyük." };
    const ext = file.type === "image/webp" ? "webp" : file.type === "image/png" ? "png" : "jpg";
    const path = `${productId}/${Date.now()}-${randomBytes(4).toString("hex")}.${ext}`;
    const { error: upErr } = await db.storage.from("product-images").upload(path, file, { contentType: file.type, upsert: false });
    if (upErr) return { error: `Görsel yüklenemedi: ${upErr.message}` };
    await db.from("product_images").insert({ product_id: productId, path, alt: name, sort: i + 1 });
  }

  refreshStorefront();
  // Formu güncel veriyle (yeni görsel kimlikleri dahil) yeniden açmak için her kayıttan sonra yönlendir.
  redirect(`/panel/urunler/${productId}?kaydedildi=${Date.now()}`);
}

export async function setProductFlag(id: string, field: "active" | "featured", value: boolean) {
  const { db } = await requireAdmin();
  if (field === "active" && value) {
    const { data } = await db.from("product_variants").select("price, in_stock").eq("product_id", id);
    if (!(data ?? []).some((v) => Number(v.price) > 0 && v.in_stock)) {
      return { error: "Yayına almadan önce en az bir boyuta fiyat gir." };
    }
  }
  const { error } = await db.from("products").update({ [field]: value, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return { error: error.message };
  refreshStorefront();
  return { ok: true };
}

export async function moveProduct(id: string, dir: -1 | 1) {
  const { db } = await requireAdmin();
  const { data } = await db.from("products").select("id, sort").order("sort").order("name");
  const list = data ?? [];
  const i = list.findIndex((p) => p.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= list.length) return;
  [list[i], list[j]] = [list[j], list[i]];
  await Promise.all(list.map((p, k) => (p.sort === k + 1 ? null : db.from("products").update({ sort: k + 1 }).eq("id", p.id))));
  refreshStorefront();
}

export async function deleteProduct(id: string) {
  const { db } = await requireAdmin();
  const { data: imgs } = await db.from("product_images").select("path").eq("product_id", id);
  const paths = (imgs ?? []).map((i) => i.path).filter((p) => !p.startsWith("/"));
  const { error } = await db.from("products").delete().eq("id", id);
  if (error) return { error: error.message };
  if (paths.length) await db.storage.from("product-images").remove(paths);
  refreshStorefront();
  redirect("/panel/urunler?silindi=1");
}
