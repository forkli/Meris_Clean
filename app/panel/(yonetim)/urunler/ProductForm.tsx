"use client";

import Link from "next/link";
import { startTransition, useActionState, useRef, useState } from "react";
import { saveProduct, deleteProduct, type SaveState } from "./actions";
import { SURFACES, formatTL, slugify } from "@/lib/shared";

type Variant = { key: string; id?: string; label: string; price: string; compare_at_price: string; sku: string; in_stock: boolean };
type Img = { key: string; id?: string; url: string; file?: File };

export type ProductFormData = {
  id?: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  usage: string;
  ingredients: string;
  surfaces: string[];
  color: string;
  category_id: string;
  featured: boolean;
  active: boolean;
  variants: Omit<Variant, "key">[];
  images: { id: string; url: string }[];
};

let k = 0;
const key = () => `k${++k}`;

/** Yüklemeden önce görseli tarayıcıda küçültüp WebP'ye çevirir (en uzun kenar 1400 px). */
async function toWebp(file: File): Promise<File> {
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, 1400 / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas");
    c.width = Math.round(bmp.width * scale);
    c.height = Math.round(bmp.height * scale);
    c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
    const blob = await new Promise<Blob | null>((r) => c.toBlob(r, "image/webp", 0.86));
    if (!blob) return file;
    return new File([blob], file.name.replace(/\.\w+$/, "") + ".webp", { type: "image/webp" });
  } catch {
    return file;
  }
}

