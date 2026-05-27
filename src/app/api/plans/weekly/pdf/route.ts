import { Buffer } from "node:buffer";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/user";
import { buildWeeklyPlanPdfBytes } from "@/lib/weekly-plan-pdf";
import { focusTitle } from "@/lib/weekly-plan";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const plan = await prisma.weeklyPlan.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    if (!plan) {
      return NextResponse.json({ error: "Önce ana panelden haftalık plan oluşturun." }, { status: 404 });
    }

    const name = [user.name, user.surname].filter(Boolean).join(" ").trim();
    const userLabel = name ? `Kullanıcı: ${name}` : `E-posta: ${user.email}`;

    const pdfBytes = await buildWeeklyPlanPdfBytes({
      userLabel,
      focusLabel: focusTitle(plan.focus),
      weekStart: plan.weekStart,
      weekEnd: plan.weekEnd,
      workoutPlan: plan.workoutPlan,
      mealPlan: plan.mealPlan,
    });

    const filename = `shackwork-haftalik-${plan.weekStart}.pdf`;
    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (e) {
    console.error("[plans/weekly/pdf]", e);
    return NextResponse.json({ error: "PDF oluşturulamadı." }, { status: 500 });
  }
}
