import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/user";
import type { GoalFocus } from "@prisma/client";

const FOCUSES: GoalFocus[] = [
  "WEIGHT_LOSS",
  "MUSCLE",
  "PERFORMANCE",
  "GENERAL",
];

function stripUser<T extends { passwordHash?: string }>(u: T) {
  const { passwordHash: _p, ...rest } = u;
  return rest;
}

export async function GET() {
  try {
    const user = await requireUser();
    const full = await prisma.user.findUnique({
      where: { id: user.id },
      include: { coach: true },
    });
    if (!full) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(stripUser(full));
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const name =
      body.name === undefined
        ? undefined
        : typeof body.name === "string"
          ? body.name
          : null;
    let heightCmPatch: number | null | undefined;
    if (body.heightCm === undefined) {
      heightCmPatch = undefined;
    } else if (body.heightCm === null) {
      heightCmPatch = null;
    } else {
      const n = Number(body.heightCm);
      heightCmPatch = Number.isFinite(n) ? n : null;
    }
    const goalFocus =
      body.goalFocus === undefined
        ? undefined
        : FOCUSES.includes(body.goalFocus)
          ? body.goalFocus
          : undefined;
    const coachId =
      body.coachId === undefined
        ? undefined
        : body.coachId === null
          ? null
          : String(body.coachId);

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(name !== undefined && { name }),
        ...(heightCmPatch !== undefined && { heightCm: heightCmPatch }),
        ...(goalFocus !== undefined && { goalFocus }),
        ...(coachId !== undefined && { coachId }),
      },
      include: { coach: true },
    });
    return NextResponse.json(stripUser(updated));
  } catch {
    return NextResponse.json({ error: "Profil guncellenemedi." }, { status: 400 });
  }
}
