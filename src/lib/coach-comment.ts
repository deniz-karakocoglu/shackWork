import type { GoalFocus } from "@prisma/client";

type Input = {
  userName: string | null;
  goalFocus: GoalFocus;
  latestWeight: number | null;
  latestBodyFatPercent: number | null;
  activeGoals: string[];
  recentLogs: Array<{
    logDate: string;
    trainingText: string | null;
    mealsText: string | null;
    notes: string | null;
  }>;
};

function fallbackComment(input: Input): string {
  const lines: string[] = [];
  lines.push(`Haftalik koc notu (${input.userName ?? "Kullanici"})`);
  lines.push(`Odak: ${input.goalFocus}`);
  if (input.latestWeight != null) {
    const fat =
      input.latestBodyFatPercent != null
        ? `, yag %${input.latestBodyFatPercent}`
        : "";
    lines.push(`Son olcum: ${input.latestWeight} kg${fat}.`);
  } else {
    lines.push("Son olcum kaydi bulunmuyor.");
  }
  if (input.activeGoals.length > 0) {
    lines.push(`Aktif hedefler: ${input.activeGoals.join(" | ")}`);
  }
  lines.push("Bu hafta icin oneriler:");
  lines.push("- En az 3 gun planli antrenman");
  lines.push("- Her gun su + protein takibi");
  lines.push("- Uyku duzeni ve toparlanmaya dikkat");
  return lines.join("\n");
}

function buildPrompt(input: Input): string {
  return [
    "Sen shackWork uygulamasinda koce yardimci Turkce asistan olarak yaziyorsun.",
    "Teknik jargonu azalt, motive edici ama gercekci ol.",
    "Kisa bir haftalik degerlendirme ve 4 maddelik uygulanabilir plan yaz.",
    `Kullanici: ${input.userName ?? "Isimsiz"}`,
    `Odak: ${input.goalFocus}`,
    `Son olcum: ${input.latestWeight ?? "Yok"} kg, yag: ${input.latestBodyFatPercent ?? "Yok"}`,
    `Aktif hedefler: ${input.activeGoals.join(" | ") || "Yok"}`,
    `Son gunlukler: ${input.recentLogs
      .map(
        (l) =>
          `[${l.logDate}] A:${l.trainingText ?? "-"} Y:${l.mealsText ?? "-"} N:${l.notes ?? "-"}`,
      )
      .join(" || ")}`,
  ].join("\n");
}

export async function generateCoachWeeklyComment(input: Input): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return fallbackComment(input);

  try {
    const model = process.env.GEMINI_MODEL ?? "gemini-1.5-flash";
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: buildPrompt(input) }] }],
          generationConfig: {
            temperature: 0.6,
            maxOutputTokens: 500,
          },
        }),
      },
    );
    if (!res.ok) return fallbackComment(input);
    const data = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    return text && text.length > 0 ? text : fallbackComment(input);
  } catch {
    return fallbackComment(input);
  }
}
