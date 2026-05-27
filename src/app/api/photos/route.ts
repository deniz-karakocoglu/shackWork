import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/user";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function GET() {
  try {
    const user = await requireUser();
    const photos = await prisma.progressPhoto.findMany({
      where: { userId: user.id },
      orderBy: { takenAt: "desc" },
      take: 100,
    });
    return NextResponse.json(photos);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof Blob) || file.size === 0) {
      return NextResponse.json({ error: "Dosya gerekli." }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "En fazla 5 MB yukleyin." }, { status: 400 });
    }
    const type = file.type || "application/octet-stream";
    if (!ALLOWED.has(type)) {
      return NextResponse.json({ error: "Sadece JPEG, PNG, WebP veya GIF." }, { status: 400 });
    }

    const ext =
      type === "image/jpeg"
        ? ".jpg"
        : type === "image/png"
          ? ".png"
          : type === "image/webp"
            ? ".webp"
            : ".gif";

    const takenRaw = form.get("takenAt");
    const takenAt =
      typeof takenRaw === "string" && takenRaw
        ? new Date(takenRaw)
        : new Date();
    const noteRaw = form.get("note");
    const note =
      typeof noteRaw === "string" && noteRaw.trim() ? noteRaw.trim() : null;

    const buf = Buffer.from(await file.arrayBuffer());
    const dir = join(process.cwd(), "public", "uploads", "shackwork");
    await mkdir(dir, { recursive: true });
    const filename = `${user.id}-${Date.now()}${ext}`;
    const diskPath = join(dir, filename);
    await writeFile(diskPath, buf);

    const imageUrl = `/uploads/shackwork/${filename}`;
    const row = await prisma.progressPhoto.create({
      data: {
        userId: user.id,
        takenAt,
        imageUrl,
        note,
      },
    });
    return NextResponse.json(row, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Yukleme basarisiz." }, { status: 400 });
  }
}
