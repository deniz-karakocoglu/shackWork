import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/user";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ user: null }, { status: 200 });
  }
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
}
