import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pickBestCoach } from "@/lib/coach-match";
import { requireUser } from "@/lib/user";

export async function POST() {
  try {
    const user = await requireUser();
    const coaches = await prisma.coach.findMany();
    if (coaches.length === 0) {
      return NextResponse.json(
        { error: "Henuz koc kaydi yok. Once veritabanini tohumla (seed)." },
        { status: 400 },
      );
    }
    const best = pickBestCoach(coaches, user.goalFocus);
    if (!best) {
      return NextResponse.json({ error: "Eslesme yapilamadi." }, { status: 400 });
    }
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { coachId: best.id },
      include: { coach: true },
    });
    return NextResponse.json({
      matchedCoach: best,
      user: updated,
      message: `Hedefine en uygun koc: ${best.name}`,
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
