// Gemini ile haftalık plan üretimi
// notlar: antrenman+beslenme ayrı çağrı, uniquenessSeed→farklı çıktı,
//         doğrulama+düzeltme turu, model fallback

import type { Goal, GoalFocus } from "@prisma/client";
import { focusTitle } from "@/lib/weekly-plan";

// userId + uniquenessSeed prompt'a giriyor → her kullanıcı farklı plan
export type WeeklyPlanAiContext = {
  userId: string;
  /** Her istekte farklı çıktı için rastgele tohum */
  uniquenessSeed: string;
  goalFocus: GoalFocus;
  heightCm: number | null;
  displayName: string;
  goals: Pick<Goal, "title" | "description" | "targetDate">[];
  latestWeightKg: number | null;
  bodyFatPercent: number | null;
};

export type AiWeeklyPlanResult =
  | { ok: true; workoutPlan: string; mealPlan: string }
  | { ok: false; reason: string };

const TR_DAYS = [
  "PAZARTESİ",
  "SALI",
  "ÇARŞAMBA",
  "PERŞEMBE",
  "CUMA",
  "CUMARTESİ",
  "PAZAR",
] as const;

function goalDateIso(d: Date | string): string {
  if (d instanceof Date) return d.toISOString().slice(0, 10);
  return String(d).slice(0, 10);
}

/** Şablon planın üstüne hedef özeti (API anahtarı yok veya AI başarısız). */
export function prependGoalsSummary(
  workoutPlan: string,
  mealPlan: string,
  goals: Pick<Goal, "title" | "description" | "targetDate">[],
): { workoutPlan: string; mealPlan: string } {
  if (goals.length === 0) return { workoutPlan, mealPlan };
  const lines = goals.map((g) => {
    const desc = g.description?.trim() ? ` — ${g.description.trim()}` : "";
    return `• ${g.title.trim()}${desc} (bitiş: ${goalDateIso(g.targetDate)})`;
  });
  const block = [
    "shackWork — senin hedeflerin (bu haftalık planla birlikte oku)",
    "",
    ...lines,
    "",
    "Aşağıdaki antrenman / beslenme gövdesi profilindeki genel odağa göre şablondur.",
    "GEMINI_API_KEY tanımlıysa «Şimdi yenile» ile hedeflerine özel detaylı program üretilir.",
    "",
    "──────────────────────────────────────",
    "",
  ].join("\n");
  return {
    workoutPlan: `${block}${workoutPlan}`,
    mealPlan: `${block}${mealPlan}`,
  };
}

function normalizePlanText(s: string): string {
  return s
    .replace(/\r\n/g, "\n")
    .replace(/\t/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();
}

function parseJsonField(raw: string, field: "workoutPlan" | "mealPlan"): string | null {
  let t = raw.trim();
  const fenced = /^```(?:json)?\s*([\s\S]*?)```/im.exec(t);
  if (fenced) t = fenced[1].trim();

  const tryObj = (s: string): string | null => {
    try {
      const j = JSON.parse(s) as Record<string, unknown>;
      const v = j[field];
      return typeof v === "string" && v.trim().length >= 80 ? normalizePlanText(v) : null;
    } catch {
      return null;
    }
  };

  const direct = tryObj(t);
  if (direct) return direct;

  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start >= 0 && end > start) {
    const inner = tryObj(t.slice(start, end + 1));
    if (inner) return inner;
  }

  return null;
}

// AI cevabını doğrula: gün başlıkları + uzunluk + anahtar kelimeler + placeholder
// hata varsa düzeltme notuyla 2. tur
function validatePlanPart(
  text: string,
  kind: "workout" | "meal",
  ctx: WeeklyPlanAiContext,
): string[] {
  const issues: string[] = [];
  const upper = text.toUpperCase();
  const dayHits = TR_DAYS.filter((d) => upper.includes(d)).length;
  if (kind === "workout" && dayHits < 4) {
    issues.push(`Antrenmanda en az 4 gün başlığı olmalı (PAZARTESİ…PAZAR); bulunan: ${dayHits}.`);
  }
  if (text.length < (kind === "workout" ? 600 : 400)) {
    issues.push(`${kind === "workout" ? "Antrenman" : "Beslenme"} metni çok kısa.`);
  }
  if (/lorem|placeholder|örnek kullanıcı|john doe/i.test(text)) {
    issues.push("Uydurma/placeholder metin var.");
  }

  if (kind === "workout") {
    const textLow = text.toLowerCase();
    const titleWords = ctx.goals.flatMap((g) =>
      g.title
        .toLowerCase()
        .split(/\s+/)
        .map((w) => w.replace(/[^a-zçğıöşü0-9]/gi, ""))
        .filter((w) => w.length >= 3),
    );
    if (titleWords.length > 0 && !titleWords.some((w) => textLow.includes(w))) {
      issues.push("Antrenman metni hedef başlığındaki anahtar kelimeleri yansıtmıyor.");
    }
  }

  return issues;
}

