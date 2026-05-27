"use client";

import { PasswordStrengthHints } from "@/components/password-strength-hints";
import { isPasswordStrong } from "@/lib/password-policy";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

export default function ResetPasswordPage() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setError(null);
    if (!token) {
      setError("Bağlantı geçersiz; e-postadaki sıfırlama linkini kullan.");
      return;
    }
    if (!isPasswordStrong(newPassword)) {
      setError("Şifre güçlü değil; aşağıdaki kuralların tamamını sağla.");
      return;
    }
    if (newPassword !== confirm) {
      setError("Şifreler uyuşmuyor.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "İşlem başarısız.");
        return;
      }
      setMsg("Şifre güncellendi. Artık giriş yapabilirsin.");
      setNewPassword("");
      setConfirm("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-dvh flex items-center justify-center bg-transparent p-6 text-zinc-100">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md space-y-3 rounded-2xl border border-white/15 bg-zinc-900/75 p-6 shadow-xl shadow-black/40 backdrop-blur-md"
      >
        <h1 className="text-2xl font-semibold">Şifre sıfırla</h1>
        <p className="text-sm text-zinc-400">Yeni güçlü şifreni belirle.</p>
        {error && <p className="text-sm text-red-300">{error}</p>}
        {msg && <p className="text-sm text-emerald-300">{msg}</p>}
        <input
          type="password"
          className="w-full rounded bg-black/40 border border-white/15 px-3 py-2"
          placeholder="Yeni şifre"
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          minLength={8}
        />
        <PasswordStrengthHints password={newPassword} confirm={confirm} showConfirmMatch />
        <input
          type="password"
          className="w-full rounded bg-black/40 border border-white/15 px-3 py-2"
          placeholder="Yeni şifre (tekrar)"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          minLength={8}
        />
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded bg-emerald-600 py-2 font-semibold disabled:opacity-60"
        >
          {busy ? "Güncelleniyor…" : "Şifreyi güncelle"}
        </button>
      </form>
    </main>
  );
}
