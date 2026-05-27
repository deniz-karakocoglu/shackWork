import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/user";

type Ctx = { params: Promise<{ userId: string; noteId: string }> };

export async function PATCH(request: Request, context: Ctx) {
  try {
    const me = await requireUser();
    if (me.role !== "COACH") {
      return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
    }
    const { userId, noteId } = await context.params;
    const body = await request.json();
    const content = typeof body.content === "string" ? body.content.trim() : "";
    if (!content) {
      return NextResponse.json({ error: "Not bos olamaz." }, { status: 400 });
    }

    const note = await prisma.coachNote.findFirst({
      where: { id: noteId, clientId: userId, authorId: me.id },
      select: { id: true },
    });
    if (!note) {
      return NextResponse.json({ error: "Not bulunamadi." }, { status: 404 });
    }

    const updated = await prisma.coachNote.update({
      where: { id: noteId },
      data: { content },
      include: { author: { select: { id: true, name: true, email: true } } },
    });
    return NextResponse.json({ note: updated });
  } catch {
    return NextResponse.json({ error: "Not guncellenemedi." }, { status: 400 });
  }
}

export async function DELETE(_request: Request, context: Ctx) {
  try {
    const me = await requireUser();
    if (me.role !== "COACH") {
      return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
    }
    const { userId, noteId } = await context.params;
    const note = await prisma.coachNote.findFirst({
      where: { id: noteId, clientId: userId, authorId: me.id },
      select: { id: true },
    });
    if (!note) {
      return NextResponse.json({ error: "Not bulunamadi." }, { status: 404 });
    }
    await prisma.coachNote.delete({ where: { id: noteId } });
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "Not silinemedi." }, { status: 400 });
  }
}
