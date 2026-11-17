# Meris Clean — Tasarım yönü: "Buğuyu sil"

## Fikir
Temizlik, bulanık bir yüzeyin berraklaşması anıdır. Site bu anı yaşatır: ilk ekran buğulu bir camdır, ziyaretçi parmağıyla, imleciyle ya da kaydırarak camı siler ve altındaki ürün berraklaşır. Bu, sitenin **tek** imza hareketidir. Geri kalan her şey sakin, berrak ve disiplinlidir.

## Renk
Zemin berrak ve serin. Kimlik rengi logodaki petrol mavisinden gelir; vurgu rengi her zaman ürünün sıvısından.

| Token | Hex | Rol |
|---|---|---|
| `--glass` | `#F1F5F5` | Sayfa zemini (serin beyaz, krem değil) |
| `--mist` | `#DDE6E7` | Ayırıcı, pasif yüzey, buğu tonu |
| `--petrol` | `#0E4C5A` | Metin, logo, birincil buton |
| `--petrol-deep` | `#072F38` | Koyu bölüm zemini, footer |
| `--aqua` | `#5CE1E6` | Yalnızca odak halkası, seçim, imleç izi (logodaki aqua) |
| `--liquid` | ürün başına | Ürünün sıvı rengi; ürün sayfası, varyant seçimi, sepet çizgisi |

Sıvı renkleri (panelden değişir): Yağçöz `#E8572A`, WC Banyo `#2D6BD3`, Silikonlu `#0E9C98`, Sihirli Su `#3C9D48`.

## Tipografi
- **Display:** Sofia Sans Extra Condensed 800. Uzun, dar ve şişe etiketi gibi. Dev kelimeler bir görsel öğe olarak kullanılır (yüzey listesi, "0 / 0 / 0" bölümü).
- **Metin:** Schibsted Grotesk 400/500/700. Türkçe karakterleri tam, sakin ve okunaklı.
- Ölçek: 14 / 16 / 19 / 24 / 34 / 56 / clamp(64px, 14vw, 220px). Metin satırı en fazla 68 karakter.
- Yasak: tek kelimeyi renklendirmek ya da italik yapmak, başlık üstü eyebrow etiketi, her şeyi BÜYÜK HARF yazmak, sıra olmayan içerikte 01/02/03 numaralandırma.

## Yerleşim
- Sol hizalı, 12 sütunlu akışkan ızgara; kenar boşluğu `clamp(16px, 4vw, 56px)`.
- **Hero:** Tam ekran buğulu cam. Altında berrak katmanda ürün çekimi ve "Doğadan evinize temizlik" başlığı.
- **Yüzey seçici:** Dev, dar harflerle alt alta yazılmış oda adları (Mutfak, Banyo, Cam & ayna, Araç, Çamaşır, Zemin). Birine dokununca sağda o yüzeyin ürünleri belirir. Kart ızgarası kullanılmaz.
- **Ürün rafı:** Şişeler gerçek ölçek oranıyla bir çizginin üstünde durur, yatayda kayar. Altında ad, varyant ve fiyat yazar.
- **Ürün sayfası:** Solda büyük şişe, sağda yapışkan satın alma sütunu. Sıvı rengi sayfanın tek vurgusudur.

```
┌──────────────────────────────────────────────┐
│ ░░░░ buğu ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│ ░░░░░░░░    ╭─ silinmiş alan ─╮ ░░░░░░░░░░░░ │
│ ░░ Doğadan  │   ▮▮  ▮▮  ▮▮    │ ░░░░░░░░░░░░ │
│ ░░ evinize  ╰─────────────────╯ ░░░░░░░░░░░░ │
│ ░░ temizlik.          [Ürünleri gör]  ░░░░░░ │
├──────────────────────────────────────────────┤
│ MUTFAK          │  ▮ Yağçöz    150 TL        │
│ BANYO           │  ▮ Kireç & pas …           │
│ CAM & AYNA      │                            │
│ ARAÇ            │                            │
└──────────────────────────────────────────────┘
```

## Hareket
- Tek orkestre an: buğuyu silme. Canvas 2D maskesi, ~1,2 sn sonra kendiliğinden çizilen bir silme izi, ardından kaydırmaya bağlı olarak tamamen açılma.
- Diğer hareketler sadece kullanıcı eylemine cevap verir: sepete ekleme (şişe sepete doğru küçülür), çekmece açılması, varyant değişimi. Süreler 160–280 ms, `cubic-bezier(.2,.8,.2,1)`.
- Her bölüme fade-up eklenmez.
- `prefers-reduced-motion` açıksa: buğu hiç gösterilmez, otomatik hareketler kapanır.

## Yüzey ve detay
- Köşe yarıçapı hiyerarşiye göre değişir: buton 999px, görsel 2px, çekmece 0.
- Gölge yerine ince `--mist` çizgileri kullanılır; yalnızca sepet çekmecesinde ofsetli ve yumuşak gölge var.
- Seçim rengi, imleç, odak halkası ve kaydırma çubuğu paletten gelir.
- İkonlar: tek çizgi kalınlığında, elle yazılmış SVG. Emoji yok.

## Metin dili
Kısa ve somut. Ürünün ne temizlediğini söyler. Butonlar ne yaptıklarını söyler: "Sepete ekle", "Ödemeye geç", "Siparişi tamamla". Uydurma yorum, rakam ya da ödül yok.
