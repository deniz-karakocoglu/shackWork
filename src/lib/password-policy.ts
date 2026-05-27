// güçlü şifre kuralları — hem formda hem sunucuda kullanıyorum

export type PasswordRule = {
  id: string;
  label: string;
  test: (password: string) => boolean;
};

/** Güçlü şifre kuralları (kayıt + şifre sıfırlama). */
export function getPasswordRules(): PasswordRule[] {
  return [
    {
      id: "length",
      label: "En az 8 karakter",
      test: (p) => p.length >= 8,
    },
    {
      // \p{Ll} → türkçe küçük harfler de
      id: "lower",
      label: "En az bir küçük harf",
      test: (p) => /\p{Ll}/u.test(p),
    },
    {
      // \p{Lu} → türkçe büyük harfler de
      id: "upper",
      label: "En az bir büyük harf",
      test: (p) => /\p{Lu}/u.test(p),
    },
    {
      id: "digit",
      label: "En az bir rakam",
      test: (p) => /\d/.test(p),
    },
    {
      id: "special",
      label: "En az bir özel karakter (!@#$%…)",
      test: (p) => /[^\p{L}\p{N}\s]/u.test(p),
    },
  ];
}

export function evaluatePassword(password: string) {
  const rules = getPasswordRules();
  return rules.map((r) => ({ ...r, passed: r.test(password) }));
}

// sunucu tarafı doğrulama (register + reset-password)
export function validatePassword(password: string): { ok: true } | { ok: false; error: string } {
  const failed = evaluatePassword(password).filter((r) => !r.passed);
  if (failed.length === 0) return { ok: true };
  return {
    ok: false,
    error: `Şifre güçlü değil: ${failed.map((f) => f.label.toLowerCase()).join(", ")}.`,
  };
}

export function isPasswordStrong(password: string): boolean {
  return validatePassword(password).ok;
}
