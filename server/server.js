// Lokal geliştirme için — Vercel'de bu dosya çalışmaz
const app  = require('./app');
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`\n✅ Meris Clean sunucusu → http://localhost:${PORT}`);
  console.log(`   Admin:  http://localhost:${PORT}/panel-mc9x4k7z`);
  console.log(`   Ortam:  ${process.env.IYZICO_BASE_URL?.includes('sandbox') ? '🧪 SANDBOX' : '🔴 CANLI'}\n`);
});
