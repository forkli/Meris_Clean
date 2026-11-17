import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/** /panel altındaki istekler: Supabase oturumunu yeniler, giriş yoksa giriş sayfasına yollar. */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data } = await supabase.auth.getUser();
  const isLogin = request.nextUrl.pathname.startsWith("/panel/giris");
  if (!data.user && !isLogin) {
    const to = request.nextUrl.clone();
    to.pathname = "/panel/giris";
    to.search = "";
    return NextResponse.redirect(to);
  }
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export const config = { matcher: ["/panel", "/panel/:path*"] };