export function ProductForm({ initial, categories, saved }: { initial: ProductFormData; categories: { id: string; name: string }[]; saved?: boolean }) {
  const [state, action, pending] = useActionState<SaveState, FormData>(saveProduct, saved ? { ok: true } : {});
  const [name, setName] = useState(initial.name);
  const [slug, setSlug] = useState(initial.slug);
  const [slugTouched, setSlugTouched] = useState(!!initial.id);
  const [tagline, setTagline] = useState(initial.tagline);
  const [color, setColor] = useState(initial.color);
  const [variants, setVariants] = useState<Variant[]>(
    (initial.variants.length ? initial.variants : [{ label: "750 ml", price: "", compare_at_price: "", sku: "", in_stock: true }]).map((v) => ({ ...v, key: key() })),
  );
  const [images, setImages] = useState<Img[]>(initial.images.map((i) => ({ ...i, key: key() })));
  const [over, setOver] = useState(false);
  const [converting, setConverting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const updV = (i: number, patch: Partial<Variant>) => setVariants((vs) => vs.map((v, j) => (j === i ? { ...v, ...patch } : v)));

  async function addFiles(list: FileList | null) {
    if (!list?.length) return;
    setConverting(true);
    const files = await Promise.all([...list].filter((f) => f.type.startsWith("image/")).map(toWebp));
    setImages((im) => [...im, ...files.map((f) => ({ key: key(), url: URL.createObjectURL(f), file: f }))]);
    setConverting(false);
  }
  const moveImg = (i: number, d: -1 | 1) =>
    setImages((im) => {
      const j = i + d;
      if (j < 0 || j >= im.length) return im;
      const n = [...im];
      [n[i], n[j]] = [n[j], n[i]];
      return n;
    });

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("variants", JSON.stringify(variants.map(({ key: _k, ...v }) => v)));
    const uploads: File[] = [];
    fd.set(
      "images",
      JSON.stringify(
        images.map((im) => {
          if (im.id) return { id: im.id };
          uploads.push(im.file!);
          return { upload: uploads.length - 1 };
        }),
      ),
    );
    uploads.forEach((f) => fd.append("uploads", f));
    startTransition(() => action(fd));
  }

  const firstPrice = variants.map((v) => Number(v.price.replace(",", "."))).filter((n) => n > 0).sort((a, b) => a - b)[0];

  return (
    <form onSubmit={onSubmit}>
      {initial.id && <input type="hidden" name="id" value={initial.id} />}
      <div className="pn-grid-2">
        <div>
          <section className="pn-card">
            <h2>Temel bilgiler</h2>
            <div className="form-grid">
              <div className="field full">
                <label htmlFor="name">Ürün adı</label>
                <input id="name" name="name" className="input" required value={name} onChange={(e) => { setName(e.target.value); if (!slugTouched) setSlug(slugify(e.target.value)); }} />
              </div>
              <div className="field full">
                <label htmlFor="slug">Sayfa adresi</label>
                <input id="slug" name="slug" className="input" value={slug} onChange={(e) => { setSlug(e.target.value); setSlugTouched(true); }} />
                <span className="hint">merisclean.com/urun/{slugify(slug) || "…"}</span>
              </div>
              <div className="field full">
                <label htmlFor="tagline">Kısa açıklama</label>
                <input id="tagline" name="tagline" className="input" maxLength={120} value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Ör. Fırın, ocak ve aspiratör yağını söker." />
                <span className="hint">Ürün listelerinde adın altında görünür. Tek cümle.</span>
              </div>
              <div className="field full">
                <label htmlFor="description">Ne yapar? (ürün sayfası)</label>
                <textarea id="description" name="description" className="textarea" rows={5} defaultValue={initial.description} />
                <span className="hint">Paragrafları boş satırla ayır.</span>
              </div>
              <div className="field full">
                <label htmlFor="usage">Nasıl kullanılır?</label>
                <textarea id="usage" name="usage" className="textarea" rows={3} defaultValue={initial.usage} />
              </div>
              <div className="field full">
                <label htmlFor="ingredients">İçerik</label>
                <input id="ingredients" name="ingredients" className="input" defaultValue={initial.ingredients} placeholder="Ritha özü, D-limonen" />
                <span className="hint">Virgülle ayır.</span>
              </div>
            </div>
          </section>

          <section className="pn-card">
            <h2>Boyutlar ve fiyatlar</h2>
            {variants.map((v, i) => (
              <div key={v.key} className="var-row">
                <div className="field"><label>Boyut</label><input className="input" value={v.label} onChange={(e) => updV(i, { label: e.target.value })} placeholder="750 ml" /></div>
                <div className="field"><label>Fiyat (TL)</label><input className="input" inputMode="decimal" value={v.price} onChange={(e) => updV(i, { price: e.target.value })} placeholder="150" /></div>
                <div className="field"><label>Eski fiyat</label><input className="input" inputMode="decimal" value={v.compare_at_price} onChange={(e) => updV(i, { compare_at_price: e.target.value })} placeholder="isteğe bağlı" /></div>
                <div className="field"><label>Stok kodu</label><input className="input" value={v.sku} onChange={(e) => updV(i, { sku: e.target.value })} /></div>
                <label className="check" style={{ alignSelf: "center" }}><input type="checkbox" checked={v.in_stock} onChange={(e) => updV(i, { in_stock: e.target.checked })} /> Stokta</label>
                <button type="button" className="btn btn-danger btn-sm" onClick={() => setVariants((vs) => vs.filter((_, j) => j !== i))} disabled={variants.length === 1} aria-label={`${v.label} boyutunu sil`}>Sil</button>
              </div>
            ))}
            <button type="button" className="btn btn-line btn-sm" style={{ marginTop: 12 }} onClick={() => setVariants((vs) => [...vs, { key: key(), label: "", price: "", compare_at_price: "", sku: "", in_stock: true }])}>
              Boyut ekle
            </button>
            <p className="hint muted" style={{ marginTop: 10, fontSize: 13 }}>Fiyatı boş ya da 0 olan boyut sitede gösterilmez.</p>
          </section>

          <section className="pn-card">
            <h2>Görseller</h2>
            <div className="img-grid">
              {images.map((im, i) => (
                <div key={im.key} className="img-tile" data-first={i === 0}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={im.url} alt="" />
                  <div className="tools">
                    <span>
                      <button type="button" onClick={() => moveImg(i, -1)} aria-label="Sola al">←</button>{" "}
                      <button type="button" onClick={() => moveImg(i, 1)} aria-label="Sağa al">→</button>
                    </span>
                    <button type="button" onClick={() => setImages((x) => x.filter((_, j) => j !== i))} aria-label="Görseli kaldır">Sil</button>
                  </div>
                </div>
              ))}
              <label
                className="dropzone"
                data-over={over}
                onDragOver={(e) => { e.preventDefault(); setOver(true); }}
                onDragLeave={() => setOver(false)}
                onDrop={(e) => { e.preventDefault(); setOver(false); addFiles(e.dataTransfer.files); }}
              >
                {converting ? "Hazırlanıyor…" : <>Görsel sürükle<br />ya da seç</>}
                <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
              </label>
            </div>
            <p className="muted" style={{ fontSize: 13, marginTop: 10 }}>İlk görsel kapak olur. Arka planı şeffaf şişe görseli (PNG) vitrinde en iyi görünür. Görseller otomatik küçültülür.</p>
          </section>
        </div>

        <div>
          <section className="pn-card">
            <h2>Yayın</h2>
            <label className="check"><input type="checkbox" name="active" defaultChecked={initial.active} /> <span><strong>Yayında</strong><br /><span className="muted">Kapalıysa ürün sitede görünmez.</span></span></label>
            <label className="check" style={{ marginTop: 12 }}><input type="checkbox" name="featured" defaultChecked={initial.featured} /> <span><strong>Öne çıkan</strong><br /><span className="muted">Ana sayfada buğulu camın arkasında ve “En çok alınanlar” rafında görünür.</span></span></label>
          </section>

          <section className="pn-card">
            <h2>Nerede görünsün?</h2>
            <div className="field">
              <label htmlFor="category_id">Kategori</label>
              <select id="category_id" name="category_id" className="select" defaultValue={initial.category_id}>
                <option value="">Kategorisiz</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <p style={{ fontWeight: 700, fontSize: 15, margin: "16px 0 8px" }}>Yüzeyler</p>
            <div className="chips-input">
              {SURFACES.map((s) => (
                <label key={s.key}><input type="checkbox" name="surfaces" value={s.key} defaultChecked={initial.surfaces.includes(s.key)} /> {s.name}</label>
              ))}
            </div>
            <p className="muted" style={{ fontSize: 13, marginTop: 8 }}>Ana sayfadaki “Neyi temizleyeceksin?” bölümünde ve filtrelerde bu yüzeylerin altında listelenir.</p>
          </section>

          <section className="pn-card">
            <h2>Sıvı rengi</h2>
            <div className="color-row">
              <input type="color" name="color" value={color} onChange={(e) => setColor(e.target.value)} aria-label="Sıvı rengi" />
              <span className="muted" style={{ fontSize: 14 }}>Ürün sayfasının vurgu rengi. Şişedeki sıvının rengini seç.</span>
            </div>
            <div className="preview-card" style={{ marginTop: 14, ["--item" as string]: color }}>
              <div className="shelf-stage" style={{ aspectRatio: "4 / 3" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {images[0] && <img src={images[0].url} alt="" style={{ maxHeight: "100%" }} />}
              </div>
              <div className="shelf-meta">
                <strong>{name || "Ürün adı"}</strong>
                {tagline && <span>{tagline}</span>}
                <span className="price">{firstPrice ? formatTL(firstPrice) : "Fiyat yok"}</span>
              </div>
            </div>
          </section>
        </div>
      </div>

      <div className="sticky-save">
        <button className="btn" disabled={pending || converting}>{pending ? "Kaydediliyor…" : "Kaydet"}</button>
        <Link href="/panel/urunler" className="btn btn-line">Listeye dön</Link>
        {initial.id && <a className="link" href={`/urun/${initial.slug}`} target="_blank" rel="noopener">Sitede gör ↗</a>}
        {state.error && <span className="alert alert-error" role="alert">{state.error}</span>}
        {state.ok && !pending && <span className="alert alert-ok" role="status">Kaydedildi, sitede güncellendi.</span>}
        {initial.id && (
          <button
            type="button"
            className="btn btn-danger btn-sm"
            style={{ marginLeft: "auto" }}
            onClick={() => {
              if (confirm(`“${initial.name}” kalıcı olarak silinsin mi? Bu işlem geri alınamaz. Satıştan kaldırmak için “Yayında” kutusunu kapatman yeterli.`)) {
                startTransition(() => { deleteProduct(initial.id!); });
              }
            }}
          >
            Ürünü sil
          </button>
        )}
      </div>
    </form>
  );
}
