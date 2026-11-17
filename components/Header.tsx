"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { Bag, BottleMark, Close, Menu } from "@/components/icons";

const LINKS = [
  { href: "/urunler", label: "Tüm ürünler" },
  { href: "/urunler?yuzey=mutfak", label: "Mutfak" },
  { href: "/urunler?yuzey=banyo", label: "Banyo" },
  { href: "/urunler?yuzey=arac", label: "Araç" },
  { href: "/paket/dortlu-mix", label: "Paket" },
];

export function Header() {
  const { totals, setOpen, bump, ready } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  // Sayfa değişince menüyü kapat
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMenu(false), [pathname]);

  return (
    <header className="site-header" data-scrolled={scrolled}>
      <div className="wrap">
        <Link href="/" className="brand" aria-label="Meris Clean ana sayfa">
          <BottleMark className="brand-mark" />
          <span className="brand-word">MERİS <span>CLEAN</span></span>
        </Link>
        <nav className="nav" data-open={menu} aria-label="Ana menü">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} aria-current={pathname === l.href ? "page" : undefined}>
              {l.label}
            </Link>
          ))}
        </nav>
        <button className="cart-btn" onClick={() => setOpen(true)} aria-label={`Sepet, ${totals.count} ürün`}>
          <Bag width={20} height={20} />
          <span className="cart-count" data-bump={bump > 0} key={bump}>{ready ? totals.count : 0}</span>
        </button>
        <button className="menu-btn icon-btn" onClick={() => setMenu((m) => !m)} aria-expanded={menu} aria-label={menu ? "Menüyü kapat" : "Menüyü aç"}>
          {menu ? <Close /> : <Menu />}
        </button>
      </div>
    </header>
  );
}