// prompt'a yazacağım bağlam
function buildContextBlock(ctx: WeeklyPlanAiContext): string {
  const focusLabel = focusTitle(ctx.goalFocus);
  const goalLines = ctx.goals.map((g, i) => {
    const desc = g.description?.trim() ? ` | Detay: ${g.description.trim().slice(0, 600)}` : "";
    return `${i + 1}. «${g.title.trim()}»${desc} — bitiş: ${goalDateIso(g.targetDate)}`;
  });

  const lines = [
    `İsim: ${ctx.displayName}`,
    `Profil odağı: ${focusLabel} (${ctx.goalFocus})`,
    // her kullanıcı + her istek için özgün → AI'a kopya yapma diyor
    `Kullanıcı kimliği (bu plan yalnızca bu kişiye özel): ${ctx.userId}`,
    `Özgünlük tohumu: ${ctx.uniquenessSeed}`,
    "ÖNEMLİ: Genel şablon veya başka kullanıcıya kopyalanmış program yazma; hedef metnine göre sıfırdan özgün plan üret.",
  ];
  if (ctx.latestWeightKg != null) {
    lines.push(
      `Son kilo: ${ctx.latestWeightKg} kg${ctx.bodyFatPercent != null ? `, yağ %${ctx.bodyFatPercent}` : ""}`,
    );
  }
  if (ctx.heightCm != null) lines.push(`Boy: ${ctx.heightCm} cm`);
  lines.push("", "HEDEFLER (sadece bunlara göre yaz; listede olmayan sakatlık/hastalık uydurma):", ...goalLines);
  return lines.join("\n");
}

const WORKOUT_FORMAT = `
shackWork — haftalık antrenman (kullanıcı hedeflerine göre)
Genel: 1 cümle özet.

Her gün için AYNI şablon (7 gün yaz; dinlenme gününde hafif aktivite):
══════════════════════════════════════
PAZARTESİ — [başlık]
Hedef süre: [dk]
Isınma
  • [madde]
Ana antrenman
  1) [hareket: set x tekrar veya süre]
  ...
Soğuma
  • [madde]
Notlar
  • [madde]
`.trim();

const MEAL_FORMAT = `
shackWork — haftalık beslenme (kullanıcı hedeflerine göre)
Genel ilkeler (3–5 madde, • ile)
Antrenman günü zamanlama
Örnek gün şablonu (kahvaltı / ara / öğle / akşam)
Haftalık alışveriş / hazırlık ipuçları
`.trim();

function buildWorkoutPrompt(ctx: WeeklyPlanAiContext, fixNote?: string): string {
  return [
    "Sen Türkçe yazan profesyonel fitness koçusun. Tıbbi teşhis koyma.",
    fixNote ? `DÜZELT: ${fixNote}` : "",
    buildContextBlock(ctx),
    "",
    "GÖREV: Sadece antrenman programı yaz.",
    "Türkçe karakter kullan (ı, ş, ğ, ü, ö, ç).",
    "Salon + ev alternatifi ver; set/tekrar sayıları net olsun.",
    "Format örneği:",
    WORKOUT_FORMAT,
    "",
    'YANIT: Yalnızca JSON: {"workoutPlan":"..."}',
  ]
    .filter(Boolean)
    .join("\n");
}

function buildMealPrompt(ctx: WeeklyPlanAiContext, fixNote?: string): string {
  return [
    "Sen Türkçe yazan spor beslenmesi koçusun. Kalori hedefi SAYMA (rakam verme).",
    fixNote ? `DÜZELT: ${fixNote}` : "",
    buildContextBlock(ctx),
    "",
    "GÖREV: Sadece beslenme çerçevesi yaz; antrenman günlerine göre örnek öğünler.",
    "Format örneği:",
    MEAL_FORMAT,
    "",
    'YANIT: Yalnızca JSON: {"mealPlan":"..."}',
  ]
    .filter(Boolean)
    .join("\n");
}

type GeminiCallResult = { text?: string; error?: string };

