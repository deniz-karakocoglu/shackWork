import { PDFDocument, StandardFonts } from "pdf-lib";
import { Buffer } from "node:buffer";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/user";
import { pdfSafeAsciiForStandardFonts } from "@/lib/pdf-safe-text";

type Ctx = { params: Promise<{ userId: string }> };

export async function GET(_request: Request, context: Ctx) {
  try {
    const me = await requireUser();
    if (me.role !== "COACH") {
      return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
    }
    const { userId } = await context.params;
    const client = await prisma.user.findFirst({
      where: { id: userId, role: "USER" },
      include: {
        coach: { select: { name: true } },
        goals: { orderBy: { targetDate: "asc" }, take: 5 },
        metrics: { orderBy: { measuredAt: "desc" }, take: 5 },
        dayLogs: { orderBy: { logDate: "desc" }, take: 5 },
        coachNotesReceived: {
          orderBy: { createdAt: "desc" },
          take: 5,
          include: { author: { select: { name: true, email: true } } },
        },
      },
    });
    if (!client) {
      return NextResponse.json({ error: "Kullanici bulunamadi." }, { status: 404 });
    }

    const pdf = await PDFDocument.create();
    const page = pdf.addPage([595.28, 841.89]); // A4
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    let y = 800;

    const safe = (s: string) => pdfSafeAsciiForStandardFonts(s);

    function write(text: string, size = 11, isBold = false) {
      page.drawText(safe(text), {
        x: 40,
        y,
        size,
        font: isBold ? bold : font,
      });
      y -= size + 6;
    }

    write("shackWork - Koc Kullanici Ozeti", 16, true);
    write(`Uretilme: ${new Date().toISOString().slice(0, 19).replace("T", " ")} UTC`, 10);
    y -= 8;
    write(`Kullanici: ${client.name ?? "-"} (${client.email})`, 11, true);
    write(`Odak: ${client.goalFocus} | Koc: ${client.coach?.name ?? "-"}`);
    y -= 6;
    write("Son Olcumler", 12, true);
    client.metrics.forEach((m) => {
      const day = m.measuredAt ? new Date(m.measuredAt).toISOString().slice(0, 10) : "?";
      write(
        `- ${day}: ${m.weightKg} kg${
          m.bodyFatPercent != null ? `, %${m.bodyFatPercent}` : ""
        }`,
      );
    });
    y -= 6;
    write("Hedefler", 12, true);
    client.goals.forEach((g) =>
      write(`- ${g.title} (bitis ${new Date(g.targetDate).toISOString().slice(0, 10)})`),
    );
    y -= 6;
    write("Son Gunlukler", 12, true);
    client.dayLogs.forEach((d) => write(`- ${d.logDate}: ${d.trainingText?.slice(0, 70) ?? "-"}`));
    y -= 6;
    write("Koc Notlari", 12, true);
    client.coachNotesReceived.forEach((n) =>
      write(
        `- ${new Date(n.createdAt).toISOString().slice(0, 10)} ${n.author.name ?? n.author.email}: ${n.content.slice(0, 90)}`,
      ),
    );

    const bytes = await pdf.save();
    return new NextResponse(Buffer.from(bytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="shackwork-client-${client.id}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[coach/clients/export]", e);
    return NextResponse.json({ error: "PDF olusturulamadi." }, { status: 500 });
  }
}
