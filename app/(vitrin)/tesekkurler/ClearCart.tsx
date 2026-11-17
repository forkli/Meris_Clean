"use client";

import { useEffect } from "react";
import { useCart } from "@/components/cart/CartProvider";

/** Başarılı ödemeden sonra sepeti boşaltır. */
export function ClearCart() {
  const { clear, ready } = useCart();
  useEffect(() => {
    if (ready) clear();
  }, [ready, clear]);
  return null;
}
