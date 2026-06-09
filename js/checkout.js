/* ============================================================
   Meris Clean — Checkout & Cart Logic
   ============================================================ */

const SHIPPING_FEE = 60;
const FREE_SHIPPING_THRESHOLD = 1000;
const MIN_QTY = 4; // bireysel ürünler için

/**
 * Sipariş sayfasını başlat
 * @param {Object} config
 *   - unitPrice: number (birim fiyat)
 *   - isBundle: boolean (paket ise true, min qty 1)
 *   - qtyStep: number (artış adımı)
 */
function initOrderBox(config) {
  const { unitPrice, isBundle = false, qtyStep = isBundle ? 1 : 4 } = config;
  const minQty = isBundle ? 1 : MIN_QTY;

  let qty = minQty;

  const qtyValueEl  = document.getElementById('qty-value');
  const qtyUnitEl   = document.getElementById('qty-unit');
  const btnMinus    = document.getElementById('btn-minus');
  const btnPlus     = document.getElementById('btn-plus');
  const rowSubtotal = document.getElementById('row-subtotal');
  const rowShipping = document.getElementById('row-shipping');
  const rowTotal    = document.getElementById('row-total');
  const upsellEl    = document.getElementById('upsell-banner');
  const shippingEl  = document.getElementById('shipping-banner');
  const btnBuy      = document.getElementById('btn-buy');
  const summaryEl   = document.getElementById('checkout-summary');

  function render() {
    const subtotal = qty * unitPrice;
    const shippingFree = subtotal >= FREE_SHIPPING_THRESHOLD;
    const shipping = shippingFree ? 0 : SHIPPING_FEE;
    const total = subtotal + shipping;

    // Qty display
    if (isBundle) {
      qtyValueEl.textContent = qty;
      qtyUnitEl.textContent  = qty === 1 ? 'set' : 'set';
    } else {
      qtyValueEl.textContent = qty;
      qtyUnitEl.textContent  = 'adet';
    }

    // Minus button — don't go below minimum
    btnMinus.disabled = (qty <= minQty);

    // Prices
    rowSubtotal.textContent = subtotal.toLocaleString('tr-TR') + ' TL';
    rowTotal.textContent    = total.toLocaleString('tr-TR') + ' TL';

    if (shippingFree) {
      rowShipping.innerHTML = '<span class="free">Ücretsiz 🎉</span>';
      shippingEl && shippingEl.classList.add('show');
      upsellEl   && upsellEl.classList.remove('show');
    } else {
      rowShipping.textContent = SHIPPING_FEE + ' TL';
      shippingEl && shippingEl.classList.remove('show');

      // Upsell: kaç TL kaldı?
      if (upsellEl) {
        const remaining = FREE_SHIPPING_THRESHOLD - subtotal;
        upsellEl.innerHTML = `🚚 <strong>${remaining.toLocaleString('tr-TR')} TL</strong> daha ekle, kargo bedava!`;
        upsellEl.classList.add('show');
      }
    }

    // Buy button label
    if (btnBuy) {
      btnBuy.querySelector('.btn-total').textContent =
        total.toLocaleString('tr-TR') + ' TL öde';
    }

    // Checkout summary (visible when checkout opens)
    if (summaryEl) {
      summaryEl.innerHTML = `
        <div class="price-row">
          <span>Ürün toplam</span><span>${subtotal.toLocaleString('tr-TR')} TL</span>
        </div>
        <div class="price-row">
          <span>Kargo</span>
          <span>${shippingFree ? '<span class="free">Ücretsiz</span>' : SHIPPING_FEE + ' TL'}</span>
        </div>
        <div class="price-row total">
          <span>Toplam</span><span class="highlight">${total.toLocaleString('tr-TR')} TL</span>
        </div>
      `;
    }
  }

  btnMinus.addEventListener('click', () => {
    if (qty - qtyStep >= minQty) { qty -= qtyStep; render(); }
  });

  btnPlus.addEventListener('click', () => {
    qty += qtyStep; render();
  });

  // İlk render
  render();

  // "Hemen Sipariş Ver" → checkout açılır
  if (btnBuy) {
    btnBuy.addEventListener('click', () => {
      const cs = document.getElementById('checkout-section');
      if (cs) {
        cs.classList.add('show');
        cs.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }
}

/* ─── Form Doğrulama ──────────────────────────────────────────── */
function initCheckoutForm() {
  const form = document.getElementById('checkout-form');
  if (!form) return;

  // Kart no formatla
  const cardInput = document.getElementById('card-number');
  if (cardInput) {
    cardInput.addEventListener('input', (e) => {
      let v = e.target.value.replace(/\D/g, '').substring(0, 16);
      e.target.value = v.replace(/(.{4})/g, '$1 ').trim();
    });
  }

  // Son kullanma tarihi
  const expiry = document.getElementById('card-expiry');
  if (expiry) {
    expiry.addEventListener('input', (e) => {
      let v = e.target.value.replace(/\D/g, '').substring(0, 4);
      if (v.length >= 2) v = v.substring(0,2) + '/' + v.substring(2);
      e.target.value = v;
    });
  }

  // CVV
  const cvv = document.getElementById('card-cvv');
  if (cvv) {
    cvv.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/\D/g, '').substring(0, 3);
    });
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    submitPayment(form);
  });
}

