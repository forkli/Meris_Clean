import { CartProvider } from "@/components/cart/CartProvider";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WhatsApp } from "@/components/icons";
import { getCategories, getSettings } from "@/lib/catalog";

// Sayfalar istek anında çizilir; veri lib/catalog.ts içinde önbelleklenir (derleme veritabanına bağlanmaz).
export const dynamic = "force-dynamic";

export default async function VitrinLayout({ children }: { children: React.ReactNode }) {
  const [settings, categories] = await Promise.all([getSettings(), getCategories()]);
  return (
    <CartProvider settings={settings}>
      <a href="#icerik" className="skip">İçeriğe geç</a>
      <Header />
      <main id="icerik">{children}</main>
      <Footer categories={categories} />
      <a className="wa-float" href="https://wa.me/905523953548" target="_blank" rel="noopener" aria-label="WhatsApp'tan yaz">
        <WhatsApp />
      </a>
      <CartDrawer />
    </CartProvider>
  );
}
