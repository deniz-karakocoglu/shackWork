import { NextResponse } from "next/server";
import { consumeResetTokenAndSetPassword } from "@/lib/password-reset";
import { validatePassword } from "@/lib/password-policy";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const token = typeof body.token === "string" ? body.token.trim() : "";
    const newPassword =
      typeof body.newPassword === "string" ? body.newPassword : "";

    if (!token) {
      return NextResponse.json({ error: "Token gerekli." }, { status: 400 });
    }
    const pwCheck = validatePassword(newPassword);
    if (!pwCheck.ok) {
      return NextResponse.json({ error: pwCheck.error }, { status: 400 });
    }

    const result = await consumeResetTokenAndSetPassword(token, newPassword);
    if (!result.ok) {
      const msg =
        result.reason === "expired"
          ? "Token suresi dolmus."
          : result.reason === "used"
            ? "Token zaten kullanilmis."
            : "Token gecersiz.";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    return NextResponse.json({ ok: true, message: "Sifren basariyla guncellendi." });
  } catch {
    return NextResponse.json({ error: "Sifre guncellenemedi." }, { status: 500 });
  }
}
