import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { pdfSafeAsciiForStandardFonts } from "@/lib/pdf-safe-text";

/** Roboto Regular TTF — Türkçe Latin glifleri (gstatic). */
const FONT_URL =
  "https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxK.ttf";

export function wrapTextToLines(text: string, maxChars: number): string[] {
  const out: string[] = [];
  for (const raw of text.split("\n")) {
    let line = raw;
    if (line.length === 0) {
      out.push("");
      continue;
    }
    while (line.length > maxChars) {
      const slice = line.slice(0, maxChars);
      const sp = slice.lastIndexOf(" ");
      const cut = sp > Math.floor(maxChars * 0.52) ? sp : maxChars;
      out.push(line.slice(0, cut).trimEnd());
      line = line.slice(cut).trimStart();
    }
    out.push(line);
  }
  return out;
}

export async function buildWeeklyPlanPdfBytes(opts: {
  userLabel: string;
  focusLabel: string;
  weekStart: string;
  weekEnd: string;
  workoutPlan: string;
  mealPlan: string;
}): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  let font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  let useAsciiFold = true;

  try {
    const res = await fetch(FONT_URL, { cache: "force-cache" });
    if (res.ok) {
      const bytes = new Uint8Array(await res.arrayBuffer());
      font = await pdfDoc.embedFont(bytes);
      useAsciiFold = false;
    }
  } catch {
    /* Helvetica + ASCII katlama */
  }

  const prep = (s: string) => (useAsciiFold ? pdfSafeAsciiForStandardFonts(s) : s);

  const margin = 50;
  const pageWidth = 595;
  const pageHeight = 842;
  const fontSize = 9;
  const lineHeight = 11;
  const maxChars = 88;
  const textWidth = pageWidth - margin * 2;
  const bodyColor = rgb(0.06, 0.09, 0.08);
  const mutedColor = rgb(0.28, 0.32, 0.3);

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  const newPageIfNeeded = (lines: number) => {
    if (y - lines * lineHeight < margin + 20) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    }
  };

  const drawParagraph = (text: string, size = fontSize, color = bodyColor) => {
    const lines = wrapTextToLines(prep(text), maxChars);
    const lh = lineHeight * (size / fontSize);
    for (const ln of lines) {
      newPageIfNeeded(1);
      if (ln.length === 0) {
        y -= lh * 0.45;
        continue;
      }
      page.drawText(ln, {
        x: margin,
        y,
        size,
        font,
        color,
        maxWidth: textWidth,
      });
      y -= lh;
    }
  };

  drawParagraph("shackWork — Haftalık antrenman ve beslenme planı", 15);
  y -= 4;
  drawParagraph(opts.userLabel, 9, mutedColor);
  drawParagraph(`Odak: ${opts.focusLabel}`, 9, mutedColor);
  drawParagraph(`Hafta: ${opts.weekStart} — ${opts.weekEnd}`, 9, mutedColor);
  y -= 6;
  drawParagraph("Antrenman programı", 11);
  drawParagraph("—".repeat(44), 8, mutedColor);
  drawParagraph(opts.workoutPlan);
  y -= 4;
  drawParagraph("Beslenme / öğün çerçevesi", 11);
  drawParagraph("—".repeat(44), 8, mutedColor);
  drawParagraph(opts.mealPlan);
  y -= 8;
  drawParagraph(
    "Bu belge genel bilgilendirme şablonudur; sağlık sorunu, yaralanma veya özel hedefler için doktor veya lisanslı antrenör desteği alın.",
    7.5,
    mutedColor,
  );

  return pdfDoc.save();
}
