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
    const exists = await prisma.user.findFirst({
      where: { id: userId, role: "USER" },
      select: { id: true },
    });
    if (!exists) {
      return NextResponse.json({ error: "Kullanici bulunamadi." }, { status: 404 });
    }
    const notes = await prisma.coachNote.findMany({
      where: { clientId: userId },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        author: { select: { id: true, name: true, email: true } },
      },
    });
    return NextResponse.json({ notes });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: Request, context: Ctx) {
  try {
    const me = await requireUser();
    if (me.role !== "COACH") {
      return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
    }
    const { userId } = await context.params;
    const body = await request.json();
    const content = typeof body.content === "string" ? body.content.trim() : "";
    if (!content) {
      return NextResponse.json({ error: "Not bos olamaz." }, { status: 400 });
    }
    const exists = await prisma.user.findFirst({
      where: { id: userId, role: "USER" },
      select: { id: true },
    });
    if (!exists) {
      return NextResponse.json({ error: "Kullanici bulunamadi." }, { status: 404 });
    }
    const created = await prisma.coachNote.create({
      data: {
        clientId: userId,
        authorId: me.id,
        content,
      },
      include: {
        author: { select: { id: true, name: true, email: true } },
      },
    });
    return NextResponse.json({ note: created }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Not kaydedilemedi." }, { status: 400 });
  }
}
