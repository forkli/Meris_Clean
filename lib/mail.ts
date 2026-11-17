import "server-only";
import { Resend } from "resend";
import type { OrderItem } from "@/lib/types";

const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

type Order = {
  id: string; buyer_name: string; buyer_email: string; buyer_phone: string; buyer_address: string;
  city: string | null; district: string | null; items: OrderItem[]; subtotal: number; shipping_fee: number; total_price: number;
};

/** Yeni sipariş bildirimi. Anahtar yoksa ya da gönderim başarısızsa siparişi etkilemez. */
export async function sendOrderNotification(o: Order) {
  const key = process.env.RESEND_API_KEY, to = process.env.ORDER_NOTIFY_EMAIL;
  if (!key || !to) return;
  const rows = o.items
    .map((i) => `<tr><td style="padding:6px 0">${esc(i.name)} <span style="color:#666">(${esc(i.label)})</span></td><td style="text-align:right">${i.qty} × ${i.unit_price.toFixed(2)} TL</td></tr>`)
    .join("");
  const html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#0E4C5A">
  <h2 style="margin:0 0 8px">Yeni sipariş: ${esc(o.id)}</h2>
  <p style="margin:0 0 16px;color:#476770">Ödeme iyzico tarafından onaylandı.</p>
  <table style="width:100%;border-collapse:collapse;font-size:14px">${rows}
    <tr><td style="padding-top:10px;border-top:1px solid #ddd">Ürünler</td><td style="text-align:right;padding-top:10px;border-top:1px solid #ddd">${o.subtotal.toFixed(2)} TL</td></tr>
    <tr><td>Kargo</td><td style="text-align:right">${o.shipping_fee.toFixed(2)} TL</td></tr>
    <tr><td style="font-weight:700">Toplam</td><td style="text-align:right;font-weight:700">${o.total_price.toFixed(2)} TL</td></tr>
  </table>
  <h3 style="margin:24px 0 8px">Teslimat</h3>
  <p style="margin:0;line-height:1.6">${esc(o.buyer_name)}<br>${esc(o.buyer_phone)} · ${esc(o.buyer_email)}<br>${esc(o.buyer_address)}<br>${esc(o.district)} / ${esc(o.city)}</p>
</div>`;
  try {
    await new Resend(key).emails.send({ from: "Meris Clean <bildirim@merisclean.com>", to, subject: `Yeni sipariş ${o.id} — ${o.total_price.toFixed(2)} TL`, html });
  } catch (e) {
    console.error("Sipariş e-postası gönderilemedi", e);
  }
}
