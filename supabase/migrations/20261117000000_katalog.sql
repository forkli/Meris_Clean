-- Meris Clean v2: ürün kataloğu, paketler, ayarlar, yöneticiler ve sipariş güvenliği.
-- Supabase SQL Editor'de bir kez çalıştırılır. Tekrar çalıştırmak güvenlidir (idempotent).

create extension if not exists pgcrypto;

-- ─── Yöneticiler ────────────────────────────────────────────────
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- ─── Kategoriler ────────────────────────────────────────────────
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  sort int not null default 0,
  created_at timestamptz not null default now()
);

-- ─── Ürünler ────────────────────────────────────────────────────
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  tagline text,                       -- kısa satır: "Fırın, ocak ve aspiratör yağı"
  description text,                   -- uzun açıklama (paragraflar \n\n ile)
  usage text,                         -- kullanım talimatı
  ingredients text[] not null default '{}',
  surfaces text[] not null default '{}', -- mutfak, banyo, cam, arac, camasir, zemin, profesyonel
  color text not null default '#0E4C5A', -- sıvı rengi
  category_id uuid references public.categories(id) on delete set null,
  featured boolean not null default false,
  active boolean not null default true,
  sort int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists products_active_sort on public.products (active, sort);

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  label text not null,                -- "750 ml", "5 kg"
  sku text,
  price numeric(10,2) not null check (price >= 0),
  compare_at_price numeric(10,2) check (compare_at_price is null or compare_at_price >= 0),
  in_stock boolean not null default true,
  sort int not null default 0
);
create index if not exists product_variants_product on public.product_variants (product_id, sort);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  path text not null,                 -- storage yolu (product-images bucket) ya da /img/... yerel yol
  alt text,
  sort int not null default 0
);
create index if not exists product_images_product on public.product_images (product_id, sort);

-- ─── Paketler ───────────────────────────────────────────────────
create table if not exists public.bundles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  price numeric(10,2) not null check (price >= 0),
  active boolean not null default true,
  sort int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.bundle_items (
  bundle_id uuid not null references public.bundles(id) on delete cascade,
  variant_id uuid not null references public.product_variants(id) on delete cascade,
  quantity int not null default 1 check (quantity > 0),
  primary key (bundle_id, variant_id)
);

-- ─── Ayarlar (tek satır) ────────────────────────────────────────
create table if not exists public.settings (
  id int primary key default 1 check (id = 1),
  shipping_fee numeric(10,2) not null default 60,
  free_shipping_threshold numeric(10,2) not null default 1000,
  min_order_amount numeric(10,2) not null default 500,
  updated_at timestamptz not null default now()
);
insert into public.settings (id) values (1) on conflict (id) do nothing;

-- ─── Siparişler (mevcut tablo korunur, eksikler eklenir) ────────
create table if not exists public.orders (
  id text primary key,
  buyer_name text, buyer_email text, buyer_phone text, buyer_address text,
  product_name text, product_code text, quantity int, unit_price numeric,
  shipping_fee numeric, total_price numeric,
  payment_id text, status text not null default 'bekliyor',
  tracking_no text, note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);
alter table public.orders add column if not exists items jsonb;
alter table public.orders add column if not exists subtotal numeric;
alter table public.orders add column if not exists city text;
alter table public.orders add column if not exists district text;
alter table public.orders add column if not exists iyzico_token text;
alter table public.orders add column if not exists paid_at timestamptz;
create index if not exists orders_token on public.orders (iyzico_token);

-- ─── RLS ────────────────────────────────────────────────────────
alter table public.admins enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_images enable row level security;
alter table public.bundles enable row level security;
alter table public.bundle_items enable row level security;
alter table public.settings enable row level security;
alter table public.orders enable row level security;

-- Bu tablolardaki eski politikaları temizle (özellikle orders'taki gevşek anon politikaları).
do $$
declare r record;
begin
  for r in select policyname, tablename from pg_policies
           where schemaname = 'public'
             and tablename in ('admins','categories','products','product_variants','product_images',
                               'bundles','bundle_items','settings','orders')
  loop
    execute format('drop policy %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

-- Herkes: yalnızca aktif içerik okunur.
create policy "okuma: kategoriler" on public.categories for select using (true);
create policy "okuma: aktif ürünler" on public.products for select using (active or public.is_admin());
create policy "okuma: varyantlar" on public.product_variants for select
  using (exists (select 1 from public.products p where p.id = product_id and (p.active or public.is_admin())));
create policy "okuma: görseller" on public.product_images for select
  using (exists (select 1 from public.products p where p.id = product_id and (p.active or public.is_admin())));
create policy "okuma: aktif paketler" on public.bundles for select using (active or public.is_admin());
create policy "okuma: paket içerikleri" on public.bundle_items for select using (true);
create policy "okuma: ayarlar" on public.settings for select using (true);

-- Yönetici: tam yetki.
create policy "yönetici: kategoriler" on public.categories for all using (public.is_admin()) with check (public.is_admin());
create policy "yönetici: ürünler" on public.products for all using (public.is_admin()) with check (public.is_admin());
create policy "yönetici: varyantlar" on public.product_variants for all using (public.is_admin()) with check (public.is_admin());
create policy "yönetici: görseller" on public.product_images for all using (public.is_admin()) with check (public.is_admin());
create policy "yönetici: paketler" on public.bundles for all using (public.is_admin()) with check (public.is_admin());
create policy "yönetici: paket içerikleri" on public.bundle_items for all using (public.is_admin()) with check (public.is_admin());
create policy "yönetici: ayarlar" on public.settings for update using (public.is_admin()) with check (public.is_admin());
create policy "yönetici: kendini görür" on public.admins for select using (user_id = auth.uid());

-- Siparişler: anon erişim YOK. Sunucu service role ile yazar; yönetici okur ve günceller.
create policy "yönetici: sipariş okuma" on public.orders for select using (public.is_admin());
create policy "yönetici: sipariş güncelleme" on public.orders for update using (public.is_admin()) with check (public.is_admin());

-- Anon ve authenticated rollerin orders üzerindeki doğrudan yetkileri (RLS'e ek güvence)
revoke insert, delete on public.orders from anon, authenticated;
revoke all on public.orders from anon;

-- ─── Storage: ürün görselleri ───────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880, array['image/webp','image/png','image/jpeg','image/avif'])
on conflict (id) do update set public = true;

drop policy if exists "urun gorselleri: herkes okur" on storage.objects;
drop policy if exists "urun gorselleri: yonetici yazar" on storage.objects;
drop policy if exists "urun gorselleri: yonetici siler" on storage.objects;
create policy "urun gorselleri: herkes okur" on storage.objects for select using (bucket_id = 'product-images');
create policy "urun gorselleri: yonetici yazar" on storage.objects for insert with check (bucket_id = 'product-images' and public.is_admin());
create policy "urun gorselleri: yonetici siler" on storage.objects for delete using (bucket_id = 'product-images' and public.is_admin());
