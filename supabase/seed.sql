-- Meris Clean başlangıç kataloğu. Migration'dan SONRA bir kez çalıştırılır.
-- Mevcut kayıtlara dokunmaz (slug çakışırsa atlar).
-- Yeni ürünler PASİF ve fiyatsız gelir: fiyatı panelden girip "Aktif" yapınca sitede görünür.

insert into public.categories (slug, name, sort) values
  ('mutfak', 'Mutfak', 1),
  ('banyo', 'Banyo & WC', 2),
  ('genel', 'Genel temizlik', 3),
  ('tekstil', 'Halı & tekstil', 4),
  ('arac', 'Araç bakımı', 5),
  ('profesyonel', 'Profesyonel & inşaat', 6)
on conflict (slug) do nothing;

with data as (
  select * from jsonb_to_recordset($json$[
    {"slug":"yagcoz","name":"Yağçöz","cat":"mutfak","color":"#E8572A","featured":true,"active":true,"sort":1,
     "tagline":"Fırın, ocak, aspiratör ve motordaki inatçı yağı söker.",
     "description":"Ritha ve D-limonen içeren formülüyle yağı yüzeye zarar vermeden çözer. Temizlenen alanda ince bir film bırakır, böylece yüzey daha geç kirlenir.\n\nFosfat, klor, amonyak ve boyar madde içermez; biyolojik olarak parçalanır.",
     "usage":"Yüzeye sıkın, 2-3 dakika bekleyin, nemli bezle silin.",
     "ingredients":["Ritha özü","D-limonen"],
     "surfaces":["mutfak","arac"],
     "variants":[{"label":"750 ml","price":150},{"label":"5 kg","price":0}],
     "images":["/img/urunler/yagcoz-sise.webp","/img/urunler/yagcoz-750ml.webp","/img/urunler/yagcoz-5kg.webp"]},
    {"slug":"wc-banyo","name":"WC Banyo Temizleyici","cat":"banyo","color":"#2D6BD3","featured":true,"active":true,"sort":2,
     "tagline":"Klozet, duşakabin, fayans ve armatür için meyve özlü temizleyici.",
     "description":"Doğal meyve özleriyle banyo yüzeylerini derinlemesine temizler ve kirlenmeyi geciktirir. Paslanmaz çelik ve krom armatürde parlaklık bırakır.\n\nCilde zarar vermez; otel, hastane ve iş yeri banyolarında sürekli kullanıma uygundur.",
     "usage":"Yüzeye sıkın, kısa süre bekletin, bezle silin ya da durulayın.",
     "ingredients":["Meyve özü"],
     "surfaces":["banyo"],
     "variants":[{"label":"750 ml","price":150},{"label":"5 kg","price":0}],
     "images":["/img/urunler/wc-banyo-sise.webp","/img/urunler/wc-banyo-750ml.webp","/img/urunler/wc-banyo-5kg.webp"]},
    {"slug":"silikonlu","name":"Silikonlu Temizleyici","cat":"genel","color":"#0E9C98","featured":true,"active":true,"sort":3,
     "tagline":"Cam, ayna, mobilya ve araçta iz bırakmadan parlatır.",
     "description":"Antistatik formülü tozun yüzeye yapışmasını önler, silikonlu katmanı yüzeyi daha uzun süre temiz tutar. Fayans, lavabo, ankastre ve metal yüzeylerde de kullanılır.\n\nAraç camı ve iç plastikler için idealdir; silecek suyuna 1/100 oranında eklenebilir.",
     "usage":"Cam ve aynada 1/2 oranında sulandırarak kullanın. Diğer yüzeylerde doğrudan sıkıp silin.",
     "ingredients":["Silikon","Antistatik ajan"],
     "surfaces":["cam","arac","mutfak"],
     "variants":[{"label":"750 ml","price":150},{"label":"5 kg","price":0}],
     "images":["/img/urunler/silikonlu-sise.webp","/img/urunler/silikonlu-temizleyici-750ml.webp","/img/urunler/silikonlu-temizleyici-5kg.webp"]},
    {"slug":"sihirli-su","name":"Sihirli Su","cat":"genel","color":"#3C9D48","featured":true,"active":true,"sort":4,
     "tagline":"Çamaşırdan halıya, araçtan tekneye çok amaçlı temizleyici.",
     "description":"Kiri, lekeyi ve kötü kokuyu giderir. Doğrudan ya da seyrelterek ev, araç, tekstil ve deniz araçlarında kullanılır; tekne temizliğinde krom aksama zarar vermez.\n\nBeyaz spor ayakkabıya doğrudan sıkıp nemli bezle silebilirsiniz.",
     "usage":"Fırın, ocak, mangal ve ayakkabıda doğrudan. Cam ve aynada 1/2 sulandırıp durulayın. Halı, koltuk, buzdolabı ve makinelerde 1 litre suya 200 ml. Araç içinde 1 litre suya 100 ml. Günlük temizlikte 1 kova suya 1 çay bardağı.",
     "ingredients":["Bitkisel içerik"],
     "surfaces":["camasir","arac","mutfak","zemin"],
     "variants":[{"label":"750 ml","price":150},{"label":"5 kg","price":0}],
     "images":["/img/urunler/sihirli-su-sise.webp","/img/urunler/sihirli-su-750ml.webp","/img/urunler/sihirli-su-5kg.webp"]},

    {"slug":"harc-beton-temizleyici","name":"Harç ve Beton Temizleyici","cat":"profesyonel","color":"#C9971C","sort":10,
     "tagline":"İnşaat sonrası harç ve kireç artıklarını söker.","surfaces":["profesyonel","zemin"],
     "variants":[{"label":"750 ml","price":0},{"label":"5 kg","price":0}],
     "images":["/img/urunler/harc-beton-temizleyici-750ml.webp","/img/urunler/harc-beton-temizleyici-5kg.webp"]},
    {"slug":"elde-bulasik-deterjani","name":"Elde Bulaşık Deterjanı","cat":"mutfak","color":"#E3B21B","sort":11,
     "tagline":"Elde bulaşık yıkama için.","surfaces":["mutfak"],
     "variants":[{"label":"750 ml","price":0},{"label":"5 kg","price":0}],
     "images":["/img/urunler/elde-bulasik-deterjani-750ml.webp","/img/urunler/elde-bulasik-deterjani-5kg.webp"]},
    {"slug":"bulasik-makinesi-deterjani","name":"Bulaşık Makinesi Deterjanı","cat":"mutfak","color":"#3A7BD5","sort":12,
     "tagline":"Bulaşık makineleri için sıvı deterjan.","surfaces":["mutfak"],
     "variants":[{"label":"750 ml","price":0},{"label":"5 kg","price":0}],
     "images":["/img/urunler/bulasik-makinesi-deterjani-750ml.webp","/img/urunler/bulasik-makinesi-deterjani-5kg.webp"]},
    {"slug":"bulasik-makinesi-parlaticisi","name":"Bulaşık Makinesi Parlatıcısı","cat":"mutfak","color":"#6BB6E8","sort":13,
     "tagline":"Bulaşık makinesi için parlatıcı.","surfaces":["mutfak"],
     "variants":[{"label":"750 ml","price":0},{"label":"5 kg","price":0}],
     "images":["/img/urunler/bulasik-makinesi-parlaticisi-750ml.webp","/img/urunler/bulasik-makinesi-parlaticisi-5kg.webp"]},
    {"slug":"bulasik-makinesi-kirec-cozucu","name":"Bulaşık Makinesi Kireç Çözücü","cat":"mutfak","color":"#8C6BC9","sort":14,
     "tagline":"Bulaşık makinesindeki kireci çözer.","surfaces":["mutfak"],
     "variants":[{"label":"750 ml","price":0},{"label":"5 kg","price":0}],
     "images":["/img/urunler/bulasik-makinesi-kirec-cozucu-750ml.webp","/img/urunler/bulasik-makinesi-kirec-cozucu-5kg.webp"]},
    {"slug":"kirec-pas-sokucu","name":"Kireç ve Pas Sökücü","cat":"banyo","color":"#B5462F","sort":15,
     "tagline":"Kireç ve pas lekelerini söker.","surfaces":["banyo","mutfak"],
     "variants":[{"label":"750 ml","price":0},{"label":"5 kg","price":0}],
     "images":["/img/urunler/kirec-pas-sokucu-750ml.webp","/img/urunler/kirec-pas-sokucu-5kg.webp"]},
    {"slug":"krom-parlatici","name":"Krom Parlatıcı","cat":"banyo","color":"#7A8C99","sort":16,
     "tagline":"Krom ve çelik yüzeyleri parlatır.","surfaces":["banyo","mutfak"],
     "variants":[{"label":"750 ml","price":0},{"label":"5 kg","price":0}],
     "images":["/img/urunler/krom-parlatici-750ml.webp","/img/urunler/krom-parlatici-5kg.webp"]},
    {"slug":"cam-sil","name":"Cam Sil","cat":"genel","color":"#4FB3D9","sort":17,
     "tagline":"Cam ve ayna temizleyici.","surfaces":["cam"],
     "variants":[{"label":"750 ml","price":0},{"label":"5 kg","price":0}],
     "images":["/img/urunler/cam-sil-750ml.webp","/img/urunler/cam-sil-5kg.webp"]},
    {"slug":"yuzey-temizleyici-kokulu","name":"Kokulu Yüzey Temizleyici","cat":"genel","color":"#9A6FC4","sort":18,
     "tagline":"Zemin ve geniş yüzeyler için kokulu temizleyici.","surfaces":["zemin"],
     "variants":[{"label":"5 kg","price":0},{"label":"20 kg","price":0}],
     "images":["/img/urunler/yuzey-temizleyici-kokulu-5kg.webp","/img/urunler/yuzey-temizleyici-kokulu-20kg.webp"]},
    {"slug":"gold-shine","name":"Gold Shine","cat":"genel","color":"#D4A72C","sort":19,
     "tagline":null,"surfaces":["zemin"],
     "variants":[{"label":"5 kg","price":0},{"label":"20 kg","price":0}],
     "images":["/img/urunler/gold-shine-5kg.webp","/img/urunler/gold-shine-20kg.webp"]},
    {"slug":"oda-parfumu","name":"Oda Parfümü","cat":"genel","color":"#D96BA0","sort":20,
     "tagline":"Ortama kalıcı ferahlık verir.","surfaces":["zemin"],
     "variants":[{"label":"750 ml","price":0},{"label":"5 kg","price":0}],
     "images":["/img/urunler/oda-parfumu-750ml.webp","/img/urunler/oda-parfumu-5kg.webp"]},
    {"slug":"hali-sampuani","name":"Halı Şampuanı","cat":"tekstil","color":"#4E9A8F","sort":21,
     "tagline":"Halı ve koltuk yıkama için.","surfaces":["camasir","zemin"],
     "variants":[{"label":"5 kg","price":0}],
     "images":["/img/urunler/hali-sampuani-5kg.webp"]},
    {"slug":"arac-seramik-katkili-cila","name":"Seramik Katkılı Cila","cat":"arac","color":"#2F3F8F","sort":30,
     "tagline":"Araç boyası için seramik katkılı cila.","surfaces":["arac"],
     "variants":[{"label":"750 ml","price":0}],"images":["/img/urunler/arac-seramik-katkili-cila-750ml.webp"]},
    {"slug":"arac-jant-lastik-temizleyici","name":"Jant ve Lastik Temizleyici","cat":"arac","color":"#C23B3B","sort":31,
     "tagline":"Jant ve lastikteki fren tozunu ve kiri temizler.","surfaces":["arac"],
     "variants":[{"label":"750 ml","price":0}],"images":["/img/urunler/arac-jant-lastik-temizleyici-750ml.webp"]},
    {"slug":"arac-konsantre-oto-sampuani","name":"Konsantre Oto Şampuanı","cat":"arac","color":"#2B8FD6","sort":32,
     "tagline":"Araç yıkama için konsantre şampuan.","surfaces":["arac"],
     "variants":[{"label":"750 ml","price":0}],"images":["/img/urunler/arac-konsantre-oto-sampuani-750ml.webp"]},
    {"slug":"arac-pink-fusion-oto-sampuani","name":"Pink Fusion Oto Şampuanı","cat":"arac","color":"#E05A9C","sort":33,
     "tagline":"Araç yıkama şampuanı.","surfaces":["arac"],
     "variants":[{"label":"Standart","price":0}],"images":["/img/urunler/arac-pink-fusion-oto-sampuani.webp"]},
    {"slug":"arac-nikelaj-inox-krom-temizleyici","name":"Nikelaj, İnox ve Krom Temizleyici","cat":"arac","color":"#6E7F8D","sort":34,
     "tagline":"Nikelaj, inox ve krom aksamı temizler.","surfaces":["arac"],
     "variants":[{"label":"750 ml","price":0}],"images":["/img/urunler/arac-nikelaj-inox-krom-temizleyici-750ml.webp"]},
    {"slug":"arac-lastik-parlatici","name":"Lastik Parlatıcı","cat":"arac","color":"#33363B","sort":35,
     "tagline":"Lastiklere parlaklık verir.","surfaces":["arac"],
     "variants":[{"label":"750 ml","price":0}],"images":["/img/urunler/arac-lastik-parlatici-750ml.webp"]},
    {"slug":"arac-motor-temizleyici","name":"Motor Temizleyici","cat":"arac","color":"#D9782B","sort":36,
     "tagline":"Motor bölmesindeki yağ ve kiri temizler.","surfaces":["arac"],
     "variants":[{"label":"750 ml","price":0}],"images":["/img/urunler/arac-motor-temizleyici-750ml.webp"]},
    {"slug":"arac-torpido-plastik-parlatici","name":"Torpido ve Plastik Parlatıcı","cat":"arac","color":"#5A6B3A","sort":37,
     "tagline":"Torpido ve iç plastikleri parlatır.","surfaces":["arac"],
     "variants":[{"label":"750 ml","price":0}],"images":["/img/urunler/arac-torpido-plastik-parlatici-750ml.webp"]}
  ]$json$::jsonb) as x(slug text, name text, cat text, color text, featured boolean, active boolean, sort int,
                       tagline text, description text, usage text, ingredients jsonb, surfaces jsonb,
                       variants jsonb, images jsonb)
),
ins as (
  insert into public.products (slug, name, tagline, description, usage, ingredients, surfaces, color,
                               category_id, featured, active, sort)
  select d.slug, d.name, d.tagline, d.description, d.usage,
         coalesce(array(select jsonb_array_elements_text(d.ingredients)), '{}'),
         coalesce(array(select jsonb_array_elements_text(d.surfaces)), '{}'),
         d.color, c.id, coalesce(d.featured, false), coalesce(d.active, false), d.sort
  from data d left join public.categories c on c.slug = d.cat
  on conflict (slug) do nothing
  returning id, slug
),
v as (
  insert into public.product_variants (product_id, label, price, in_stock, sort)
  select ins.id, e.value->>'label', (e.value->>'price')::numeric, true, e.ordinality::int
  from ins join data d on d.slug = ins.slug
  cross join lateral jsonb_array_elements(d.variants) with ordinality e
  returning id
)
insert into public.product_images (product_id, path, alt, sort)
select ins.id, e.value #>> '{}', d.name, e.ordinality::int
from ins join data d on d.slug = ins.slug
cross join lateral jsonb_array_elements(d.images) with ordinality e;

-- 4'lü Mix Paket (eski sitedeki paket: 4 x 750 ml, 500 TL)
insert into public.bundles (slug, name, description, price, active, sort)
values ('dortlu-mix', '4''lü Mix Paket',
        'Mutfak, banyo, cam ve genel temizlik için dört ürün tek pakette: Yağçöz, WC Banyo, Silikonlu ve Sihirli Su.',
        500, true, 1)
on conflict (slug) do nothing;

insert into public.bundle_items (bundle_id, variant_id, quantity)
select b.id, pv.id, 1
from public.bundles b
join public.products p on p.slug in ('yagcoz','wc-banyo','silikonlu','sihirli-su')
join public.product_variants pv on pv.product_id = p.id and pv.label = '750 ml'
where b.slug = 'dortlu-mix'
on conflict do nothing;
