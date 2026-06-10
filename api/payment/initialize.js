const Iyzipay = require('iyzipay');
const crypto  = require('crypto');

const iyzipay = new Iyzipay({
  apiKey:    process.env.IYZICO_API_KEY,
  secretKey: process.env.IYZICO_SECRET_KEY,
  uri:       process.env.IYZICO_BASE_URL || 'https://api.iyzipay.com',
});

function generateOrderId() {
  return 'MC-' + Date.now() + '-' + crypto.randomBytes(3).toString('hex').toUpperCase();
}

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
      ip:                  (req.headers['x-forwarded-for'] || '85.34.78.112').split(',')[0].trim(),
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

  iyzipay.payment.create(request, (err, result) => {
    if (err) {
      console.error('İyzico bağlantı hatası:', err);
      return res.status(500).json({ status: 'failure', errorMessage: 'Ödeme sistemi bağlantı hatası.' });
    }

    if (result.status === 'success') {
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
}
