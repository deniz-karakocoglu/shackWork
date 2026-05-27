import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createResetToken } from "@/lib/password-reset";
import { sendMail } from "@/lib/mailer";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Gecerli email gerekli." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    // Guvenlik: email var/yok bilgisi aciga cikmasin
    if (!user) {
      return NextResponse.json({
        ok: true,
        message: "Eger email kayitliysa sifre sifirlama linki gonderildi.",
      });
    }

    const token = await createResetToken(user.id);
    const baseUrl = process.env.APP_BASE_URL ?? "http://localhost:3000";
    const resetUrl = `${baseUrl}/sifre-sifirla?token=${encodeURIComponent(token)}`;

    const sent = await sendMail({
      to: user.email,
      subject: "shackWork sifre sifirlama",
      text: `Merhaba,\n\nSifreni yenilemek icin bu linki ac:\n${resetUrl}\n\nBu link 1 saat gecerlidir.`,
      html: `<p>Merhaba,</p><p>Sifreni yenilemek icin <a href="${resetUrl}">buraya tikla</a>.</p><p>Bu link 1 saat gecerlidir.</p>`,
    });

    if (!sent) {
      console.log("[shackWork] SMTP yok veya mail gonderilemedi. Reset link:", resetUrl);
    }

    return NextResponse.json({
      ok: true,
      message: "Eger email kayitliysa sifre sifirlama linki gonderildi.",
    });
  } catch {
    return NextResponse.json({ error: "Istek islenemedi." }, { status: 500 });
  }
}
