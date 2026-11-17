"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { signIn } from "../auth-actions";

function Form() {
  const [state, action, pending] = useActionState(signIn, {});
  const hata = useSearchParams().get("hata");
  const error = state.error ?? (hata === "yetki" ? "Bu hesabın panele erişim yetkisi yok." : null);
  return (
    <form action={action}>
      <p className="brand-word" style={{ fontSize: 30 }}>MERİS <span>CLEAN</span> · Panel</p>
      <div className="field">
        <label htmlFor="email">E-posta</label>
        <input id="email" name="email" type="email" className="input" autoComplete="username" required />
      </div>
      <div className="field">
        <label htmlFor="password">Şifre</label>
        <input id="password" name="password" type="password" className="input" autoComplete="current-password" required />
      </div>
      {error && <p className="alert alert-error" role="alert">{error}</p>}
      <button className="btn btn-block" disabled={pending}>{pending ? "Giriş yapılıyor…" : "Giriş yap"}</button>
    </form>
  );
}

export default function Giris() {
  return (
    <main className="pn-login">
      <Suspense><Form /></Suspense>
    </main>
  );
}
