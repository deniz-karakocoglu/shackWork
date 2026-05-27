import { computeBmi, bmiCategoryTr } from "@/lib/bmi";
import type { BodyMetric, DayLog, Goal, User } from "@prisma/client";

type Context = {
  user: User;
  log: DayLog;
  latestMetric: BodyMetric | null;
  previousMetric: BodyMetric | null;
  activeGoal: Goal | null;
};

function focusLabelTr(focus: User["goalFocus"]) {
  switch (focus) {
    case "WEIGHT_LOSS":
      return "kilo/yag azaltma";
    case "MUSCLE":
      return "kas gelisimi";
    case "PERFORMANCE":
      return "performans";
    default:
      return "genel saglik";
  }
}

function buildNutritionTips(ctx: Context): string[] {
  const mealText = (ctx.log.mealsText ?? "").toLowerCase();
  const tips: string[] = [];

  if (!mealText.trim()) {
    tips.push("Her ana ogunde 1 protein kaynagi ekle (yumurta, yogurt, tavuk, balık, kuru baklagil).");
    tips.push("Gun icinde 2-2.5 litre su hedefle.");
    tips.push("Tabagini: %40 sebze, %30 protein, %30 kompleks karbonhidrat seklinde kur.");
    return tips;
  }

  if (mealText.includes("pirin")) {
    tips.push("Pirinci tamamen kesme; porsiyonu avuc ici kadar tut ve yanina protein + salata ekle.");
  }
  if (!/(tavuk|balik|yumurta|yogurt|peynir|et|mercimek|nohut|fasulye)/.test(mealText)) {
    tips.push("Beslenme notunda protein zayif gorunuyor; sonraki ogunde protein miktarini artir.");
  }
  if (!/(salata|sebze|brokoli|yesillik|domates|salatalik)/.test(mealText)) {
    tips.push("Lif ve tokluk icin ogune bir kase salata veya sebze ekle.");
  }
  tips.push("Aksam gec saatte agir porsiyon yerine daha hafif ve protein odakli kapanis yap.");
  return tips.slice(0, 3);
}

function buildTrainingTips(ctx: Context): string[] {
  const training = (ctx.log.trainingText ?? "").toLowerCase();
  const tips: string[] = [];

  if (!training.trim()) {
    tips.push("Yarin icin minimum hedef: 30-40 dk tempolu yuruyus + 10 dk mobilite.");
    tips.push("Zinciri bozmamak icin antrenmani saat bazli takvime simdiden yaz.");
    return tips;
  }

  if (training.includes("gogus") || training.includes("sirt")) {
    tips.push("Gogus-sirt gununde denge icin cekis-itis hacmini birbirine yakin tut (set sayisi dengeli olsun).");
  }
  tips.push("Antrenman sonunda 5-10 dk soguma ve esneme ekle; toparlanma hizlanir.");
  tips.push("Yarin ayni bolgeyi zorlamak yerine aktif toparlanma veya alt vucut planla.");
  return tips.slice(0, 3);
}

function buildMedicalGuidance(ctx: Context): string | null {
  const text = `${ctx.log.trainingText ?? ""} ${ctx.log.notes ?? ""}`.toLowerCase();
  const hasPain =
    /(agri|ağrı|sizlama|sızlama|yanma|batma|sakat|incin|zorlama|kramp)/.test(text);
  if (!hasPain) return null;

  let clinic = "Fizik Tedavi ve Rehabilitasyon";
  if (/(diz|omuz|bel|boyun|bilek|dirsek|menisk|bag|bağ|eklem)/.test(text)) {
    clinic = "Ortopedi ve Travmatoloji";
  } else if (/(uyus|uyuș|uyuş|karincalan|karıncalan|sinir|bas don|baş dön|bas agr|baş ağr)/.test(text)) {
    clinic = "Noroloji";
  }

  return [
    "**Saglik notu (guvenli yonlendirme)**",
    "- Yazdigina gore agri/sakatlanma belirtisi olabilir. Ben tibbi teshis koyamam.",
    `- Sikayet 48 saatten uzun surerse, artarsa veya gunluk hayati bozarsa ${clinic} bolumune basvurman iyi olur.`,
    "- Ani siddetli agri, uyusma, kuvvet kaybi veya travma varsa gecikmeden acil degerlendirme al.",
  ].join("\n");
}

