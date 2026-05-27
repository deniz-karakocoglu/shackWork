import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/user";

export async function GET() {
  try {
    const me = await requireUser();
    if (me.role !== "COACH") {
      return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
    }

    const clients = await prisma.user.findMany({
      where: { role: "USER" },
      select: {
        id: true,
        email: true,
        name: true,
        goalFocus: true,
        createdAt: true,
        coach: { select: { id: true, name: true } },
        _count: { select: { metrics: true, dayLogs: true, goals: true, photos: true } },
        metrics: {
          orderBy: { measuredAt: "desc" },
          take: 1,
          select: { measuredAt: true, weightKg: true, bodyFatPercent: true },
        },
        dayLogs: {
          orderBy: { logDate: "desc" },
          take: 1,
          select: { logDate: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 80,
    });

    return NextResponse.json({ clients });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
