import type { NextConfig } from "next";

const supabaseHost = (() => {
  try {
    return new URL(process.env.SUPABASE_URL ?? "").hostname;
  } catch {
    return "oexlktaltdvqobefydqu.supabase.co";
  }
})();

const nextConfig: NextConfig = {
  // iyzipay kaynak dosyalarını çalışma anında klasörden okur; paketlenmeden Node'dan yüklenmeli.
  serverExternalPackages: ["iyzipay"],
  images: {
    remotePatterns: [{ protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/**" }],
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    serverActions: { bodySizeLimit: "8mb" },
  },
  async redirects() {
    // Eski statik sayfa adresleri (reklam linkleri bozulmasın)
    return [
      { source: "/yagcoz", destination: "/urun/yagcoz", permanent: true },
      { source: "/wc-banyo", destination: "/urun/wc-banyo", permanent: true },
      { source: "/silikonlu", destination: "/urun/silikonlu", permanent: true },
      { source: "/sihirli-su", destination: "/urun/sihirli-su", permanent: true },
      { source: "/paket", destination: "/paket/dortlu-mix", permanent: true },
      { source: "/tesekkurler.html", destination: "/tesekkurler", permanent: true },
      { source: "/panel-mc9x4k7z/:path*", destination: "/panel", permanent: false },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ];
  },
};

export default nextConfig;
