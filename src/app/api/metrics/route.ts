import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/user";
import { computeBmi, bmiCategoryTr } from "@/lib/bmi";

export async function GET() {
  try {
    const user = await requireUser();
    const metrics = await prisma.bodyMetric.findMany({
      where: { userId: user.id },
      orderBy: { measuredAt: "desc" },
      take: 60,
    });
    const latest = metrics[0];
    let bmi: number | null = null;
    let category: string | null = null;
    if (latest && user.heightCm) {
      bmi = computeBmi(latest.weightKg, user.heightCm);
      category = bmi != null ? bmiCategoryTr(bmi) : null;
    }
    return NextResponse.json({ metrics, bmi, bmiCategory: category, heightCm: user.heightCm });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const weightKg = Number(body.weightKg);
    const bodyFatPercent =
      body.bodyFatPercent === undefined || body.bodyFatPercent === null || body.bodyFatPercent === ""
        ? null
        : Number(body.bodyFatPercent);
    const measuredAt = body.measuredAt ? new Date(body.measuredAt) : new Date();

    if (!Number.isFinite(weightKg) || weightKg <= 0) {
      return NextResponse.json({ error: "Geçerli bir kilo girin." }, { status: 400 });
    }

    const row = await prisma.bodyMetric.create({
      data: {
        userId: user.id,
        weightKg,
        bodyFatPercent:
          bodyFatPercent != null && Number.isFinite(bodyFatPercent) ? bodyFatPercent : null,
        measuredAt,
      },
    });
    return NextResponse.json(row, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Ölçüm kaydedilemedi." }, { status: 500 });
  }
}
