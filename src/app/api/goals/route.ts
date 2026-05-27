import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/user";

export async function GET() {
  try {
    const user = await requireUser();
    const goals = await prisma.goal.findMany({
      where: { userId: user.id },
      orderBy: { targetDate: "asc" },
    });
    return NextResponse.json(goals);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const description =
      typeof body.description === "string" ? body.description.trim() : null;
    const targetDate = body.targetDate ? new Date(body.targetDate) : null;
    const durationMonths =
      body.durationMonths != null && !Number.isNaN(Number(body.durationMonths))
        ? Math.max(1, Math.floor(Number(body.durationMonths)))
        : null;

    if (!title || !targetDate || Number.isNaN(targetDate.getTime())) {
      return NextResponse.json(
        { error: "Başlık ve hedef tarih gerekli." },
        { status: 400 },
      );
    }

    const goal = await prisma.goal.create({
      data: {
        userId: user.id,
        title,
        description,
        targetDate,
        durationMonths,
      },
    });
    return NextResponse.json(goal, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Hedef oluşturulamadı." }, { status: 500 });
  }
}
