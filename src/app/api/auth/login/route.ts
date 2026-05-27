import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSessionToken, setSessionCookie, verifyPassword } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json({ error: "Email ve sifre gerekli." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { coach: true },
    });
    if (!user) {
      return NextResponse.json({ error: "Kullanici bulunamadi." }, { status: 404 });
    }

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "Sifre hatali." }, { status: 401 });
    }

    const token = await createSessionToken(user.id);
    await setSessionCookie(token);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        surname: user.surname,
        birthDate: user.birthDate,
        role: user.role,
        heightCm: user.heightCm,
        goalFocus: user.goalFocus,
        coach: user.coach,
      },
    });
  } catch {
    return NextResponse.json({ error: "Giris yapilamadi." }, { status: 500 });
  }
}
