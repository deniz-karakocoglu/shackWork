import { unlink } from "fs/promises";
import { join } from "path";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/user";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, context: Ctx) {
  try {
    const { id } = await context.params;
    const user = await requireUser();
    const photo = await prisma.progressPhoto.findFirst({
      where: { id, userId: user.id },
    });
    if (!photo) {
      return NextResponse.json({ error: "Bulunamadi." }, { status: 404 });
    }

    const rel = photo.imageUrl.replace(/^\//, "");
    const abs = join(process.cwd(), "public", rel);
    try {
      await unlink(abs);
    } catch {
      // dosya yoksa da db temizlensin
    }
    await prisma.progressPhoto.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
