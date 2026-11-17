import { NextResponse, type NextRequest } from "next/server";
import { checkoutRetrieve } from "@/lib/iyzico";
import { serviceClient } from "@/lib/supabase/clients";
import { sendOrderNotification } from "@/lib/mail";
import { siteUrl } from "@/lib/env";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";

const go = (path: string) => NextResponse.redirect(`${siteUrl()}${path}`, 303);

/**
 * iyzico ödeme sonrası buraya POST eder. Gelen veriye GÜVENİLMEZ: token ile ödeme iyzico'dan
 * yeniden sorgulanır; tutar ve sipariş no eşleşmezse sipariş onaylanmaz.
 */
export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  const token = form?.get("token");
  if (typeof token !== "string" || token.length < 10) return go("/odeme-hatasi");

  const db = serviceClient();
  const { data: order } = await db.from("orders").select("*").eq("iyzico_token", token).maybeSingle();
  if (!order) return go("/odeme-hatasi");
  if (order.status !== "odeme_bekleniyor" && order.status !== "odeme_basarisiz") {
    return go(`/tesekkurler?siparis=${encodeURIComponent(order.id)}`); // zaten işlendi
  }

  let res: Record<string, unknown>;
  try {
    res = await checkoutRetrieve(token, order.id);
  } catch (e) {
    console.error("iyzico sorgu hatası", e);
    return go(`/odeme-hatasi?siparis=${encodeURIComponent(order.id)}`);
  }

  const paidOk =
    res.status === "success" &&
    res.paymentStatus === "SUCCESS" &&
    res.basketId === order.id &&
    Math.abs(Number(res.paidPrice) - Number(order.total_price)) < 0.01;

  if (!paidOk) {
    await db.from("orders").update({ status: "odeme_basarisiz", note: String(res.errorMessage ?? res.paymentStatus ?? "") }).eq("id", order.id);
    return go(`/odeme-hatasi?siparis=${encodeURIComponent(order.id)}`);
  }

  const { data: updated } = await db
    .from("orders")
    .update({ status: "bekliyor", payment_id: String(res.paymentId ?? ""), paid_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", order.id)
    .eq("status", order.status) // aynı anda gelen ikinci bildirimde iki kez işlenmesin
    .select("*")
    .maybeSingle();

  if (updated) {
    await sendOrderNotification({
      ...updated,
      items: updated.items ?? [],
      subtotal: Number(updated.subtotal),
      shipping_fee: Number(updated.shipping_fee),
      total_price: Number(updated.total_price),
    });
    revalidatePath("/panel/siparisler");
  }
  return go(`/tesekkurler?siparis=${encodeURIComponent(order.id)}`);
}
