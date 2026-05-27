import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/user";

type Ctx = { params: Promise<{ userId: string }> };

export async function GET(_request: Request, context: Ctx) {
  try {
    const me = await requireUser();
    if (me.role !== "COACH") {
      return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
    }

    const { userId } = await context.params;
    const client = await prisma.user.findFirst({
      where: { id: userId, role: "USER" },
      select: {
        id: true,
        email: true,
        name: true,
        heightCm: true,
        goalFocus: true,
        createdAt: true,
        coach: { select: { id: true, name: true, title: true } },
        metrics: {
          orderBy: { measuredAt: "desc" },
          take: 40,
          select: { id: true, measuredAt: true, weightKg: true, bodyFatPercent: true },
        },
        dayLogs: {
          orderBy: { logDate: "desc" },
          take: 21,
          select: {
            logDate: true,
            trainingText: true,
            mealsText: true,
            notes: true,
            aiReport: true,
          },
        },
        goals: {
          orderBy: { targetDate: "asc" },
          select: {
            id: true,
            title: true,
            description: true,
            startDate: true,
            targetDate: true,
            durationMonths: true,
          },
        },
        photos: {
          orderBy: { takenAt: "desc" },
          take: 16,
          select: { id: true, takenAt: true, imageUrl: true, note: true },
        },
      },
    });

    if (!client) {
      return NextResponse.json({ error: "Bulunamadi." }, { status: 404 });
    }

    return NextResponse.json({ client });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
