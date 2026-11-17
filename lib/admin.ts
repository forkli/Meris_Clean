import "server-only";
import { redirect } from "next/navigation";
import { revalidatePath, updateTag } from "next/cache";
import { sessionClient } from "@/lib/supabase/clients";

/**
 * Her panel sayfası ve işleminde çağrılır. Giriş yapmamış ya da `admins` tablosunda olmayan
 * kullanıcıyı giriş sayfasına yollar. Dönen istemci kullanıcının oturumuyla çalışır (RLS geçerli).
 */
export async function requireAdmin() {
  const db = await sessionClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) redirect("/panel/giris");
  const { data: isAdmin } = await db.rpc("is_admin");
  if (!isAdmin) redirect("/panel/giris?hata=yetki");
  return { db, user };
}

/** Panelde yapılan değişikliğin vitrine hemen yansıması için tüm vitrin sayfalarını yeniler. */
export function refreshStorefront() {
  updateTag("katalog");
  revalidatePath("/", "layout");
}
