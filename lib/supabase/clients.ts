import "server-only";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

/** Herkese açık okuma (vitrin). Oturum taşımaz, sayfalar önbelleğe alınabilir. */
export function publicClient() {
  return createClient(env("SUPABASE_URL"), env("SUPABASE_ANON_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Panel: giriş yapmış kullanıcının oturumuyla çalışır; RLS yönetici yetkisini denetler. */
export async function sessionClient() {
  const store = await cookies();
  return createServerClient(env("SUPABASE_URL"), env("SUPABASE_ANON_KEY"), {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // Server Component içinden çağrıldığında cookie yazılamaz; proxy oturumu yeniler.
        }
      },
    },
  });
}

/** Sunucuya özel tam yetkili istemci. Yalnızca sipariş kaydı ve doğrulanmış yönetici işlemleri için. */
export function serviceClient() {
  return createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
