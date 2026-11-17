import "server-only";

/** Zorunlu ortam değişkeni. Eksikse sessizce varsayılana düşmek yerine hata verir. */
export function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Ortam değişkeni eksik: ${name}. Vercel > Settings > Environment Variables bölümüne ekleyin.`);
  return v;
}

export function siteUrl(): string {
  return (process.env.SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}
