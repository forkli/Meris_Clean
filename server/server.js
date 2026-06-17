require('dotenv').config();
const express          = require('express');
const cors             = require('cors');
const Iyzipay          = require('iyzipay');
const path             = require('path');
const crypto           = require('crypto');
const { Resend }       = require('resend');
const { createClient } = require('@supabase/supabase-js');
const session          = require('express-session');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret:            process.env.SESSION_SECRET || 'meris-ses-2026',
  resave:            false,
  saveUninitialized: false,
  cookie:            { maxAge: 24 * 60 * 60 * 1000 }, // 1 gün
}));
app.use(express.static(path.join(__dirname, '..')));
app.use(cors({ origin: process.env.ALLOWED_ORIGIN || '*' }));

// ─── Servisler ────────────────────────────────────────────────
const resend = new Resend(process.env.RESEND_API_KEY);

const supabase = createClient(
  process.env.SUPABASE_URL      || 'https://oexlktaltdvqobefydqu.supabase.co',
  process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9leGxrdGFsdGR2cW9iZWZ5ZHF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3MTIzMjIsImV4cCI6MjA5NzI4ODMyMn0.VvR3YPHk3CnsFmwAGcpptcxErhB992GNKC0MrhZCUp0'
);

const iyzipay = new Iyzipay({
  apiKey:    process.env.IYZICO_API_KEY    || 'sandbox-afXhYFfBxcNbPfuVBzXqPLFwHbrUMkAb',
  secretKey: process.env.IYZICO_SECRET_KEY || 'sandbox-mSKDfPTGz8Rp1fJVpKFIPanPEAKUPKBH',
  uri:       process.env.IYZICO_BASE_URL   || 'https://sandbox-api.iyzipay.com',
});

// ─── Yardımcılar ──────────────────────────────────────────────
function generateOrderId() {
  return 'MC-' + Date.now() + '-' + crypto.randomBytes(3).toString('hex').toUpperCase();
}

// ─── Admin Panel ──────────────────────────────────────────────
const ADMIN_PATH     = '/panel-mc9x4k7z';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Irem.mericlean.2026!';

const STATUS_MAP = {
  bekliyor:        '🕐 Bekliyor',
  hazirlaniyor:    '📦 Hazırlanıyor',
  kargoya_verildi: '🚚 Kargoya Verildi',
  teslim_edildi:   '✅ Teslim Edildi',
  iade_talebi:     '🔄 İade Talebi',
  iade_edildi:     '↩️ İade Edildi',
  iptal:           '❌ İptal Edildi',
};

const STATUS_COLORS = {
  bekliyor:        '#f59e0b',
  hazirlaniyor:    '#3b82f6',
  kargoya_verildi: '#8b5cf6',
  teslim_edildi:   '#10b981',
  iade_talebi:     '#f97316',
  iade_edildi:     '#6b7280',
  iptal:           '#ef4444',
};

