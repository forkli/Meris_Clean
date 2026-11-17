import { NextResponse, type NextRequest } from "next/server";
import { randomBytes } from "node:crypto";
import { priceCart, CartError } from "@/lib/pricing";
import { checkoutInitialize, Iyzipay } from "@/lib/iyzico";
import { serviceClient } from "@/lib/supabase/clients";
import { siteUrl } from "@/lib/env";
import type { CartLine } from "@/lib/types";

export const runtime = "nodejs";

type Body = {
  lines: CartLine[];
  buyer: { name: string; email: string; phone: string; address: string; city: string; district: string; tckn?: string };
  consent: boolean;
};

const bad = (msg: string, status = 400) => NextResponse.json({ error: msg }, { status });
const str = (v: unknown, max = 300) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return bad("İstek okunamadı.");
  }

  const b = body?.buyer ?? ({} as Body["buyer"]);
  const name = str(b.name, 120), email = str(b.email, 160), address = str(b.address, 400), city = str(b.city, 60), district = str(b.district, 60);
  const phoneDigits = str(b.phone, 30).replace(/\D/g, "").replace(/^90/, "").replace(/^0/, "");
  const tckn = str(b.tckn, 11).replace(/\D/g, "");

  if (name.split(/\s+/).length < 2) return bad("Ad ve soyadını birlikte yaz.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return bad("E-posta adresi geçerli görünmüyor.");
  if (!/^5\d{9}$/.test(phoneDigits)) return bad("Telefon numarasını 05xx xxx xx xx biçiminde yaz.");
  if (address.length < 10 || !city || !district) return bad("Teslimat adresini, ilçeyi ve ili eksiksiz yaz.");
  if (tckn && tckn.length !== 11) return bad("T.C. kimlik numarası 11 haneli olmalı.");
  if (!body.consent) return bad("Devam etmek için mesafeli satış sözleşmesini onaylaman gerekiyor.");

  let priced;
  try {
    priced = await priceCart(Array.isArray(body.lines) ? body.lines : []);
  } catch (e) {
    if (e instanceof CartError) return bad(e.message, 409);
    console.error(e);
    return bad("Sepet hesaplanamadı. Biraz sonra tekrar dene.", 500);
  }

  const orderId = `MC-${Date.now().toString(36).toUpperCase()}-${randomBytes(3).toString("hex").toUpperCase()}`;
  const [firstName, ...rest] = name.split(/\s+/);
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "85.34.78.112";
  const fullAddress = `${address}, ${district}/${city}`;
  const money = (n: number) => n.toFixed(2);

  const basketItems = priced.items.map((i, k) => ({
    id: `${i.kind}-${k}`,
    name: `${i.name} ${i.label} x${i.qty}`.slice(0, 120),
    category1: "Temizlik",
    itemType: Iyzipay.BASKET_ITEM_TYPE.PHYSICAL,
    price: money(i.line_total),
  }));
  if (priced.shipping > 0) {
    basketItems.push({ id: "kargo", name: "Kargo", category1: "Kargo", itemType: Iyzipay.BASKET_ITEM_TYPE.PHYSICAL, price: money(priced.shipping) });
  }

  const db = serviceClient();
  const { error: insErr } = await db.from("orders").insert({
    id: orderId,
    buyer_name: name, buyer_email: email, buyer_phone: "0" + phoneDigits, buyer_address: address, city, district,
    items: priced.items, subtotal: priced.subtotal, shipping_fee: priced.shipping, total_price: priced.total,
    product_name: priced.items.map((i) => `${i.name} (${i.label}) x${i.qty}`).join(", ").slice(0, 500),
    quantity: priced.items.reduce((t, i) => t + i.qty, 0),
    status: "odeme_bekleniyor",
  });
  if (insErr) {
    console.error("Sipariş kaydı oluşturulamadı", insErr);
    return bad("Sipariş oluşturulamadı. Biraz sonra tekrar dene.", 500);
  }

  try {
    const res = await checkoutInitialize({
      locale: Iyzipay.LOCALE.TR,
      conversationId: orderId,
      price: money(priced.total),
      paidPrice: money(priced.total),
      currency: Iyzipay.CURRENCY.TRY,
      basketId: orderId,
      paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
      callbackUrl: `${siteUrl()}/api/odeme/sonuc`,
      enabledInstallments: [1],
      buyer: {
        id: `BUYER-${orderId}`,
        name: firstName,
        surname: rest.join(" "),
        gsmNumber: "+90" + phoneDigits,
        email,
        identityNumber: tckn || "11111111111",
        registrationAddress: fullAddress,
        ip,
        city,
        country: "Turkey",
      },
      shippingAddress: { contactName: name, city, country: "Turkey", address: fullAddress },
      billingAddress: { contactName: name, city, country: "Turkey", address: fullAddress },
      basketItems,
    });

    if (res.status !== "success" || typeof res.paymentPageUrl !== "string" || typeof res.token !== "string") {
      console.error("iyzico başlatma hatası", res.errorCode, res.errorMessage);
      await db.from("orders").update({ status: "odeme_basarisiz", note: String(res.errorMessage ?? "") }).eq("id", orderId);
      return bad("Ödeme sayfası açılamadı. Bilgilerini kontrol edip tekrar dene.", 502);
    }
    await db.from("orders").update({ iyzico_token: res.token }).eq("id", orderId);
    return NextResponse.json({ paymentPageUrl: res.paymentPageUrl, orderId });
  } catch (e) {
    console.error("iyzico bağlantı hatası", e);
    await db.from("orders").update({ status: "odeme_basarisiz" }).eq("id", orderId);
    return bad("Ödeme sistemine bağlanılamadı. Biraz sonra tekrar dene.", 502);
  }
}