/* ─── Ödeme Gönder (İyzico) ───────────────────────────────────── */
async function submitPayment(form) {
  const btn = form.querySelector('.btn-pay');
  const originalText = btn.innerHTML;

  btn.innerHTML = '<span class="spinner">⏳</span> İşleniyor...';
  btn.disabled = true;

  const data = {
    cardHolderName: form['card-name'].value,
    cardNumber:     form['card-number'].value.replace(/\s/g, ''),
    expireMonth:    form['card-expiry'].value.split('/')[0],
    expireYear:     '20' + (form['card-expiry'].value.split('/')[1] || ''),
    cvc:            form['card-cvv'].value,
    // Sipariş bilgisi global state'den alınır
    ...getOrderData(),
  };

  try {
    const res = await fetch('/api/payment/initialize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result = await res.json();

    if (result.status === 'success') {
      window.location.href = '/tesekkurler.html?order=' + result.paymentId;
    } else if (result.threeDSHtmlContent) {
      // 3D Secure sayfasına yönlendir
      document.body.innerHTML = atob(result.threeDSHtmlContent);
    } else {
      showError(result.errorMessage || 'Ödeme sırasında bir hata oluştu.');
      btn.innerHTML = originalText;
      btn.disabled = false;
    }
  } catch (err) {
    showError('Sunucuya bağlanılamadı. Lütfen tekrar deneyin.');
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
}

function showError(msg) {
  let el = document.getElementById('payment-error');
  if (!el) {
    el = document.createElement('div');
    el.id = 'payment-error';
    el.style.cssText = `
      background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3);
      color: #fca5a5; border-radius: 8px; padding: 12px 16px;
      font-size: 0.85rem; margin-top: 12px; text-align: center;
    `;
    document.querySelector('.checkout-wrapper')?.appendChild(el);
  }
  el.textContent = msg;
}

/* Sipariş verisini global'den al (her sayfada window.orderData set edilir) */
function getOrderData() {
  return window.orderData || {};
}

/* ─── Scroll Reveal ───────────────────────────────────────────── */
function initReveal() {
  const els = document.querySelectorAll('.reveal');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  els.forEach(el => observer.observe(el));
}

/* ─── Navbar scroll effect ────────────────────────────────────── */
function initNavbar() {
  const nav = document.querySelector('.navbar');
  if (!nav) return;
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });
}

/* ─── FAQ Accordion ───────────────────────────────────────────── */
function initFaq() {
  document.querySelectorAll('.faq-q').forEach(q => {
    q.addEventListener('click', () => {
      const item = q.closest('.faq-item');
      item.classList.toggle('open');
    });
  });
}

/* ─── Burger Menu ─────────────────────────────────────────────── */
function initBurger() {
  const burger = document.getElementById('burger');
  const navLinks = document.getElementById('nav-links');
  if (!burger || !navLinks) return;

  burger.addEventListener('click', () => {
    const open = burger.classList.toggle('open');
    navLinks.classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });

  // Linke tıklayınca menüyü kapat
  navLinks.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      burger.classList.remove('open');
      navLinks.classList.remove('open');
      document.body.style.overflow = '';
    });
  });

  // Dışarı tıklayınca kapat
  navLinks.addEventListener('click', e => {
    if (e.target === navLinks) {
      burger.classList.remove('open');
      navLinks.classList.remove('open');
      document.body.style.overflow = '';
    }
  });
}

/* ─── Init All ────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initReveal();
  initFaq();
  initCheckoutForm();
  initBurger();
});