async function generateContent(
  model: string,
  apiKey: string,
  prompt: string,
): Promise<GeminiCallResult> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        // 0.62 → orta-üst yaratıcılık (aynı hedef→farklı varyasyon)
        generationConfig: {
          temperature: 0.62,
          maxOutputTokens: 8192,
          responseMimeType: "application/json",
        },
      }),
    });
    const raw = await res.text();
    if (!res.ok) {
      let msg = `HTTP ${res.status}`;
      try {
        const j = JSON.parse(raw) as { error?: { message?: string } };
        if (typeof j.error?.message === "string") msg = j.error.message.slice(0, 320);
      } catch {
        if (raw) msg = raw.slice(0, 200);
      }
      return { error: msg };
    }
    const data = JSON.parse(raw) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
        finishReason?: string;
      }>;
      promptFeedback?: { blockReason?: string };
    };
    const blocked = data.promptFeedback?.blockReason;
    if (blocked) return { error: `İstek engellendi: ${blocked}` };
    const c0 = data.candidates?.[0];
    const text = c0?.content?.parts?.[0]?.text?.trim();
    if (!text) {
      const fr = c0?.finishReason;
      return { error: fr ? `Boş cevap (${fr})` : "Boş cevap" };
    }
    return { text };
  } catch (e) {
    return { error: e instanceof Error ? e.message.slice(0, 200) : "Ağ hatası" };
  }
}

async function generatePart(
  model: string,
  key: string,
  kind: "workout" | "meal",
  ctx: WeeklyPlanAiContext,
  fixNote?: string,
): Promise<{ text: string | null; error: string }> {
  const prompt =
    kind === "workout" ? buildWorkoutPrompt(ctx, fixNote) : buildMealPrompt(ctx, fixNote);
  const field = kind === "workout" ? "workoutPlan" : "mealPlan";
  const r = await generateContent(model, key, prompt);
  if (r.error) return { text: null, error: r.error };
  if (!r.text) return { text: null, error: "Boş yanıt" };
  const parsed = parseJsonField(r.text, field);
  if (!parsed) return { text: null, error: "JSON alanı okunamadı" };
  return { text: parsed, error: "" };
}

// ana fonksiyon: anahtar kontrol → model fallback → ayrı çağrı → doğrulama → düzeltme
export async function tryGenerateWeeklyPlanWithAi(
  ctx: WeeklyPlanAiContext,
): Promise<AiWeeklyPlanResult> {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) {
    return {
      ok: false,
      reason: "Sunucuda GEMINI_API_KEY yok (.env). Günlük rapor AI’sı da aynı anahtarı kullanır.",
    };
  }
  if (ctx.goals.length === 0) {
    return { ok: false, reason: "Önce en az bir hedef ekle; AI planı hedef metnine bağlı." };
  }

  // model fallback: biri kotada takılırsa diğeri
  const envModel = process.env.GEMINI_MODEL?.trim();
  const models = [
    ...new Set(
      [envModel, "gemini-2.0-flash", "gemini-2.0-flash-001", "gemini-1.5-flash-latest"].filter(
        (m): m is string => Boolean(m && m.length > 0),
      ),
    ),
  ];

  let lastError = "";

  for (const model of models) {
    let workoutFix: string | undefined;
    let mealFix: string | undefined;

    for (let attempt = 0; attempt < 2; attempt++) {
      const wRes = await generatePart(model, key, "workout", ctx, workoutFix);
      if (!wRes.text) {
        lastError = `${model} antrenman: ${wRes.error}`;
        break;
      }
      const wIssues = validatePlanPart(wRes.text, "workout", ctx);
      if (wIssues.length > 0) {
        workoutFix = wIssues.join(" ");
        if (attempt === 0) continue;
        lastError = `${model} antrenman doğrulama: ${wIssues[0]}`;
        break;
      }

      const mRes = await generatePart(model, key, "meal", ctx, mealFix);
      if (!mRes.text) {
        lastError = `${model} beslenme: ${mRes.error}`;
        break;
      }
      const mIssues = validatePlanPart(mRes.text, "meal", ctx);
      if (mIssues.length > 0) {
        mealFix = mIssues.join(" ");
        if (attempt === 0) continue;
        lastError = `${model} beslenme doğrulama: ${mIssues[0]}`;
        break;
      }

      return {
        ok: true,
        workoutPlan: wRes.text,
        mealPlan: mRes.text,
      };
    }
  }

  return {
    ok: false,
    reason:
      lastError ||
      "Gemini plan üretemedi. Anahtar/model veya kota kontrol et; «Şimdi yenile» ile tekrar dene.",
  };
}
