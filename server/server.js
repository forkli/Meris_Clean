/**
 * Meris Clean — İyzico Ödeme Sunucusu
 *
 * Kurulum:
 *   cd server && npm install && node server.js
 *
 * .env dosyasını doldurun (server/.env):
 *   IYZICO_API_KEY=...
 *   IYZICO_SECRET_KEY=...
 *   IYZICO_BASE_URL=https://sandbox-api.iyzipay.com  (test)
 *   PORT=3000
 */

require('dotenv').config();
const express   = require('express');
const cors      = require('cors');
const Iyzipay   = require('iyzipay');
const path      = require('path');
const crypto    = require('crypto');
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Statik dosyaları sun (site klasörü)
app.use(express.static(path.join(__dirname, '..')));

app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || '*',
}));

// ─── İyzico Yapılandırması ─────────────────────────────────────
const iyzipay = new Iyzipay({
  apiKey:    process.env.IYZICO_API_KEY    || 'sandbox-afXhYFfBxcNbPfuVBzXqPLFwHbrUMkAb',
  secretKey: process.env.IYZICO_SECRET_KEY || 'sandbox-mSKDfPTGz8Rp1fJVpKFIPanPEAKUPKBH',
  uri:       process.env.IYZICO_BASE_URL   || 'https://sandbox-api.iyzipay.com',
});

// ─── Yardımcı: Sipariş ID Üret ────────────────────────────────
function generateOrderId() {
  return 'MC-' + Date.now() + '-' + crypto.randomBytes(3).toString('hex').toUpperCase();
}

// ─── POST /api/payment/initialize ────────────────────────────
app.post('/api/payment/initialize', async (req, res) => {
  const {
    cardHolderName, cardNumber, expireMonth, expireYear, cvc,
    // Alıcı bilgileri
    buyerName, buyerEmail, buyerPhone, buyerAddress,
    // Ürün bilgisi (frontend'den gelir)
    productName, productCode, quantity, unitPrice, totalPrice, shippingPrice,
  } = req.body;

  // Temel doğrulama
  if (!cardNumber || !expireMonth || !expireYear || !cvc) {
    return res.status(400).json({ status: 'failure', errorMessage: 'Kart bilgileri eksik.' });
  }

  const orderId       = generateOrderId();
  const parsedTotal   = parseFloat(totalPrice)    || 560;
  const parsedShip    = parseFloat(shippingPrice) || 0;
  const parsedProduct = parsedTotal - parsedShip;

  const request = {
    locale:          Iyzipay.LOCALE.TR,
    conversationId:  orderId,
    price:           parsedTotal.toFixed(2),
    paidPrice:       parsedTotal.toFixed(2),
    currency:        Iyzipay.CURRENCY.TRY,
    installment:     '1',
    basketId:        orderId,
    paymentChannel:  Iyzipay.PAYMENT_CHANNEL.WEB,
    paymentGroup:    Iyzipay.PAYMENT_GROUP.PRODUCT,

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
      identityNumber:      '74300864791', // Test - canlıda gerçek TC istenmez zorunlu değil
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
    iyzipay.payment.create(request, (err, result) => {
      if (err) {
        console.error('İyzico bağlantı hatası:', err);
        return res.status(500).json({ status: 'failure', errorMessage: 'Ödeme sistemi bağlantı hatası.' });
      }

      if (result.status === 'success') {
        // Sipariş bildirim e-postası gönder
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
    <tr><td style="padding:6px 0;color:#888">Ürün Kodu</td><td style="padding:6px 0">${productCode || '—'}</td></tr>
    <tr><td style="padding:6px 0;color:#888">Adet</td><td style="padding:6px 0">${quantity || '—'}</td></tr>
    <tr><td style="padding:6px 0;color:#888">Birim Fiyat</td><td style="padding:6px 0">${unitPrice ? unitPrice + ' TL' : '—'}</td></tr>
    <tr><td style="padding:6px 0;color:#888">Kargo</td><td style="padding:6px 0">${shippingPrice ? shippingPrice + ' TL' : '0 TL'}</td></tr>
    <tr style="background:#f0f0f0"><td style="padding:8px 6px;color:#040e1c;font-weight:700">Toplam</td><td style="padding:8px 6px;font-weight:700;font-size:1.1em">${parsedTotal.toFixed(2)} TL</td></tr>
  </table>

  <hr style="border:none;border-top:1px solid #ddd;margin:16px 0">
  <p style="color:#aaa;font-size:0.8em">İyzico Ödeme ID: ${result.paymentId}</p>
</div>`,
        }).catch(err => console.error('E-posta gönderilemedi:', err));

        return res.json({
          status:    'success',
          paymentId: result.paymentId,
          orderId,
        });
      }

      // 3D Secure gerekiyorsa
      if (result.threeDSHtmlContent) {
        return res.json({
          status:            'threeds',
          threeDSHtmlContent: result.threeDSHtmlContent,
        });
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
// İyzico 3D Secure sonrası bu URL'e POST yapar
app.post('/api/payment/3ds-callback', (req, res) => {
  const { status, conversationId } = req.body;

  if (status === 'success') {
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
  console.log(`   Paket:   http://localhost:${PORT}/paket/`);
  console.log(`   Yağçöz:  http://localhost:${PORT}/yagcoz/`);
  console.log(`   Ortam:   ${process.env.IYZICO_BASE_URL?.includes('sandbox') ? '🧪 SANDBOX' : '🔴 CANLI'}\n`);
});
