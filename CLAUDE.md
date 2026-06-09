# Meris Clean — Proje Özeti

## Proje Nedir?
Prolinex temizlik ürünlerinin Türkiye distribütörü **Meris Group** için Instagram reklamlarına yönelik ürün satış sitesi.

- **Canlı site:** https://merisclean.com
- **GitHub:** https://github.com/forkli/Meris_Clean
- **Deploy:** Vercel (GitHub push → otomatik deploy)
- **Çalışma dizini:** `D:/Meris Clean/site/`

---

## Şirket Bilgileri
- **Unvan:** Meris Group
- **Adres:** Muslihittin Mah. Erdem Sok. İnci Apt. No:5 İç Kapı No:3 Menteşe/Muğla
- **Vergi Dairesi:** Muğla — **VKN:** 7540663707
- **E-posta:** info@merisclean.com

---

## Site Yapısı

```
site/
├── index.html              # Anasayfa
├── yagcoz/                 # Yağçöz ürün sayfası (kırmızı tema)
├── wc-banyo/               # WC Banyo Temizleyici (mavi tema)
├── silikonlu/              # Silikonlu Temizleyici (teal tema)
├── sihirli-su/             # Sihirli Su (yeşil tema)
├── paket/                  # 4'lü Mix Paket
├── kvkk/                   # KVKK Aydınlatma Metni
├── gizlilik/               # Gizlilik Politikası
├── iade/                   # İade ve İptal Politikası
├── mesafeli-satis/         # Mesafeli Satış Sözleşmesi
├── tesekkurler.html        # Sipariş başarı sayfası
├── css/style.css           # Paylaşılan stil dosyası
├── js/checkout.js          # Sepet/ödeme mantığı
├── assets/                 # Görseller (PNG ürün fotoğrafları + iyzico logoları)
└── server/                 # Node.js/Express iyzico backend
    ├── server.js
    ├── .env                # (git'e push edilmez)
    └── .env.example
```

---

## Ürünler ve Fiyatlar

| Ürün | Fiyat | Dosya |
|------|-------|-------|
| Yağçöz | 150 TL/adet | `assets/yagcoz.png` |
| WC Banyo Temizleyici | 150 TL/adet | `assets/wc-banyo.png` |
| Silikonlu Temizleyici | 150 TL/adet | `assets/silikonlu.png` |
| Sihirli Su | 150 TL/adet | `assets/sihirli-su.png` |
| 4'lü Mix Paket | 500 TL | — |

- **Kargo:** +60 TL sabit, 1000 TL üzeri bedava
- **Minimum sepet:** 500 TL (checkout butonu altında pasif)
- **Adet artışı:** +1/-1 (eski: 4'lü zorunluluk kaldırıldı)

---

## Teknik Detaylar

### CSS Değişkenleri (css/style.css)
- Font: Cormorant Garamond (display) + DM Sans (body)
- Ana renk: `--navy-900: #040e1c`, Accent: `--cyan-400: #00c8d7`
- Ürün sayfalarının her birinin kendi renk teması var (inline `<style>`)

### checkout.js Önemli Sabitler
```js
const SHIPPING_FEE = 60;
const FREE_SHIPPING_THRESHOLD = 1000;
const MIN_ORDER_AMOUNT = 500;
```

### initOrderBox Kullanımı
```js
// Tekli ürün sayfaları:
initOrderBox({ unitPrice: 150, isBundle: false });
// Paket sayfası:
initOrderBox({ unitPrice: 500, isBundle: true, qtyStep: 1 });
```

### İyzico Backend (server/)
- Port: 4000
- `POST /api/payment/initialize` — ödeme başlatır
- `POST /api/payment/3ds-callback` — 3DS yönlendirmesi
- Sandbox credentials `.env`'de, production'a geçmek için sadece `.env` anahtarlarını değiştir
- **Not:** Vercel static hosting, backend çalıştırmaz. iyzico aktif olduğunda backend ayrı bir platforma (Railway/Render) deploy edilmeli.

---

## Yapılacaklar / Bekleyen İşler

- [ ] **iyzico hesabı aktive edilmedi** — açılınca backend'i Railway/Render'a deploy et, `.env`'deki sandbox keylerini production ile değiştir
- [ ] **Backend deploy** — `server/` klasörünü Vercel dışı bir platforma taşı (Railway önerilir, ücretsiz tier var)

---

## Git Workflow
```bash
cd "D:/Meris Clean/site"
git add -A
git commit -m "açıklama"
git push   # Vercel otomatik deploy eder
```
