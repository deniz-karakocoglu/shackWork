import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/user";
import { generateDailyReport } from "@/lib/ai-report";

type Ctx = { params: Promise<{ logDate: string }> };

export async function POST(_request: Request, context: Ctx) {
  try {
    const { logDate } = await context.params;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(logDate)) {
      return NextResponse.json({ error: "Gecersiz tarih." }, { status: 400 });
    }

    const user = await requireUser();
    const fullUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!fullUser) {
      return NextResponse.json({ error: "Kullanici yok." }, { status: 400 });
    }

    const log = await prisma.dayLog.findUnique({
      where: { userId_logDate: { userId: user.id, logDate } },
    });
    if (!log) {
      return NextResponse.json(
        { error: "Bu gune ait gunluk kaydi yok." },
        { status: 404 },
      );
    }

    const metrics = await prisma.bodyMetric.findMany({
      where: { userId: user.id },
      orderBy: { measuredAt: "desc" },
      take: 2,
    });
    const latestMetric = metrics[0] ?? null;
    const previousMetric = metrics[1] ?? null;

    const activeGoal = await prisma.goal.findFirst({
      where: { userId: user.id, targetDate: { gte: new Date() } },
      orderBy: { targetDate: "asc" },
    });

    const report = await generateDailyReport({
      user: fullUser,
      log,
      latestMetric,
      previousMetric,
      activeGoal,
    });

    const updated = await prisma.dayLog.update({
      where: { id: log.id },
      data: { aiReport: report },
    });

    return NextResponse.json({ log: updated, report });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
