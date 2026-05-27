import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/user";

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const where: { userId: string; logDate?: { gte: string; lte: string } } = {
      userId: user.id,
    };
    if (from && to) {
      where.logDate = { gte: from, lte: to };
    }

    const logs = await prisma.dayLog.findMany({
      where,
      orderBy: { logDate: "desc" },
      take: 120,
    });
    return NextResponse.json(logs);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const logDate = typeof body.logDate === "string" ? body.logDate.trim() : "";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(logDate)) {
      return NextResponse.json(
        { error: "logDate YYYY-MM-DD formatında olmalı." },
        { status: 400 },
      );
    }
    const trainingText =
      typeof body.trainingText === "string" ? body.trainingText : null;
    const mealsText = typeof body.mealsText === "string" ? body.mealsText : null;
    const notes = typeof body.notes === "string" ? body.notes : null;

    const log = await prisma.dayLog.upsert({
      where: {
        userId_logDate: { userId: user.id, logDate },
      },
      create: {
        userId: user.id,
        logDate,
        trainingText,
        mealsText,
        notes,
      },
      update: {
        trainingText,
        mealsText,
        notes,
      },
    });
    return NextResponse.json(log);
  } catch {
    return NextResponse.json({ error: "Günlük kaydedilemedi." }, { status: 500 });
  }
}
