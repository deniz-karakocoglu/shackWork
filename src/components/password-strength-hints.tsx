"use client";

import { evaluatePassword, isPasswordStrong } from "@/lib/password-policy";

type Props = {
  password: string;
  confirm?: string;
  showConfirmMatch?: boolean;
};

export function PasswordStrengthHints({ password, confirm, showConfirmMatch }: Props) {
  const checks = evaluatePassword(password);
  const allOk = isPasswordStrong(password);
  const matchOk =
    !showConfirmMatch || confirm === undefined || confirm.length === 0 || password === confirm;

  return (
    <div className="rounded-lg border border-zinc-600/50 bg-zinc-950/70 px-3 py-2.5 text-xs">
      <p className={`mb-2 font-medium ${allOk ? "text-emerald-300" : "text-zinc-300"}`}>
        {allOk ? "Şifre güçlü görünüyor" : "Güçlü şifre için:"}
      </p>
      <ul className="space-y-1">
        {checks.map((c) => (
          <li
            key={c.id}
            className={`flex items-start gap-2 ${c.passed ? "text-emerald-300/95" : "text-zinc-400"}`}
          >
            <span aria-hidden className="mt-0.5 shrink-0 font-bold">
              {c.passed ? "✓" : "○"}
            </span>
            <span>{c.label}</span>
          </li>
        ))}
        {showConfirmMatch && confirm !== undefined && confirm.length > 0 && (
          <li
            className={`flex items-start gap-2 ${matchOk ? "text-emerald-300/95" : "text-amber-300/95"}`}
          >
            <span aria-hidden className="mt-0.5 shrink-0 font-bold">
              {matchOk ? "✓" : "○"}
            </span>
            <span>Şifreler aynı</span>
          </li>
        )}
      </ul>
    </div>
  );
}
