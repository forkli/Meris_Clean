import Link from "next/link";
import Image from "next/image";
import type { Category } from "@/lib/types";
import { Instagram, WhatsApp } from "@/components/icons";

export function Footer({ categories }: { categories: Category[] }) {
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="foot-grid">
          <div>
            <p style={{ maxWidth: "38ch" }}>
              Meris Clean, Prolinex ürünlerinin Türkiye distribütörüdür. Siparişler aynı gün hazırlanır, 1–3 iş gününde kapına gelir.
            </p>
          </div>
          <div>
            <h2>Ürünler</h2>
            <ul>
              {categories.map((c) => (
                <li key={c.id}><Link href={`/urunler?kategori=${c.slug}`}>{c.name}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h2>Bilgi</h2>
            <ul>
              <li><Link href="/iade">İade ve iptal</Link></li>
              <li><Link href="/mesafeli-satis">Mesafeli satış sözleşmesi</Link></li>
              <li><Link href="/kvkk">KVKK aydınlatma metni</Link></li>
              <li><Link href="/gizlilik">Gizlilik politikası</Link></li>
            </ul>
          </div>
          <div>
            <h2>İletişim</h2>
            <ul>
              <li><a href="tel:+905523953548">0552 395 35 48</a></li>
              <li><a href="mailto:info@merisclean.com">info@merisclean.com</a></li>
              <li><a href="https://www.instagram.com/meris.clean/" target="_blank" rel="noopener" style={{ display: "inline-flex", gap: 6, alignItems: "center" }}><Instagram width={18} height={18} /> @meris.clean</a></li>
              <li><a href="https://wa.me/905523953548" target="_blank" rel="noopener" style={{ display: "inline-flex", gap: 6, alignItems: "center" }}><WhatsApp width={18} height={18} /> WhatsApp</a></li>
            </ul>
          </div>
        </div>
        <p className="foot-word" aria-hidden="true">Berrak.</p>
        <div className="foot-bottom">
          <span>© {new Date().getFullYear()} Meris Group · Menteşe, Muğla</span>
          <Image src="/img/iyzico/logo_band_white.svg" alt="iyzico ile öde, Visa, Mastercard, Troy" width={260} height={24} />
        </div>
      </div>
    </footer>
  );
}
