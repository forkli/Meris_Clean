"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Settings } from "@/lib/types";

/** Sepet satırı. Fiyat burada yalnızca gösterim içindir; ödeme tutarını sunucu veritabanından hesaplar. */
export type CartItem = {
  kind: "variant" | "bundle";
  id: string;
  qty: number;
  name: string;
  label: string;
  price: number;
  image: string;
  color: string;
  href: string;
};

type Totals = { subtotal: number; shipping: number; total: number; freeLeft: number; minLeft: number; count: number };

type Ctx = {
  items: CartItem[];
  ready: boolean;
  open: boolean;
  bump: number;
  settings: Settings;
  totals: Totals;
  setOpen: (o: boolean) => void;
  add: (item: Omit<CartItem, "qty">, qty?: number) => void;
  setQty: (kind: CartItem["kind"], id: string, qty: number) => void;
  remove: (kind: CartItem["kind"], id: string) => void;
  clear: () => void;
};

const CartContext = createContext<Ctx | null>(null);
const KEY = "mc-sepet-v2";
const MAX_QTY = 50;

export function computeTotals(items: CartItem[], s: Settings): Totals {
  const subtotal = items.reduce((t, i) => t + i.price * i.qty, 0);
  const shipping = subtotal === 0 || subtotal >= s.free_shipping_threshold ? 0 : s.shipping_fee;
  return {
    subtotal,
    shipping,
    total: subtotal + shipping,
    freeLeft: Math.max(0, s.free_shipping_threshold - subtotal),
    minLeft: Math.max(0, s.min_order_amount - subtotal),
    count: items.reduce((t, i) => t + i.qty, 0),
  };
}

export function CartProvider({ settings, children }: { settings: Settings; children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [bump, setBump] = useState(0);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- tarayıcı deposundan ilk yükleme
      if (raw) setItems(JSON.parse(raw));
    } catch {
      /* gizli sekme vb. — boş sepetle devam */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {
      /* yok say */
    }
  }, [items, ready]);

  const add = useCallback((item: Omit<CartItem, "qty">, qty = 1) => {
    setItems((prev) => {
      const found = prev.find((p) => p.kind === item.kind && p.id === item.id);
      if (found) return prev.map((p) => (p === found ? { ...p, ...item, qty: Math.min(MAX_QTY, p.qty + qty) } : p));
      return [...prev, { ...item, qty: Math.min(MAX_QTY, qty) }];
    });
    setBump((b) => b + 1);
  }, []);

  const setQty = useCallback((kind: CartItem["kind"], id: string, qty: number) => {
    setItems((prev) =>
      qty <= 0 ? prev.filter((p) => !(p.kind === kind && p.id === id)) : prev.map((p) => (p.kind === kind && p.id === id ? { ...p, qty: Math.min(MAX_QTY, qty) } : p)),
    );
  }, []);

  const remove = useCallback((kind: CartItem["kind"], id: string) => {
    setItems((prev) => prev.filter((p) => !(p.kind === kind && p.id === id)));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<Ctx>(
    () => ({ items, ready, open, bump, settings, totals: computeTotals(items, settings), setOpen, add, setQty, remove, clear }),
    [items, ready, open, bump, settings, add, setQty, remove, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart, CartProvider içinde kullanılmalı");
  return ctx;
}
