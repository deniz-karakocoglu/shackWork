import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/user";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** Geliştirme: Gemini anahtarı ve hedef durumu (anahtar değeri dönmez). */
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });
  }

  const key = process.env.GEMINI_API_KEY?.trim();
  const goalsCount = await prisma.goal.count({ where: { userId: user.id } });

  if (!key) {
    return NextResponse.json({
      ok: false,
      keyConfigured: false,
      goalsCount,
      message: ".env dosyasında GEMINI_API_KEY= satırı yok veya boş. Sunucuyu yeniden başlat.",
    });
  }

  const model = process.env.GEMINI_MODEL?.trim() || "gemini-2.0-flash";
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "Merhaba" }] }],
          generationConfig: { maxOutputTokens: 16 },
        }),
      },
    );
    const body = (await res.json().catch(() => ({}))) as {
      error?: { message?: string; status?: string };
      candidates?: unknown[];
    };
    if (!res.ok) {
      return NextResponse.json({
        ok: false,
        keyConfigured: true,
        goalsCount,
        model,
        message:
          body.error?.message ??
          `Gemini HTTP ${res.status}. Anahtarı AI Studio'dan yenile; eski anahtar iptal edilmiş olabilir.`,
      });
    }
    return NextResponse.json({
      ok: true,
      keyConfigured: true,
      goalsCount,
      model,
      message:
        goalsCount > 0
          ? "Gemini çalışıyor. Panelde «Şimdi yenile» ile haftalık planı üret."
          : "Gemini çalışıyor; haftalık AI planı için önce en az bir hedef ekle.",
    });
  } catch (e) {
    return NextResponse.json({
      ok: false,
      keyConfigured: true,
      goalsCount,
      message: e instanceof Error ? e.message : "Ağ hatası",
    });
  }
}
