import type { GoalFocus } from "@prisma/client";

export function focusTitle(focus: GoalFocus) {
  if (focus === "WEIGHT_LOSS") return "Kilo / yağ azaltma";
  if (focus === "MUSCLE") return "Kas ve güç";
  if (focus === "PERFORMANCE") return "Performans";
  return "Genel sağlık";
}

function dayBlock(
  day: string,
  title: string,
  duration: string,
  warmup: string[],
  main: string[],
  cooldown: string[],
  notes: string[],
) {
  const lines = [
    `══════════════════════════════════════`,
    `${day} — ${title}`,
    `Hedef süre: ${duration}`,
    ``,
    `Isınma`,
    ...warmup.map((l) => `  • ${l}`),
    ``,
    `Ana antrenman`,
    ...main.map((l, i) => `  ${i + 1}) ${l}`),
    ``,
    `Soğuma`,
    ...cooldown.map((l) => `  • ${l}`),
    ``,
    `Notlar`,
    ...notes.map((l) => `  • ${l}`),
    ``,
  ];
  return lines.join("\n");
}

/** Haftalık antrenman + beslenme metni (Türkçe, detaylı şablon). `rotation` 0–3 arası döngü; içerik çeşitliliği için kullanılır. */
export function buildWeeklyPlan(focus: GoalFocus, rotation = 0, at: Date = new Date()) {
  const rot = ((Math.floor(rotation) % 4) + 4) % 4;
  const focusLabel = focusTitle(focus);

  const wlMonFinish = [
    "Finiş (isteğe bağlı): 8 dk tempo yürüyüş veya 4×30 sn hafif sled / ip atlama.",
    "Finiş: 6 tur (45 sn bisiklet orta / 45 sn hafif) veya 10 dk incline yürüyüş.",
    "Finiş: Erg kürek 5×(1 dk orta / 1 dk kolay) veya Nordic walk 12 dk.",
    "Finiş: 3 tur devre (kürek 12 + squat vücut ağırlığı 15 + plank 30 sn) hafif tempo.",
  ][rot];

  let workoutPlan: string;

  if (focus === "WEIGHT_LOSS") {
    workoutPlan = [
      `shackWork — haftalık antrenman (${focusLabel})`,
      `Genel: Haftada 4 kuvvet + 2 düşük yoğunluklu kardiyo. Kalori açığı hedefiyle uyumlu; ağırlık koruma öncelikli.`,
      `Ölçüm: Haftada 1 kez tartı + bel çevresi; aynı gün/saat tercih edin.`,
      ``,
      dayBlock(
        "PAZARTESİ",
        "Üst vücut kuvvet + metabolik finiş",
        "55–70 dk",
        [
          "5–8 dk hafif bisiklet / tempolu yürüyüş (konuşabilir tempo).",
          "Omuz mobilite: duvar kayması 2×10, kol daireleri 2×10, thoracic rotation 2×8/side.",
        ],
        [
          "Göğüs itiş (makine veya dumbbell press): 3×10–12, RPE 7, dinlenme 90 sn.",
          "Sırt çekişi (lat pulldown veya cable row): 3×10–12, kürek kemiği sıkıştır.",
          "Lateral raise veya face pull: 3×12–15 (omuz sağlığı).",
          "Plank veya dead bug: 3×30–45 sn (core).",
          wlMonFinish,
        ],
        [
          "Üst gövde statik esneme: göğüs, omuz, sırt — her biri 30–40 sn.",
        ],
        [
          "Form ve kontrol, kilo ikinci planda.",
          "Eklem ağrısında ağırlığı düşür veya hareketi değiştir.",
        ],
      ),
      dayBlock(
        "SALI",
        "Düşük etkili kardiyo + core",
        "40–50 dk",
        [
          "5 dk eklem hareketliliği (kalça daireleri, bacak salınımı).",
        ],
        [
          "Elliptik / yürüyüş bandı: 25–35 dk, nabız %60–70 Hmax veya konuşarak tam cümle kurabildiğin tempo.",
          "Türk get-up hafif kettlebell veya vücut ağırlığı: 2×3/side (öğrenme aşamasında sadece vücut ağırlığı).",
          "Side plank: 2×20–30 sn/side; dead bug 2×10/side.",
        ],
        [
          "Kalça fleksör / gluteal esneme: 5 dk.",
        ],
        [
          "Antrenman sonrası protein + kompleks karbonhidrat öğünü.",
        ],
      ),
      dayBlock(
        "ÇARŞAMBA",
        "Alt vücut kuvvet + patlayıcı hacim (hafif)",
        "60–75 dk",
        [
          "5 dk bisiklet + dinamik bacak salınımı, squat pattern 2×8 vücut ağırlığı.",
        ],
        [
          "Squat veya leg press: 4×8–10, tam derinlikte kontrol.",
          "Rumen deadlift veya hip hinge (DB RDL): 3×10–12, nötr omurga.",
          "Bulgarian split squat veya walking lunge: 3×10 bacak.",
          "Seated veya lying leg curl: 3×12–15.",
          "Standing calf: 3×12–15.",
        ],
        [
          "Hamstring ve quadriceps foam roll / statik 6–8 dk.",
        ],
        [
          "Kardiyo günlerinde bacak ağrısı varsa squat hacmini azalt.",
        ],
      ),
      dayBlock(
        "PERŞEMBE",
        "Aktif dinlenme + yürüyüş",
        "30–45 dk",
        [
          "Eklem hareketliliği 5 dk.",
        ],
        [
          "Tempolu yürüyüş 8.000–10.000 adım hedefi veya 30–40 dk kesintisiz orta tempo.",
          "Hafif core: bird dog 2×10/side, breathing drill 3 dk.",
        ],
        [
          "Nefes ve gevşeme 5 dk.",
        ],
        [
          "Uyku 7.5–8 saat; stres yönetimi bu günün parçası.",
        ],
      ),
      dayBlock(
        "CUMA",
        "Üst + alt süper set (metabolik)",
        "50–65 dk",
        [
          "5–8 dk ip atlama hafif + omuz daireleri.",
        ],
        [
          "A1) DB row 3×12 + A2) Goblet squat 3×12 — süperset, arada 60 sn.",
          "B1) Push-up veya incline press 3×10–12 + B2) RDL hafif 3×10.",
          "C1) Farmer carry 3×30 m + C2) Wall sit 3×30–45 sn.",
        ],
        [
          "Tüm vücut esneme akışı 8 dk.",
        ],
        [
          "Süper sette nabız yükselir; baş dönmesi olursa tempo düşür.",
        ],
      ),
      dayBlock(
        "CUMARTESİ",
        "Kardiyo interval (HIIT hafif) + mobilite",
        "45 dk",
        [
          "5 dk ısınma + progresif tempo.",
        ],
        [
          "Bisiklet veya kürek: 8×(1 dk orta / 1 dk hafif) veya yokuş yürüyüşü 6 tekrar.",
          "Hip 90/90 mobilite, thoracic extension 2×8.",
        ],
        [
          "Foam roll üst sırt + lat 5 dk.",
        ],
        [
          "HIIT haftada 1–2 kez yeter; toparlanma süresini izle.",
        ],
      ),
      dayBlock(
        "PAZAR",
        "Dinlenme ve planlama",
        "20–30 dk (isteğe bağlı)",
        [
          "Hafif yürüyüş 15–20 dk veya tam dinlenme.",
        ],
        [
          "Gelecek hafta antrenman defterini doldur: kilo, tekrar, uyku, stres notu.",
        ],
        [
          "Nefes egzersizi 5 dk.",
        ],
        [
          "Haftalık ölçümü bu gün veya pazartesi sabahına sabitle.",
        ],
      ),
    ].join("\n");
  } else if (focus === "MUSCLE") {
    workoutPlan = [
      `shackWork — haftalık antrenman (${focusLabel})`,
      `Genel: Haftada 5 antrenman; haftalık set hacmi progresyonu (+%2–5 ağırlık veya +1 tekrar) hedeflenir.`,
      `Progresyon: Aynı hareket için son sette 1–2 RIR bırak; iki hafta üst üste tamamlanırsa ağırlık artır.`,
      ``,
      dayBlock(
        "PAZARTESİ",
        "Göğüs + triceps",
        "70–85 dk",
        [
          "Rope face pull 2×15, scap push-up 2×12, hafif göğüs esnetme.",
        ],
        [
          "Bench veya makine press: 4×6–8 (ağır gün).",
          "Incline DB press: 3×8–10.",
          "Cable crossover veya dip: 3×10–12.",
          "Triceps rope pushdown: 3×12–15.",
          "Overhead extension hafif: 2×12–15.",
        ],
        [
          "Göğüs / triceps statik esneme 6 dk.",
        ],
        [
          "Kas büyümesi için uyku ve protein dağılımı kritik.",
        ],
      ),
      dayBlock(
        "SALI",
        "Sırt + biceps",
        "70–85 dk",
        [
          "Dead hang 2×20 sn, kürek sıkıştırma 2×12.",
        ],
        [
          "Pull-up / lat pulldown: 4×6–10.",
          "Barbell veya cable row: 4×8–10.",
          "Single-arm row: 3×10 bacak.",
          "Rear delt fly: 3×12–15.",
          "EZ curl veya DB curl: 3×10–12, hammer curl 2×12.",
        ],
        [
          "Lat ve biceps esnetme 6 dk.",
        ],
        [
          "Sırt rounduşundan kaçın; her tekrarda göğüs kalksın.",
        ],
      ),
      dayBlock(
        "ÇARŞAMBA",
        "Bacak önceliği (quad + posterior)",
        "75–90 dk",
        [
          "Hip circle, bodyweight squat 2×10, lunge matrix hafif.",
        ],
        [
          "Squat veya ön squat: 4×5–8.",
          "RDL veya good morning hafif: 4×8–10.",
          "Leg extension: 3×12–15 + leg curl 3×12–15 (superset opsiyonel).",
          "Walking lunge ağırlıklı: 3×12 adım.",
          "Standing calf: 4×10–12.",
        ],
        [
          "Quad / hamstring foam roll 8 dk.",
        ],
        [
          "Alt sırt ağrısında RDL romunu kısalt.",
        ],
      ),
      dayBlock(
        "PERŞEMBE",
        "Omuz + traps + core",
        "55–70 dk",
        [
          "Band pull-apart 2×20, external rotation 2×12.",
        ],
        [
          "Overhead press veya DB shoulder press: 4×6–10.",
          "Lateral raise: 4×12–15.",
          "Shrugs veya farmer carry ağır: 3×10–12 veya 3×30 m.",
          "Weighted plank: 3×30–45 sn, cable woodchop 3×10/side.",
        ],
        [
          "Boyun ve üst trap gevşetme 5 dk.",
        ],
        [
          "Omuz ağrısında overhead ağırlığı düşür; lateral hacim koru.",
        ],
      ),
      dayBlock(
        "CUMA",
        "Kol günü (isteğe bağlı) veya zayıf halka",
        "50–65 dk",
        [
          "Hafif ısınma + eklem mobilitesi.",
        ],
        [
          "Zayıf halka seç: örneğin hamstring veya üst göğüs için ek volüm 6–8 set.",
          "Ya da izolasyon kol: preacher curl 3×10, triceps skullcrusher 3×10, wrist roller 2× failure hafif.",
        ],
        [
          "Forearm ve dirsek esnetme 5 dk.",
        ],
        [
          "Bu günü bacak yorgunluğuna göre kol veya zayıf halkaya çevirebilirsin.",
        ],
      ),
      dayBlock(
        "CUMARTESİ",
        "Hafif kardiyo + mobilite",
        "40 dk",
        [
          "5 dk bisiklet.",
        ],
        [
          "Tempolu yürüyüş veya hafif kürek 25–30 dk.",
          "Full-body dinamik esneme akışı 10 dk.",
        ],
        [
          "Faszya topu üst sırt 5 dk.",
        ],
        [
          "Kas ağrısı (DOMS) normal; eklem keskin ağrısı değil.",
        ],
      ),
      dayBlock(
        "PAZAR",
        "Dinlenme",
        "—",
        ["Tam dinlenme veya 20 dk hafif yürüyüş."],
        ["Beslenme ve uyku günlüğünü güncelle."],
        ["Nefes çalışması."],
        ["Haftayı değerlendir; bir sonraki mikro döngüyü planla."],
      ),
    ].join("\n");
  } else if (focus === "PERFORMANCE") {
    workoutPlan = [
      `shackWork — haftalık antrenman (${focusLabel})`,
      `Genel: Hız, güç, dayanıklılık ve teknik kalite rotasyonu. Haftada 1 patlayıcı / hız bloğu.`,
      `Teknik: Her ana lift için video veya ayna ile açı kontrolü; tempo notu (ör. 3-1-X) kullan.`,
      ``,
      dayBlock(
        "PAZARTESİ",
        "Hız ve patlayıcılık + alt vücut",
        "65–80 dk",
        [
          "Koşu progresyonu 5 dk, dinamik bacak salınımı, med ball slam hafif 2×5.",
        ],
        [
          "Box jump veya hurdle hop (düşük): 5×3 (tam toparlanma).",
          "Back squat veya front squat: 5×3–5 (hızlı çıkış, kontrollü iniş).",
          "Bulgarian split jump veya step-up ağırlıklı: 3×6 bacak.",
          "Nordic curl negatif veya hamstring curl: 3×6–8.",
        ],
        [
          "Hafif bisiklet 5 dk soğuma.",
        ],
        [
          "Patlayıcı blokta yorgunluk hissedersen set sayısını azalt.",
        ],
      ),
      dayBlock(
        "SALI",
        "Aerobik kapasite (tempo koşu / kürek)",
        "45–60 dk",
        [
          "5 dk ısınma + stride'lar.",
        ],
        [
          "20 dk sürekli: konfor üstü, konuşmak zor tempo (eşik altı).",
          "4×3 dk tempo + 2 dk aktif dinlenme (bisiklet veya koşu bandı).",
        ],
        [
          "Yürüyüş soğuma 5 dk.",
        ],
        [
          "Nabız bölgesini haftalar içinde kademeli yükselt.",
        ],
      ),
      dayBlock(
        "ÇARŞAMBA",
        "Üst vücut güç-hız (med ball + press varyasyonları)",
        "60–70 dk",
        [
          "Shoulder prep: band dislocate hafif, push-up plus 2×10.",
        ],
        [
          "Bench veya push press: 6×2–3 (ağır ama temiz tekrar).",
          "Plyo push-up veya med ball chest pass duvara: 4×5.",
          "Pendlay row veya explosive cable row: 4×5.",
          "Landmine press: 3×8/side.",
        ],
        [
          "Üst gövde esneme 6 dk.",
        ],
        [
          "Patlayıcı itişlerde bilekler nötr; dirsek açısını koru.",
        ],
      ),
      dayBlock(
        "PERŞEMBE",
        "Aktif toparlanma + mobilite",
        "35–45 dk",
        [
          "Hafif bisiklet 8 dk.",
        ],
        [
          "Tempo yüzme / elliptik 20 dk düşük yoğunluk (varsa).",
          "Hip mobility flow 10 dk.",
        ],
        [
          "Nefes: kutu nefesi 3 dk.",
        ],
        [
          "Ağır günlerden sonra uyku kalitesini izle.",
        ],
      ),
      dayBlock(
        "CUMA",
        "Güç dayanıklılığı (orta tekrar, kısa dinlenme)",
        "55–70 dk",
        [
          "Genel ısınma 8 dk.",
        ],
        [
          "Trap bar deadlift veya conventional: 4×5–8.",
          "Push press veya strict press: 4×6–8.",
          "Farmer carry ağır: 4×25 m.",
          "Sled push hafif-orta: 4×15 m veya battle rope 4×20 sn.",
        ],
        [
          "Alt sırt ve kalça esnetme 8 dk.",
        ],
        [
          "Orta bölge (core) için anti-rotasyon egzersizi ekle (Pallof).",
        ],
      ),
      dayBlock(
        "CUMARTESİ",
        "Spor özgü teknik veya agility (şablonda genel)",
        "50 dk",
        [
          "Cone drill veya lateral shuffle 3×5 (5 m mesafe).",
          "Single-leg hop stick: 3×3 bacak (diz stabilitesi).",
          "Sprint tekrarı: 6×40 m %85–90 hız, tam dinlenme.",
        ],
        [
          "Core anti-extension: ab wheel veya stability ball rollout 3×8–10.",
        ],
        [
          "Soğuma yürüyüş 8 dk.",
        ],
        [
          "Branşına göre bu günü teknik antrenmanla değiştir (ör. squat pattern, start çıkışı).",
        ],
      ),
      dayBlock(
        "PAZAR",
        "Planlama + görselleştirme",
        "25 dk",
        [
          "Hafif yürüyüş veya tam dinlenme.",
        ],
        [
          "Gelecek hafta ana lift hedeflerini yaz (ağırlık / RPE / hacim).",
        ],
        [
          "Mental rehearsal 5 dk.",
        ],
        [
          "Beslenme ve hidrasyonu haftalık gözden geçir.",
        ],
      ),
    ].join("\n");
  } else {
    workoutPlan = [
      `shackWork — haftalık antrenman (${focusLabel})`,
      `Genel: Haftada 3 kuvvet + 2 hareketlilik/kardiyo dengesi. Sağlık ve sürdürülebilirlik öncelikli.`,
      ``,
      dayBlock(
        "PAZARTESİ",
        "Tüm vücut hafif-orta",
        "45–55 dk",
        [
          "5 dk yürüyüş + eklem daireleri.",
        ],
        [
          "Goblet squat: 3×10–12.",
          "Push-up veya duvar şınavı: 3×8–12.",
          "One-arm row hafif: 3×10 bacak.",
          "Glute bridge: 3×12, dead bug 3×8/side.",
        ],
        [
          "Tüm vücut esneme 6 dk.",
        ],
        [
          "Nefesini tutma; hareket sırasında düzenli nefes.",
        ],
      ),
      dayBlock(
        "SALI",
        "Yürüyüş + core",
        "40 dk",
        [
          "Isınma 5 dk.",
        ],
        [
          "6.000–8.000 adım veya 30 dk tempolu yürüyüş.",
          "Side plank 2×20 sn/side, bird dog 2×10/side.",
        ],
        [
          "Kalça esnetme 5 dk.",
        ],
        [
          "Ortağınla veya müzikle tempoyu sabitle.",
        ],
      ),
      dayBlock(
        "ÇARŞAMBA",
        "Kuvvet (bacak ağırlıklı)",
        "50 dk",
        [
          "Isınma squat pattern 2×8 vücut ağırlığı.",
        ],
        [
          "Leg press veya sandalyeden kalkış: 3×12.",
          "Romanian deadlift hafif DB: 3×10.",
          "Step-up: 3×10 bacak.",
          "Calf raise: 3×15.",
        ],
        [
          "Quad/hamstring esneme 6 dk.",
        ],
        [
          "Denge için tek bacak hareketlerinde tutunak kullan.",
        ],
      ),
      dayBlock(
        "PERŞEMBE",
        "Dinlenme veya hafif aktivite",
        "30 dk",
        ["İsteğe bağlı: yüzme, bisiklet veya yoga akışı 25–30 dk."],
        ["Vücut ağırlığı mobilite 10 dk."],
        ["Derin nefes 5 dk."],
        ["Eklem ağrısı varsa bu günü tam dinlendirmeye çevir."],
      ),
      dayBlock(
        "CUMA",
        "Üst vücut + postür",
        "45–55 dk",
        [
          "Kürek ve omuz ısınması 6 dk.",
        ],
        [
          "Cable veya band row: 3×12–15.",
          "Chest press makine: 3×10–12.",
          "Face pull: 3×15.",
          "Wall slide veya Y raise: 3×12.",
          "Plank: 3×30 sn.",
        ],
        [
          "Boyun ve göğüs esnetme 5 dk.",
        ],
        [
          "Monitör yüksekliğini göz hizasına getir; postürü destekle.",
        ],
      ),
      dayBlock(
        "CUMARTESİ",
        "Aile / dış mekan aktivitesi",
        "45–90 dk",
        [
          "Doğada yürüyüş, bisiklet veya hafif oyun (futbol, badminton).",
        ],
        [
          "Orta şiddette kalp atışı; keyif öncelikli.",
        ],
        ["—"],
        [
          "Haftalık ekran süresinden 30 dk kısarak uyku kalitesini artır.",
        ],
      ),
      dayBlock(
        "PAZAR",
        "Haftalık değerlendirme",
        "20 dk",
        [
          "Uyku, stres, enerji skorunu 1–10 yaz.",
        ],
        [
          "Gelecek hafta 1 küçük hedef seç (ör. +1 bardak su).",
        ],
        ["Hafif yürüyüş 15 dk (isteğe bağlı)."],
        [
          "Düzenlilik, mükemmellikten daha önemli.",
        ],
      ),
    ].join("\n");
  }

  const mealAccents = [
    `  • Haftalık mini hedef: günde +1 porsyon sebze veya çiğ salata.`,
    `  • Haftalık mini hedef: her ana öğünden önce 1 bardak su.`,
    `  • Haftalık mini hedef: akşamda küçük tabak + bol yeşil salata dengesi.`,
    `  • Haftalık mini hedef: işlenmiş et yerine 2 öğünde bakliyat dene.`,
  ];

  const mealPlan = [
    `shackWork — haftalık beslenme çerçevesi (${focusLabel})`,
    ``,
    `Genel ilkeler`,
    `  • Her ana öğünde kaliteli protein (30–40 g hedefi yetişkin için yaklaşık; bireye göre ayarla).`,
    `  • Tabak modeli: 1/2 sebze, 1/4 protein, 1/4 kompleks karbonhidrat (pirinç, bulgur, patates, yulaf).`,
    `  • Sağlıklı yağlar: zeytinyağı, kuruyemiş, avokado; trans yağtan kaçın.`,
    `  • Günlük su: en az 2–2.5 L; antrenman günü +300–500 ml.`,
    `  • İşlenmiş et ve aşırı şekerli içecekleri sınırla.`,
    ``,
    `Antrenman günü zamanlama`,
    `  • Antrenmandan 1.5–3 saat önce: karbonhidrat + orta protein (ör. yulaf + yoğurt + meyve).`,
    `  • Antrenmandan 60–90 dk önce: hafif, tolere ettiğin bir atıştırmalık (muz + süt/ay içeceği).`,
    `  • Antrenmandan sonra 2 saat içinde: protein + karbonhidrat (ör. tavuk + pilav + salata).`,
    ``,
    `Örnek gün şablonu (3 ana öğün + 1 ara)`,
    `  Kahvaltı: 2–3 yumurta veya peynir + tam tahıl ekmek + domates/salatalık + çay.`,
    `  Ara: meyve + bir avuç badem veya yoğurt.`,
    `  Öğle: mercimek/et yemeği + bulgur pilavı + bol yeşil salata + zeytinyağı.`,
    `  Akşam: balık veya hindi + fırın sebze + yoğurt veya cacık.`,
    ``,
    focus === "WEIGHT_LOSS"
      ? `Odak (${focusLabel}): haftalık ortalama kalori hafif açık; protein gramajını koru veya artır; gece atıştırmalıklarında protein öncelikli seç (lor peyniri, yoğurt).`
      : focus === "MUSCLE"
        ? `Odak (${focusLabel}): antrenman günlerinde karbonhidratı biraz yükselt; protein dağılımını öğünlere yay; uyku 7+ saat.`
        : focus === "PERFORMANCE"
          ? `Odak (${focusLabel}): antrenman öncesi düşük lif / düşük gaz seçenekleri dene; sıvı + elektrolit dengesi; yarış/yoğun gün öncesi yeni besin deneme.`
          : `Odak (${focusLabel}): çeşitlilik ve lif (sebze, bakliyat); haftada 2 porsyon balık veya omega-3 kaynağı hedefle.`,
    ``,
    mealAccents[rot],
    ``,
    `Haftalık kontrol listesi`,
    `  • Buzdolabı: sebze, protein kaynağı, tam tahıl stok kontrolü.`,
    `  • Yemek hazırlığı: 1 gün toplu pişirme (tavuk, mercimek, pilav) ile 3 öğün kurtar.`,
    `  • Dışarıda yemek: ızgara/ fırın seçenekleri; sosları ayrı iste.`,
  ].join("\n");

  const stamp = at.toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" });
  const footer = `\n\n───\nVaryant ${["A", "B", "C", "D"][rot]} · Son güncelleme: ${stamp}`;
  return { workoutPlan: workoutPlan + footer, mealPlan: mealPlan + footer };
}
