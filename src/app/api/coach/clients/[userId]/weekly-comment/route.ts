import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/user";
import { generateCoachWeeklyComment } from "@/lib/coach-comment";

type Ctx = { params: Promise<{ userId: string }> };

export async function POST(_request: Request, context: Ctx) {
  try {
    const me = await requireUser();
    if (me.role !== "COACH") {
      return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
    }
    const { userId } = await context.params;
    const user = await prisma.user.findFirst({
      where: { id: userId, role: "USER" },
      select: {
        id: true,
        name: true,
        goalFocus: true,
        goals: {
          where: { targetDate: { gte: new Date() } },
          orderBy: { targetDate: "asc" },
          take: 3,
          select: { title: true },
        },
        metrics: {
          orderBy: { measuredAt: "desc" },
          take: 1,
          select: { weightKg: true, bodyFatPercent: true },
        },
        dayLogs: {
          orderBy: { logDate: "desc" },
          take: 7,
          select: { logDate: true, trainingText: true, mealsText: true, notes: true },
        },
      },
    });
    if (!user) {
      return NextResponse.json({ error: "Kullanici bulunamadi." }, { status: 404 });
    }

    const latestMetric = user.metrics[0];
    const comment = await generateCoachWeeklyComment({
      userName: user.name,
      goalFocus: user.goalFocus,
      latestWeight: latestMetric?.weightKg ?? null,
      latestBodyFatPercent: latestMetric?.bodyFatPercent ?? null,
      activeGoals: user.goals.map((g) => g.title),
      recentLogs: user.dayLogs,
    });

    return NextResponse.json({ comment });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
