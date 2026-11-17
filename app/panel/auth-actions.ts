"use server";

import { redirect } from "next/navigation";
import { sessionClient } from "@/lib/supabase/clients";

export async function signIn(_: unknown, fd: FormData): Promise<{ error?: string }> {
  const email = String(fd.get("email") ?? "").trim();
  const password = String(fd.get("password") ?? "");
  if (!email || !password) return { error: "E-posta ve şifreyi yaz." };
  const db = await sessionClient();
  const { error } = await db.auth.signInWithPassword({ email, password });
  if (error) return { error: "E-posta ya da şifre hatalı." };
  const { data: isAdmin } = await db.rpc("is_admin");
  if (!isAdmin) {
    await db.auth.signOut();
    return { error: "Bu hesabın panele erişim yetkisi yok." };
  }
  redirect("/panel/urunler");
}

export async function signOut() {
  const db = await sessionClient();
  await db.auth.signOut();
  redirect("/panel/giris");
}