function ruleBasedReport(ctx: Context): string {
  const { user, log, latestMetric, previousMetric, activeGoal } = ctx;
  const parts: string[] = [];

  parts.push(`**${log.logDate} — shackWork günlük özeti**`);
  parts.push(`Odak alanin: ${focusLabelTr(user.goalFocus)}.`);

  if (latestMetric && user.heightCm) {
    const bmi = computeBmi(latestMetric.weightKg, user.heightCm);
    if (bmi != null) {
      parts.push(
        `Güncel kilo ${latestMetric.weightKg} kg, VKİ ${bmi} (${bmiCategoryTr(bmi)}).`,
      );
    }
    if (latestMetric.bodyFatPercent != null) {
      parts.push(`Tahmini yağ oranı %${latestMetric.bodyFatPercent}.`);
    }
    if (previousMetric) {
      const dw = latestMetric.weightKg - previousMetric.weightKg;
      if (Math.abs(dw) >= 0.1) {
        parts.push(
          dw < 0
            ? `Son ölçüme göre ${Math.abs(dw).toFixed(1)} kg düşüş var.`
            : `Son ölçüme göre ${dw.toFixed(1)} kg artış görünüyor.`,
        );
      }
    }
  } else {
    parts.push("Boy ve kilo ölçümü girildiğinde VKİ ve trend yorumu daha net olur.");
  }

  if (log.trainingText?.trim()) {
    parts.push(`Antrenman: ${log.trainingText.trim().slice(0, 400)}`);
  } else {
    parts.push("Bugün için antrenman notu girilmedi; yarın için hafif bir hareket hedefi düşünebilirsin.");
  }

  if (log.mealsText?.trim()) {
    parts.push(`Beslenme özeti: ${log.mealsText.trim().slice(0, 400)}`);
  } else {
    parts.push("Beslenme notu eklenmedi; protein ve su hedefini hatırla.");
  }

  if (activeGoal) {
    const end = new Date(activeGoal.targetDate);
    parts.push(
      `Aktif hedef: "${activeGoal.title}" — bitiş ${end.toLocaleDateString("tr-TR")}.`,
    );
  }

  const trainingTips = buildTrainingTips(ctx);
  const nutritionTips = buildNutritionTips(ctx);
  parts.push(
    [
      "**Neyi daha iyi yapabilirsin?**",
      ...trainingTips.map((t, i) => `${i + 1}. ${t}`),
      ...nutritionTips.map((t, i) => `${i + 1 + trainingTips.length}. ${t}`),
    ].join("\n"),
  );

  parts.push(
    [
      "**Yarin icin mini plan**",
      "- 1 net antrenman hedefi belirle ve saati sabitle.",
      "- En az 2 ana ogunde protein + sebze kombinasyonu kur.",
      "- Su, uyku ve adim hedefini (ornek 8-10k) gun basinda yaz.",
    ].join("\n"),
  );

  const medicalGuidance = buildMedicalGuidance(ctx);
  if (medicalGuidance) {
    parts.push(medicalGuidance);
  }

  parts.push(
    "Bu metin, girdigin verilere gore otomatik uretildi. GEMINI_API_KEY tanimliysa daha detayli kocluk dili kullanilabilir.",
  );

  return parts.join("\n\n");
}

export async function generateDailyReport(ctx: Context): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return ruleBasedReport(ctx);
  }

  const prompt = buildGeminiPrompt(ctx);
  try {
    const model = process.env.GEMINI_MODEL ?? "gemini-1.5-flash";
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`,
      {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.6,
          maxOutputTokens: 600,
        },
      }),
      },
    );
    if (!res.ok) {
      return ruleBasedReport(ctx);
    }
    const data = (await res.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
      }>;
    };
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    return text && text.length > 0 ? text : ruleBasedReport(ctx);
  } catch {
    return ruleBasedReport(ctx);
  }
}

function buildGeminiPrompt(ctx: Context): string {
  const { user, log, latestMetric, activeGoal } = ctx;
  let metricLine = "";
  if (latestMetric && user.heightCm) {
    const bmi = computeBmi(latestMetric.weightKg, user.heightCm);
    metricLine = `Kilo ${latestMetric.weightKg} kg, boy ${user.heightCm} cm, VKİ ${bmi ?? "—"}`;
    if (latestMetric.bodyFatPercent != null) {
      metricLine += `, yağ %${latestMetric.bodyFatPercent}`;
    }
  }
  const goalLine = activeGoal
    ? `Hedef: ${activeGoal.title}, bitiş: ${activeGoal.targetDate.toISOString().slice(0, 10)}`
    : "Hedef tanımlı değil.";

  return [
    "Sen shackWork adli fitness uygulamasinin Turkce konusan koc asistanisin.",
    "Kisa, net, destekleyici ve guvenli oneriler ver. Tibbi teshis koyma.",
    "Eger kullanici agri/sakatlanma belirtisi yazdiysa guvenli bir dille doktor bolumu oner (Ortopedi/FTR/Noroloji) ve acil alarm bulgularini belirt.",
    `Kullanıcı odağı: ${user.goalFocus}`,
    metricLine || "Ölçüm yok.",
    goalLine,
    `Tarih: ${log.logDate}`,
    `Antrenman notu: ${log.trainingText ?? "—"}`,
    `Yemek notu: ${log.mealsText ?? "—"}`,
    `Ek not: ${log.notes ?? "—"}`,
    "Bu güne önce 5-8 cümlelik Türkçe özet ve yarın için 2 somut öneri yaz.",
  ].join("\n");
}
