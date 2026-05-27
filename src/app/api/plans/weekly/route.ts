// /api/plans/weekly  GET=getir  POST=üret (gemini→başarısızsa kişisel yedek)

import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/user";
import { prependGoalsSummary, tryGenerateWeeklyPlanWithAi } from "@/lib/ai-weekly-plan";
import { buildWeeklyPlan } from "@/lib/weekly-plan";

export const dynamic = "force-dynamic";

function weekRange(now: Date) {
  const day = now.getDay();
  const diffToMonday = (day + 6) % 7;
  const start = new Date(now);
  start.setDate(now.getDate() - diffToMonday);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { start: iso(start), end: iso(end) };
}

function goalsHaveDetail(
  goals: { title: string; description: string | null }[],
): boolean {
  return goals.some(
    (g) =>
      g.title.trim().length >= 3 &&
      (g.description?.trim().length ?? 0) >= 25,
  );
}

export async function GET() {
  try {
    const user = await requireUser();
    const latest = await prisma.weeklyPlan.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    // Kayıtlı plan metnindeki kuyruğa göre kaynağı tahmin et (yalnızca bilgi).
    let planSource: "gemini" | "personal_fallback" | null = null;
    if (latest) {
      planSource = latest.workoutPlan.includes("(Gemini)") ? "gemini" : "personal_fallback";
    }
    return NextResponse.json(
      { plan: latest, planSource },
      { headers: { "Cache-Control": "private, no-store, must-revalidate" } },
    );
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

/** Hedef + Gemini ile plan üretir. Gemini ulaşılamazsa kullanıcıya özel yedek plan (paylaşılan şablon değil). */
export async function POST() {
  try {
    const user = await requireUser();
    const full = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        goals: { orderBy: { targetDate: "asc" } },
        metrics: { orderBy: { measuredAt: "desc" }, take: 1 },
      },
    });
    if (!full) {
      return NextResponse.json({ error: "Kullanici bulunamadi." }, { status: 404 });
    }

    // yeni hesapta plan yok → önce hedef gerekiyor
    if (full.goals.length === 0) {
      return NextResponse.json(
        {
          error: "Önce en az bir hedef ekle.",
          code: "NEEDS_GOALS",
          plan: null,
          planSource: null,
          planNote:
            "Antrenman ve beslenme programı yok. Hedef başlığı ve detayını yazıp «AI ile program oluştur»a bas.",
        },
        { status: 400 },
      );
    }

    // ≥25 karakter detay → AI iyi plan yazsın
    if (!goalsHaveDetail(full.goals)) {
      return NextResponse.json(
        {
          error: "Hedef detayı yetersiz.",
          code: "NEEDS_GOAL_DETAIL",
          plan: null,
          planSource: null,
          planNote:
            "En az bir hedefte detay alanına en az 25 karakter yaz (gün sayısı, ekipman, sağlık notu, beslenme tercihi vb.). AI buna göre sıfırdan plan yazar.",
        },
        { status: 400 },
      );
    }

    const { start, end } = weekRange(new Date());
    const now = new Date();
    const latestMetric = full.metrics[0] ?? null;
    const displayName =
      [full.name, full.surname].filter(Boolean).join(" ").trim() || full.email;

    // randomUUID → her istek için farklı tohum
    const ai = await tryGenerateWeeklyPlanWithAi({
      userId: full.id,
      uniquenessSeed: randomUUID(),
      goalFocus: full.goalFocus,
      heightCm: full.heightCm,
      displayName,
      goals: full.goals.map((g) => ({
        title: g.title,
        description: g.description,
        targetDate: g.targetDate,
      })),
      latestWeightKg: latestMetric?.weightKg ?? null,
      bodyFatPercent: latestMetric?.bodyFatPercent ?? null,
    });

    const stamp = now.toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" });

    let workoutPlan: string;
    let mealPlan: string;
    let planSource: "gemini" | "personal_fallback";
    let planNote: string | null = null;

    if (ai.ok) {
      const tail = `\n\n───\nSon güncelleme: ${stamp} · Hedeflerine göre (Gemini) üretildi`;
      workoutPlan = `${ai.workoutPlan}${tail}`;
      mealPlan = `${ai.mealPlan}${tail}`;
      planSource = "gemini";
    } else {
      // yedek = userSalt + goalSalt → buildWeeklyPlan rotation
      // şablon DEĞİL, her kullanıcı/hedef farklı varyant
      const userSalt = [...user.id].reduce((s, c) => s + c.charCodeAt(0), 0);
      const goalSalt = [...(full.goals[0]?.title ?? "")].reduce(
        (s, c) => s + c.charCodeAt(0),
        0,
      );
      const generated = buildWeeklyPlan(full.goalFocus, userSalt + goalSalt, now);
      const merged = prependGoalsSummary(generated.workoutPlan, generated.mealPlan, full.goals);
      const tail = `\n\n───\nSon güncelleme: ${stamp} · Yedek (kişisel) plan — Gemini şu an yanıt vermedi`;
      workoutPlan = `${merged.workoutPlan}${tail}`;
      mealPlan = `${merged.mealPlan}${tail}`;
      planSource = "personal_fallback";
      planNote = ai.reason;
    }

    // upsert = update + insert
    const plan = await prisma.weeklyPlan.upsert({
      where: { userId_weekStart: { userId: user.id, weekStart: start } },
      create: {
        userId: user.id,
        weekStart: start,
        weekEnd: end,
        focus: full.goalFocus,
        workoutPlan,
        mealPlan,
      },
      update: {
        focus: full.goalFocus,
        workoutPlan,
        mealPlan,
        weekEnd: end,
      },
    });

    return NextResponse.json(
      {
        plan,
        planSource,
        planNote,
      },
      { headers: { "Cache-Control": "private, no-store, must-revalidate" } },
    );
  } catch (e) {
    console.error("[plans/weekly POST]", e);
    return NextResponse.json({ error: "Plan olusturulamadi." }, { status: 401 });
  }
}
