import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSessionToken, hashPassword, setSessionCookie } from "@/lib/auth";
import { isCoachEmail } from "@/lib/coach-emails";
import { validatePassword } from "@/lib/password-policy";

function calculateAgeYears(birthDate: Date) {
  const now = new Date();
  let age = now.getFullYear() - birthDate.getFullYear();
  const m = now.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birthDate.getDate())) age--;
  return age;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const name =
      typeof body.name === "string" && body.name.trim() ? body.name.trim() : null;
    const surname =
      typeof body.surname === "string" && body.surname.trim()
        ? body.surname.trim()
        : null;
    const birthDay = Number(body.birthDay);
    const birthMonth = Number(body.birthMonth);
    const birthYear = Number(body.birthYear);

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Gecerli bir e-posta gerekli." },
        { status: 400 },
      );
    }
    const pwCheck = validatePassword(password);
    if (!pwCheck.ok) {
      return NextResponse.json({ error: pwCheck.error }, { status: 400 });
    }
    if (!name || !surname) {
      return NextResponse.json(
        { error: "Kayit icin ad ve soyad gerekli." },
        { status: 400 },
      );
    }
    if (
      !Number.isInteger(birthDay) ||
      !Number.isInteger(birthMonth) ||
      !Number.isInteger(birthYear)
    ) {
      return NextResponse.json(
        { error: "Dogum tarihi gun/ay/yil olarak girilmeli." },
        { status: 400 },
      );
    }
    const birthDate = new Date(birthYear, birthMonth - 1, birthDay);
    const isValidDate =
      birthDate.getFullYear() === birthYear &&
      birthDate.getMonth() === birthMonth - 1 &&
      birthDate.getDate() === birthDay;
    if (!isValidDate) {
      return NextResponse.json(
        { error: "Gecersiz dogum tarihi." },
        { status: 400 },
      );
    }

    const age = calculateAgeYears(birthDate);
    if (age < 16) {
      return NextResponse.json(
        { error: "Bu platform 16 yas ve uzeri kullanicilar icindir." },
        { status: 400 },
      );
    }

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return NextResponse.json(
        { error: "Bu email zaten kayitli." },
        { status: 409 },
      );
    }

    const coach = await prisma.coach.findFirst({ orderBy: { name: "asc" } });
    const role = isCoachEmail(email) ? "COACH" : "USER";
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: await hashPassword(password),
        name,
        surname,
        birthDate,
        role,
        goalFocus: "GENERAL",
        ...(coach && role === "USER" ? { coachId: coach.id } : {}),
      },
      include: { coach: true },
    });

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
    return NextResponse.json({ error: "Kayit olusturulamadi." }, { status: 500 });
  }
}