function adminLayout(title, body) {
  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${title} — Meris Clean Yönetim</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Segoe UI',Arial,sans-serif;background:#040e1c;color:#e2e8f0;min-height:100vh}
    a{color:#00c8d7;text-decoration:none}
    a:hover{text-decoration:underline}
    .topbar{background:#071525;border-bottom:1px solid rgba(0,200,215,0.15);padding:14px 28px;display:flex;align-items:center;justify-content:space-between}
    .topbar-brand{font-size:1rem;font-weight:700;letter-spacing:.04em;color:#fff}
    .topbar-brand em{color:#00c8d7;font-style:normal}
    .topbar-nav{display:flex;gap:20px;align-items:center;font-size:0.85rem}
    .content{max-width:1100px;margin:0 auto;padding:32px 20px}
    .page-title{font-size:1.4rem;font-weight:700;margin-bottom:24px;color:#fff}
    .card{background:#071525;border:1px solid rgba(0,200,215,0.1);border-radius:10px;padding:24px}
    .btn{display:inline-flex;align-items:center;gap:6px;padding:8px 18px;border-radius:6px;font-size:0.82rem;font-weight:600;cursor:pointer;border:none;transition:opacity .15s}
    .btn:hover{opacity:.85}
    .btn-primary{background:#00c8d7;color:#040e1c}
    .btn-ghost{background:rgba(0,200,215,0.1);color:#00c8d7;border:1px solid rgba(0,200,215,0.25)}
    .btn-danger{background:#ef4444;color:#fff}
    table{width:100%;border-collapse:collapse;font-size:0.85rem}
    th{text-align:left;padding:10px 12px;color:#64748b;font-weight:600;border-bottom:1px solid rgba(255,255,255,0.06);white-space:nowrap}
    td{padding:11px 12px;border-bottom:1px solid rgba(255,255,255,0.04);vertical-align:middle}
    tr:hover td{background:rgba(255,255,255,0.02)}
    .badge{display:inline-block;padding:3px 10px;border-radius:20px;font-size:0.75rem;font-weight:600}
    .filter-tabs{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px}
    .tab{padding:6px 16px;border-radius:20px;font-size:0.8rem;font-weight:600;cursor:pointer;border:1px solid rgba(255,255,255,0.1);color:#94a3b8;text-decoration:none}
    .tab:hover{border-color:#00c8d7;color:#00c8d7}
    .tab.active{background:#00c8d7;color:#040e1c;border-color:#00c8d7}
    .form-group{margin-bottom:16px}
    .form-label{display:block;font-size:0.8rem;color:#94a3b8;margin-bottom:6px;font-weight:600}
    .form-control{width:100%;background:#0d1f35;border:1px solid rgba(255,255,255,0.1);border-radius:6px;padding:10px 12px;color:#e2e8f0;font-size:0.88rem}
    .form-control:focus{outline:none;border-color:#00c8d7}
    select.form-control{cursor:pointer}
    .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
    .info-item .label{font-size:0.75rem;color:#64748b;margin-bottom:3px}
    .info-item .value{font-size:0.9rem;color:#e2e8f0}
    .alert{padding:12px 16px;border-radius:6px;font-size:0.85rem;margin-bottom:20px}
    .alert-success{background:rgba(16,185,129,.1);border:1px solid rgba(16,185,129,.3);color:#10b981}
    .empty{text-align:center;padding:48px;color:#475569}
    @media(max-width:640px){.info-grid{grid-template-columns:1fr}th:nth-child(n+4),td:nth-child(n+4){display:none}}
  </style>
</head>
<body>
<div class="topbar">
  <div class="topbar-brand">MERİS <em>CLEAN</em> · Yönetim</div>
  <div class="topbar-nav">
    <a href="${ADMIN_PATH}/orders">Siparişler</a>
    <a href="${ADMIN_PATH}/logout" style="color:#ef4444">Çıkış</a>
  </div>
</div>
<div class="content">${body}</div>
</body>
</html>`;
}

// GET /panel-mc9x4k7z — giriş sayfası
app.get(ADMIN_PATH, (req, res) => {
  if (req.session.isAdmin) return res.redirect(ADMIN_PATH + '/orders');
  const hata = req.query.hata;
  res.send(`<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Meris Clean Yönetim</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Segoe UI',Arial,sans-serif;background:#040e1c;color:#e2e8f0;min-height:100vh;display:flex;align-items:center;justify-content:center}
    .box{background:#071525;border:1px solid rgba(0,200,215,0.15);border-radius:12px;padding:40px;width:100%;max-width:380px}
    .brand{text-align:center;font-size:1.2rem;font-weight:700;letter-spacing:.04em;margin-bottom:28px}
    .brand em{color:#00c8d7;font-style:normal}
    .form-group{margin-bottom:16px}
    .form-label{display:block;font-size:0.8rem;color:#94a3b8;margin-bottom:6px;font-weight:600}
    input[type=password]{width:100%;background:#0d1f35;border:1px solid rgba(255,255,255,0.1);border-radius:6px;padding:11px 14px;color:#e2e8f0;font-size:0.95rem}
    input[type=password]:focus{outline:none;border-color:#00c8d7}
    button{width:100%;background:#00c8d7;color:#040e1c;border:none;border-radius:6px;padding:12px;font-size:0.95rem;font-weight:700;cursor:pointer;margin-top:8px}
    button:hover{opacity:.9}
    .error{background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.3);color:#ef4444;padding:10px 14px;border-radius:6px;font-size:0.83rem;margin-bottom:16px}
  </style>
</head>
<body>
<div class="box">
  <div class="brand">MERİS <em>CLEAN</em></div>
  ${hata ? '<div class="error">Şifre hatalı, tekrar deneyin.</div>' : ''}
  <form method="POST" action="${ADMIN_PATH}/login">
    <div class="form-group">
      <label class="form-label">Yönetim Şifresi</label>
      <input type="password" name="password" placeholder="••••••••••••" autofocus required/>
    </div>
    <button type="submit">Giriş Yap</button>
  </form>
</div>
</body>
</html>`);
});

// POST /panel-mc9x4k7z/login
app.post(ADMIN_PATH + '/login', (req, res) => {
  if (req.body.password === ADMIN_PASSWORD) {
    req.session.isAdmin = true;
    return res.redirect(ADMIN_PATH + '/orders');
  }
  res.redirect(ADMIN_PATH + '?hata=1');
});

// GET /panel-mc9x4k7z/logout
app.get(ADMIN_PATH + '/logout', (req, res) => {
  req.session.destroy();
  res.redirect(ADMIN_PATH);
});

// GET /panel-mc9x4k7z/orders — sipariş listesi
app.get(ADMIN_PATH + '/orders', async (req, res) => {
  if (!req.session.isAdmin) return res.redirect(ADMIN_PATH);

  const filter = req.query.durum || 'tumu';
  let query = supabase.from('orders').select('*').order('created_at', { ascending: false });
  if (filter !== 'tumu') query = query.eq('status', filter);
  const { data: orders = [], error } = await query;

  const counts = {};
  if (orders.length) {
    const { data: all } = await supabase.from('orders').select('status');
    (all || []).forEach(r => { counts[r.status] = (counts[r.status] || 0) + 1; });
  }

  const tabs = [
    { key: 'tumu',            label: 'Tümü' },
    { key: 'bekliyor',        label: '🕐 Bekliyor' },
    { key: 'hazirlaniyor',    label: '📦 Hazırlanıyor' },
    { key: 'kargoya_verildi', label: '🚚 Kargoya Verildi' },
    { key: 'teslim_edildi',   label: '✅ Teslim Edildi' },
    { key: 'iade_talebi',     label: '🔄 İade Talebi' },
    { key: 'iade_edildi',     label: '↩️ İade Edildi' },
    { key: 'iptal',           label: '❌ İptal' },
  ];

  const tabsHtml = tabs.map(t => {
    const cnt = t.key === 'tumu' ? (orders.length || 0) : (counts[t.key] || 0);
    return `<a href="?durum=${t.key}" class="tab ${filter === t.key ? 'active' : ''}">${t.label}${cnt ? ` <span style="opacity:.7">(${cnt})</span>` : ''}</a>`;
  }).join('');

  const rowsHtml = orders.length === 0
    ? `<tr><td colspan="6"><div class="empty">Henüz sipariş yok.</div></td></tr>`
    : orders.map(o => {
        const color  = STATUS_COLORS[o.status] || '#64748b';
        const label  = STATUS_MAP[o.status]    || o.status;
        const tarih  = new Date(o.created_at).toLocaleString('tr-TR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });
        return `<tr>
          <td style="color:#94a3b8;font-size:0.78rem">${tarih}</td>
          <td><strong>${esc(o.buyer_name || '—')}</strong><br><span style="color:#64748b;font-size:0.78rem">${esc(o.buyer_phone || '')}</span></td>
          <td>${esc(o.product_name || '—')}<br><span style="color:#64748b;font-size:0.78rem">x${o.quantity || 1}</span></td>
          <td style="font-weight:700;color:#00c8d7">${o.total_price ? Number(o.total_price).toFixed(2) + ' ₺' : '—'}</td>
          <td><span class="badge" style="background:${color}22;color:${color}">${label}</span></td>
          <td><a href="${ADMIN_PATH}/orders/${esc(o.id)}" class="btn btn-ghost" style="padding:5px 12px;font-size:0.78rem">Detay →</a></td>
        </tr>`;
      }).join('');

  const body = `
    <div class="page-title">Siparişler <span style="color:#64748b;font-size:0.9rem;font-weight:400">(${orders.length})</span></div>
    <div class="filter-tabs">${tabsHtml}</div>
    <div class="card" style="padding:0;overflow:hidden">
      <table>
        <thead><tr>
          <th>Tarih</th><th>Müşteri</th><th>Ürün</th><th>Toplam</th><th>Durum</th><th></th>
        </tr></thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    </div>`;

  res.send(adminLayout('Siparişler', body));
});

// GET /panel-mc9x4k7z/orders/:id — sipariş detayı
app.get(ADMIN_PATH + '/orders/:id', async (req, res) => {
  if (!req.session.isAdmin) return res.redirect(ADMIN_PATH);

  const { data: o, error } = await supabase.from('orders').select('*').eq('id', req.params.id).single();
  if (!o) return res.redirect(ADMIN_PATH + '/orders');

  const saved  = req.query.kaydedildi;
  const tarih  = new Date(o.created_at).toLocaleString('tr-TR', { dateStyle:'full', timeStyle:'short' });
  const color  = STATUS_COLORS[o.status] || '#64748b';
  const label  = STATUS_MAP[o.status]    || o.status;

  const statusOpts = Object.entries(STATUS_MAP).map(([val, lbl]) =>
    `<option value="${val}" ${o.status === val ? 'selected' : ''}>${lbl}</option>`
  ).join('');

  const body = `
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px">
      <a href="${ADMIN_PATH}/orders" style="color:#64748b;font-size:0.85rem">← Geri</a>
      <div class="page-title" style="margin-bottom:0">Sipariş #${esc(o.id)}</div>
      <span class="badge" style="background:${color}22;color:${color}">${label}</span>
    </div>

    ${saved ? '<div class="alert alert-success">✓ Değişiklikler kaydedildi.</div>' : ''}

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">

      <div class="card">
        <div style="font-size:0.9rem;font-weight:700;margin-bottom:16px;color:#00c8d7">Müşteri Bilgileri</div>
        <div class="info-grid" style="grid-template-columns:1fr">
          <div class="info-item" style="margin-bottom:12px"><div class="label">Ad Soyad</div><div class="value">${esc(o.buyer_name || '—')}</div></div>
          <div class="info-item" style="margin-bottom:12px"><div class="label">E-posta</div><div class="value">${esc(o.buyer_email || '—')}</div></div>
          <div class="info-item" style="margin-bottom:12px"><div class="label">Telefon</div><div class="value">${esc(o.buyer_phone || '—')}</div></div>
          <div class="info-item"><div class="label">Teslimat Adresi</div><div class="value">${esc(o.buyer_address || '—')}</div></div>
        </div>
      </div>

      <div class="card">
        <div style="font-size:0.9rem;font-weight:700;margin-bottom:16px;color:#00c8d7">Sipariş Detayı</div>
        <div class="info-grid" style="grid-template-columns:1fr">
          <div class="info-item" style="margin-bottom:12px"><div class="label">Ürün</div><div class="value">${esc(o.product_name || '—')}</div></div>
          <div class="info-item" style="margin-bottom:12px"><div class="label">Ürün Kodu</div><div class="value">${esc(o.product_code || '—')}</div></div>
          <div class="info-item" style="margin-bottom:12px"><div class="label">Adet</div><div class="value">${o.quantity || '—'}</div></div>
          <div class="info-item" style="margin-bottom:12px"><div class="label">Birim Fiyat / Kargo</div><div class="value">${o.unit_price ? Number(o.unit_price).toFixed(2) + ' ₺' : '—'} + ${o.shipping_fee ? Number(o.shipping_fee).toFixed(2) + ' ₺' : '0 ₺'}</div></div>
          <div class="info-item" style="margin-bottom:12px"><div class="label">Toplam</div><div class="value" style="font-size:1.1rem;font-weight:700;color:#00c8d7">${o.total_price ? Number(o.total_price).toFixed(2) + ' ₺' : '—'}</div></div>
          <div class="info-item" style="margin-bottom:12px"><div class="label">Sipariş Tarihi</div><div class="value" style="font-size:0.85rem">${tarih}</div></div>
          <div class="info-item"><div class="label">İyzico Ödeme ID</div><div class="value" style="font-size:0.78rem;color:#64748b">${esc(o.payment_id || '—')}</div></div>
        </div>
      </div>

    </div>

    <div class="card" style="margin-top:20px">
      <div style="font-size:0.9rem;font-weight:700;margin-bottom:16px;color:#00c8d7">Durum Güncelle</div>
      <form method="POST" action="${ADMIN_PATH}/orders/${esc(o.id)}/guncelle">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
          <div class="form-group">
            <label class="form-label">Sipariş Durumu</label>
            <select name="status" class="form-control">${statusOpts}</select>
          </div>
          <div class="form-group">
            <label class="form-label">Kargo Takip No <span style="color:#475569;font-weight:400">(isteğe bağlı)</span></label>
            <input type="text" name="tracking_no" class="form-control" value="${esc(o.tracking_no || '')}" placeholder="örn. 1234567890"/>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">İç Not <span style="color:#475569;font-weight:400">(müşteriye görünmez)</span></label>
          <textarea name="note" class="form-control" rows="3" placeholder="Notunuzu buraya yazın...">${esc(o.note || '')}</textarea>
        </div>
        <button type="submit" class="btn btn-primary">Kaydet</button>
      </form>
    </div>`;

  res.send(adminLayout('Sipariş Detayı', body));
});

// POST /panel-mc9x4k7z/orders/:id/guncelle
app.post(ADMIN_PATH + '/orders/:id/guncelle', async (req, res) => {
  if (!req.session.isAdmin) return res.redirect(ADMIN_PATH);

  const { status, tracking_no, note } = req.body;
  await supabase.from('orders').update({
    status:      status      || 'bekliyor',
    tracking_no: tracking_no || null,
    note:        note        || null,
    updated_at:  new Date().toISOString(),
  }).eq('id', req.params.id);

  res.redirect(ADMIN_PATH + '/orders/' + req.params.id + '?kaydedildi=1');
});

// ─── Yardımcı: HTML escape ────────────────────────────────────
function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─── POST /api/payment/initialize ────────────────────────────
app.post('/api/payment/initialize', async (req, res) => {
  const {
    cardHolderName, cardNumber, expireMonth, expireYear, cvc,
    buyerName, buyerEmail, buyerPhone, buyerAddress,
    productName, productCode, quantity, unitPrice, totalPrice, shippingPrice,
  } = req.body;

  if (!cardNumber || !expireMonth || !expireYear || !cvc) {
    return res.status(400).json({ status: 'failure', errorMessage: 'Kart bilgileri eksik.' });
  }

  const orderId       = generateOrderId();
  const parsedTotal   = parseFloat(totalPrice)    || 560;
  const parsedShip    = parseFloat(shippingPrice) || 0;
  const parsedProduct = parsedTotal - parsedShip;

  const request = {
    locale:         Iyzipay.LOCALE.TR,
    conversationId: orderId,
    price:          parsedTotal.toFixed(2),
    paidPrice:      parsedTotal.toFixed(2),
    currency:       Iyzipay.CURRENCY.TRY,
    installment:    '1',
    basketId:       orderId,
    paymentChannel: Iyzipay.PAYMENT_CHANNEL.WEB,
    paymentGroup:   Iyzipay.PAYMENT_GROUP.PRODUCT,

    paymentCard: {
      cardHolderName,
      cardNumber:   cardNumber.replace(/\s/g, ''),
      expireMonth,
      expireYear,
      cvc,
      registerCard: '0',
    },

    buyer: {
      id:                  'BUYER-' + Date.now(),
      name:                (buyerName || 'Müşteri').split(' ')[0],
      surname:             (buyerName || 'Müşteri Soyad').split(' ').slice(1).join(' ') || 'Müşteri',
      gsmNumber:           buyerPhone  || '+905000000000',
      email:               buyerEmail  || 'musteri@example.com',
      identityNumber:      '74300864791',
      lastLoginDate:       new Date().toISOString().replace('T', ' ').substring(0, 19),
      registrationDate:    new Date().toISOString().replace('T', ' ').substring(0, 19),
      registrationAddress: buyerAddress || 'Türkiye',
      ip:                  req.ip || '85.34.78.112',
      city:                'Istanbul',
      country:             'Turkey',
      zipCode:             '34000',
    },

    shippingAddress: {
      contactName: buyerName    || 'Müşteri',
      city:        'Istanbul',
      country:     'Turkey',
      address:     buyerAddress || 'Türkiye',
    },

    billingAddress: {
      contactName: buyerName    || 'Müşteri',
      city:        'Istanbul',
      country:     'Turkey',
      address:     buyerAddress || 'Türkiye',
    },

    basketItems: [
      {
        id:        productCode  || 'URUN-001',
        name:      productName  || 'Meris Clean Ürün',
        category1: 'Temizlik',
        category2: 'Ev Temizliği',
        itemType:  Iyzipay.BASKET_ITEM_TYPE.PHYSICAL,
        price:     parsedProduct.toFixed(2),
      },
      ...(parsedShip > 0 ? [{
        id:        'KARGO',
        name:      'Kargo Ücreti',
        category1: 'Kargo',
        category2: 'Kargo',
        itemType:  Iyzipay.BASKET_ITEM_TYPE.PHYSICAL,
        price:     parsedShip.toFixed(2),
      }] : []),
    ],
  };

  try {
    iyzipay.payment.create(request, async (err, result) => {
      if (err) {
        console.error('İyzico bağlantı hatası:', err);
        return res.status(500).json({ status: 'failure', errorMessage: 'Ödeme sistemi bağlantı hatası.' });
      }

      if (result.status === 'success') {
        // Supabase'e sipariş kaydet
        const { error: dbErr } = await supabase.from('orders').insert({
          id:           orderId,
          buyer_name:   buyerName    || null,
          buyer_email:  buyerEmail   || null,
          buyer_phone:  buyerPhone   || null,
          buyer_address: buyerAddress || null,
          product_name: productName  || null,
          product_code: productCode  || null,
          quantity:     parseInt(quantity) || 1,
          unit_price:   parseFloat(unitPrice) || null,
          shipping_fee: parsedShip,
          total_price:  parsedTotal,
          payment_id:   result.paymentId,
          status:       'bekliyor',
        });
        if (dbErr) console.error('Supabase kayıt hatası:', dbErr);

        // Bildirim e-postası gönder
        resend.emails.send({
          from:    'Meris Clean <bildirim@merisclean.com>',
          to:      'iremsaydam@merisgr.com',
          subject: `Yeni Sipariş: ${orderId} — ${productName || 'Ürün'}`,
          html: `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9f9f9;padding:24px;border-radius:8px">
  <h2 style="color:#040e1c;margin-top:0">Yeni Sipariş Alındı 🎉</h2>
  <p style="color:#555">Sipariş numarası: <strong>${orderId}</strong></p>
  <hr style="border:none;border-top:1px solid #ddd;margin:16px 0">
  <h3 style="color:#040e1c;margin-bottom:8px">Müşteri Bilgileri</h3>
  <table style="width:100%;border-collapse:collapse">
    <tr><td style="padding:6px 0;color:#888;width:140px">Ad Soyad</td><td style="padding:6px 0;font-weight:600">${buyerName || '—'}</td></tr>
    <tr><td style="padding:6px 0;color:#888">E-posta</td><td style="padding:6px 0">${buyerEmail || '—'}</td></tr>
    <tr><td style="padding:6px 0;color:#888">Telefon</td><td style="padding:6px 0">${buyerPhone || '—'}</td></tr>
    <tr><td style="padding:6px 0;color:#888">Teslimat Adresi</td><td style="padding:6px 0">${buyerAddress || '—'}</td></tr>
  </table>
  <hr style="border:none;border-top:1px solid #ddd;margin:16px 0">
  <h3 style="color:#040e1c;margin-bottom:8px">Sipariş Detayı</h3>
  <table style="width:100%;border-collapse:collapse">
    <tr><td style="padding:6px 0;color:#888;width:140px">Ürün</td><td style="padding:6px 0;font-weight:600">${productName || '—'}</td></tr>
    <tr><td style="padding:6px 0;color:#888">Adet</td><td style="padding:6px 0">${quantity || '—'}</td></tr>
    <tr><td style="padding:6px 0;color:#888">Birim Fiyat</td><td style="padding:6px 0">${unitPrice ? unitPrice + ' TL' : '—'}</td></tr>
    <tr><td style="padding:6px 0;color:#888">Kargo</td><td style="padding:6px 0">${shippingPrice ? shippingPrice + ' TL' : '0 TL'}</td></tr>
    <tr style="background:#f0f0f0"><td style="padding:8px 6px;color:#040e1c;font-weight:700">Toplam</td><td style="padding:8px 6px;font-weight:700;font-size:1.1em">${parsedTotal.toFixed(2)} TL</td></tr>
  </table>
  <hr style="border:none;border-top:1px solid #ddd;margin:16px 0">
  <p style="color:#aaa;font-size:0.8em">İyzico Ödeme ID: ${result.paymentId}</p>
</div>`,
        }).catch(e => console.error('E-posta gönderilemedi:', e));

        return res.json({ status: 'success', paymentId: result.paymentId, orderId });
      }

      if (result.threeDSHtmlContent) {
        return res.json({ status: 'threeds', threeDSHtmlContent: result.threeDSHtmlContent });
      }

      return res.json({
        status:       'failure',
        errorMessage: result.errorMessage || 'Ödeme başarısız.',
        errorCode:    result.errorCode,
      });
    });
  } catch (e) {
    console.error('Sunucu hatası:', e);
    res.status(500).json({ status: 'failure', errorMessage: 'Sunucu hatası oluştu.' });
  }
});

// ─── POST /api/payment/3ds-callback ──────────────────────────
app.post('/api/payment/3ds-callback', async (req, res) => {
  const { status, conversationId, paymentId } = req.body;

  if (status === 'success') {
    // 3DS ile gelen siparişi de Supabase'de güncelle
    await supabase.from('orders').update({ payment_id: paymentId, status: 'bekliyor' })
      .eq('id', conversationId);
    res.redirect('/tesekkurler.html?order=' + conversationId);
  } else {
    res.redirect('/odeme-hatasi.html');
  }
});

// ─── GET /api/health ──────────────────────────────────────────
app.get('/api/health', (_, res) => res.json({ ok: true, env: process.env.NODE_ENV || 'development' }));

// ─── Sunucuyu Başlat ─────────────────────────────────────────
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`\n✅ Meris Clean sunucusu başlatıldı → http://localhost:${PORT}`);
  console.log(`   Admin:   http://localhost:${PORT}${ADMIN_PATH}`);
  console.log(`   Ortam:   ${process.env.IYZICO_BASE_URL?.includes('sandbox') ? '🧪 SANDBOX' : '🔴 CANLI'}\n`);
});
