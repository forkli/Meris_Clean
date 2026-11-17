export type Category = { id: string; slug: string; name: string; sort: number };

export type Variant = {
  id: string;
  product_id: string;
  label: string;
  sku: string | null;
  price: number;
  compare_at_price: number | null;
  in_stock: boolean;
  sort: number;
};

export type ProductImage = { id: string; product_id: string; path: string; alt: string | null; sort: number };

export type Product = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  usage: string | null;
  ingredients: string[];
  surfaces: string[];
  color: string;
  category_id: string | null;
  featured: boolean;
  active: boolean;
  sort: number;
  variants: Variant[];
  images: ProductImage[];
  category?: Category | null;
};

export type BundleItem = { variant_id: string; quantity: number; variant: Variant & { product: Pick<Product, "id" | "slug" | "name" | "color"> & { images: ProductImage[] } } };

export type Bundle = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price: number;
  active: boolean;
  sort: number;
  items: BundleItem[];
};

export type Settings = { shipping_fee: number; free_shipping_threshold: number; min_order_amount: number };

export type CartLine = { kind: "variant" | "bundle"; id: string; qty: number };

export type OrderItem = { kind: "variant" | "bundle"; id: string; name: string; label: string; qty: number; unit_price: number; line_total: number };
