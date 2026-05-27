import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/user";

export async function GET() {
  try {
    const user = await requireUser();
    const rows = await prisma.bodyMetric.findMany({
      where: { userId: user.id },
      orderBy: { measuredAt: "asc" },
      select: { measuredAt: true, weightKg: true, bodyFatPercent: true },
    });

    const header = "tarih;kilo_kg;yag_yuzde\n";
    const body = rows
      .map((r) => {
        const d = r.measuredAt.toISOString();
        const fat =
          r.bodyFatPercent != null ? String(r.bodyFatPercent).replace(".", ",") : "";
        return `${d};${r.weightKg};${fat}`;
      })
      .join("\n");

    const csv = header + body;
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="shackwork-olcumler.csv"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
