# Meris Clean — Proje notları

Prolinex doğal temizlik ürünlerinin Türkiye distribütörü Meris Group'un satış sitesi.

- **Canlı site:** https://merisclean.com · **Repo:** https://github.com/forkli/Meris_Clean (public)
- **Deploy:** Vercel, GitHub push ile otomatik. `master` = canlı, diğer branch'ler = preview linki.
- **Teknoloji:** Next.js 16 (App Router, TypeScript) + Supabase (veritabanı, giriş, görsel deposu) + iyzico Checkout Form + Resend.
- **Tasarım:** "Buğuyu sil", kurallar `DESIGN.md` içinde. Yeni bir bölüm eklemeden önce oku.

## Klasörler
```
app/(vitrin)/        Müşterinin gördüğü site: ana sayfa, /urunler, /urun/[slug], /paket/[slug], /odeme, yasal sayfalar
app/panel/           Yönetim paneli (/panel). Giriş: Supabase Auth + `admins` tablosu
app/api/odeme/       iyzico: baslat (sepet → ödeme sayfası), sonuc (iyzico dönüşü, ödeme doğrulama)
components/          FogHero (buğu efekti), SurfacePicker, sepet (cart/), ürün satın alma kutusu
lib/catalog.ts       Vitrin verisi (önbellekli, "katalog" etiketi). Panel kaydı updateTag ile yeniler
lib/pricing.ts       Sepet tutarını VERİTABANINDAN hesaplar. Tarayıcıdan gelen fiyata asla güvenme
content/yasal/       KVKK, gizlilik, iade, mesafeli satış metinleri (HTML)
supabase/            migrations/*.sql (şema + RLS) ve seed.sql (başlangıç kataloğu)
public/img/urunler/  Başlangıç ürün görselleri (panelden yüklenenler Supabase Storage'a gider)
```

## Kurulum (bir kez)
1. Supabase > SQL Editor: önce `supabase/migrations/20261117000000_katalog.sql`, sonra `supabase/seed.sql` çalıştır.
2. Supabase > Authentication > Users > Add user: panel kullanıcısını oluştur (e-posta + şifre). Sonra SQL Editor'de:
   `insert into public.admins (user_id) select id from auth.users where email = 'PANEL_EPOSTASI';`
3. Vercel > Settings > Environment Variables: `.env.example` içindeki değişkenleri gir (özellikle `SUPABASE_SERVICE_ROLE_KEY`, `ORDER_NOTIFY_EMAIL`, `SITE_URL`, iyzico anahtarları).
4. Eski `ADMIN_PASSWORD` ve `SESSION_SECRET` değişkenleri artık kullanılmıyor; Vercel'den silinebilir.

## Kurallar
- Gizli anahtar, şifre ya da kişisel veri koda yazılmaz: repo herkese açık. Hepsi Vercel env'de.
- Fiyat, kargo ve minimum sepet yalnızca `lib/pricing.ts` + `settings` tablosundan gelir.
- Sipariş onayı yalnızca `checkoutForm.retrieve` doğrulamasından sonra verilir (`app/api/odeme/sonuc`).
- Panelde veri değiştiren her işlem `requireAdmin()` ile başlar ve `refreshStorefront()` ile biter.
- Yerel önizleme (veritabanısız): `MC_FIXTURES=1 SUPABASE_URL=https://x.supabase.co SUPABASE_ANON_KEY=x npm run dev` — vitrin seed verisini kullanır, panel çalışmaz.

## Kontrol
`npm run typecheck && npm run lint && npm run build`
