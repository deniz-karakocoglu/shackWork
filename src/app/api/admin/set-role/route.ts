import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@prisma/client";

export async function POST(request: Request) {
  const adminSecret = process.env.SHACKWORK_ADMIN_SECRET;
  if (!adminSecret || adminSecret.length < 8) {
    return NextResponse.json(
      { error: "Sunucuda SHACKWORK_ADMIN_SECRET tanimli degil (min 8 karakter)." },
      { status: 503 },
    );
  }

  try {
    const body = await request.json();
    const secret = typeof body.secret === "string" ? body.secret : "";
    if (secret !== adminSecret) {
      return NextResponse.json({ error: "Gecersiz admin anahtari." }, { status: 403 });
    }

    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const role = body.role as UserRole;
    if (!email || (role !== "USER" && role !== "COACH")) {
      return NextResponse.json(
        { error: "email ve role (USER | COACH) gerekli." },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: "Kullanici bulunamadi." }, { status: 404 });
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { role },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        goalFocus: true,
        coach: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ ok: true, user: updated });
  } catch {
    return NextResponse.json({ error: "Islem basarisiz." }, { status: 500 });
  }
}
