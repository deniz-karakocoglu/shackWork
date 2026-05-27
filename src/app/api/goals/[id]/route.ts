import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/user";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Ctx) {
  try {
    const { id } = await context.params;
    const user = await requireUser();
    const existing = await prisma.goal.findFirst({ where: { id, userId: user.id } });
    if (!existing) {
      return NextResponse.json({ error: "Bulunamadi." }, { status: 404 });
    }
    const body = await request.json();
    const title =
      body.title === undefined
        ? undefined
        : typeof body.title === "string"
          ? body.title.trim()
          : existing.title;
    const description =
      body.description === undefined
        ? undefined
        : typeof body.description === "string"
          ? body.description.trim()
          : null;
    const targetDate =
      body.targetDate != null ? new Date(body.targetDate) : undefined;
    const durationMonths =
      body.durationMonths === undefined
        ? undefined
        : body.durationMonths === null
          ? null
          : Math.max(1, Math.floor(Number(body.durationMonths)));

    const goal = await prisma.goal.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(targetDate && !Number.isNaN(targetDate.getTime()) && { targetDate }),
        ...(durationMonths !== undefined && { durationMonths }),
      },
    });
    return NextResponse.json(goal);
  } catch {
    return NextResponse.json({ error: "Guncellenemedi." }, { status: 400 });
  }
}

export async function DELETE(_request: Request, context: Ctx) {
  try {
    const { id } = await context.params;
    const user = await requireUser();
    const existing = await prisma.goal.findFirst({ where: { id, userId: user.id } });
    if (!existing) {
      return NextResponse.json({ error: "Bulunamadi." }, { status: 404 });
    }
    await prisma.goal.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
