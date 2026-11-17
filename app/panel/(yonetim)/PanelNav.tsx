"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "../auth-actions";

const LINKS = [
  { href: "/panel/urunler", label: "Ürünler" },
  { href: "/panel/paketler", label: "Paketler" },
  { href: "/panel/kategoriler", label: "Kategoriler" },
  { href: "/panel/siparisler", label: "Siparişler" },
  { href: "/panel/ayarlar", label: "Kargo & ayarlar" },
];

export function PanelNav({ email }: { email: string }) {
  const path = usePathname();
  const links = LINKS.map((l) => (
    <Link key={l.href} href={l.href} aria-current={path.startsWith(l.href) ? "page" : undefined}>{l.label}</Link>
  ));
  return (
    <>
      <aside className="pn-side">
        <span className="brand-word">MERİS <span>CLEAN</span></span>
        {links}
        <div className="grow" />
        <a href="/" target="_blank" rel="noopener">Siteyi aç ↗</a>
        <form action={signOut}><button>Çıkış ({email})</button></form>
      </aside>
      <nav className="pn-mobile-nav" aria-label="Panel">
        {links}
        <form action={signOut}><button>Çıkış</button></form>
      </nav>
    </>
  );
}
