#!/usr/bin/env node
// "shackwork-sunum-rehberi.pdf" üretir.
// Her dosya için: DETAYLI ANLATIM + işaretli kod + "ne diyeceksin" kutusu.

import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const OUT_PDF = path.join(ROOT, "sunum", "shackwork-sunum-rehberi.pdf");
const OUT_HTML = path.join(ROOT, "sunum", "shackwork-sunum-rehberi.html");

// ──────────────────────────────────────────────────────────────────
// SLAYTLAR — her biri: hikâye + işaretli kod + ipuçları
// ──────────────────────────────────────────────────────────────────
const SLIDES = [
  {
    file: "prisma/schema.prisma",
    title: "Veritabanı Şeması — Prisma",
    story: [
      "Bu dosya benim VERİTABANI tasarımım. Prisma ORM kullanıyorum; Prisma bu dosyayı okuyup veritabanını otomatik oluşturuyor.",
      "Toplamda 8 ana modelim var: User (kullanıcı), Coach (koç), Goal (hedefler), BodyMetric (kilo ölçümleri), DayLog (günlük kayıt), WeeklyPlan (haftalık plan), ProgressPhoto (gelişim fotoğrafları), CoachNote (koç notları). Bir de PasswordResetToken yardımcı tablom var.",
      "İlişkilere dikkat çekmek istiyorum: User → Goal → WeeklyPlan zinciri var. Plan üretirken kullanıcının hedeflerini referans alıyorum. Tüm ilişkilerde 'onDelete: Cascade' kullandım — kullanıcı silinince ona bağlı tüm veriler de otomatik temizleniyor.",
    ],
    excerpts: [
      {
        from: 7, to: 11,
        highlight: [9, 10],
        note: "SQLite seçimim: demo kolaylığı. Üretimde 'postgresql' yazıp DATABASE_URL'i değiştirirsem kod hiç değişmez.",
        callout: "Burayı göster",
      },
      {
        from: 26, to: 49,
        highlight: [27, 33, 34, 36],
        note: "User modeli. passwordHash → bcrypt hash'i (asla düz metin değil), role → kullanıcı/koç ayrımı, goalFocus → AI'ın referans aldığı kategori.",
        callout: "User'ın güvenlik alanları",
      },
      {
        from: 72, to: 82,
        highlight: [72, 73, 78],
        note: "⭐ Goal modeli — projenin en kritik tablosu. description alanını AI okuyor. Sunucuda en az 25 karakter zorunlu kıldım, yoksa AI iyi plan yazamıyor.",
        callout: "AI'ın okuduğu alan",
      },
      {
        from: 108, to: 121,
        highlight: [108, 109, 116, 117, 120],
        note: "⭐ WeeklyPlan — AI'ın ürettiği haftalık plan. @@unique([userId, weekStart]) → bir kullanıcının aynı hafta için iki farklı planı OLMASIN diye koydum. Üst üste basılırsa eskiyi günceller (upsert).",
        callout: "Haftalık plan tablosu",
      },
    ],
    sayThis:
      "\"Burada 8 ana modelim var. En kritiği Goal ve WeeklyPlan. Goal'un description alanını AI plan üretirken okuyor — o yüzden sunucuda en az 25 karakter zorunlu kıldım. WeeklyPlan'de @@unique kısıtı sayesinde aynı hafta için bir kullanıcı sadece bir plana sahip oluyor.\"",
  },
  {
    file: "src/lib/password-policy.ts",
    title: "Şifre Politikası — Güvenlik 1/2",
    story: [
      "Bu dosyada güçlü şifre kurallarımı tanımladım. 5 kural var: en az 8 karakter, en az bir küçük harf, en az bir büyük harf, en az bir rakam ve en az bir özel karakter.",
      "Burada önemli bir nokta: regex'lerimi 'Unicode-aware' yazdım. Normal /[a-z]/ yazsam Türkçe harfleri görmezdi; \\p{Ll} kullanınca ş, ğ, ü, ö, ç gibi karakterler de küçük harf olarak sayılıyor. Bu, Türkçe kullanıcılar için kritik.",
      "Şifre kontrolünü hem ARAYÜZDE gösteriyorum (canlı tikler) hem de SUNUCUDA doğruluyorum. Biri Postman ile doğrudan API'ye istek atsa bile zayıf şifre geçemez. Bu prensibe 'defense in depth' (derinlemesine savunma) deniyor.",
    ],
    excerpts: [
      {
        from: 12, to: 39,
        highlight: [17, 18, 19, 20, 23, 24, 25, 26, 34, 35, 36, 37],
        note: "5 kuralın tanımı. Her biri için anlamlı bir label (UI'da çıkıyor) ve test fonksiyonu var.",
        callout: "5 şifre kuralı",
      },
      {
        from: 47, to: 55,
        highlight: [47, 48, 49, 50, 51, 52, 53, 54],
        note: "Sunucu tarafı doğrulama. Hangi kural başarısız olduysa hata mesajına ekleyip dönüyor.",
        callout: "Sunucu doğrulaması",
      },
    ],
    sayThis:
      "\"Burada \\p{Ll} yazıyor — bu Unicode-aware regex. Türkçe küçük harfler ş, ğ, ü, ö, ç dahil. Bunu hem arayüzde canlı feedback için, hem sunucuda doğrulamada kullanıyorum. İki katmanlı koruma sayesinde Postman'la bile zayıf şifre geçemez.\"",
  },
  {
    file: "src/lib/auth.ts",
    title: "Kimlik Doğrulama — Güvenlik 2/2",
    story: [
      "Bu dosya kimlik doğrulama yardımcılarımı içeriyor. Üç temel parça var: şifre hash'i (bcrypt), oturum token'ı (JWT) ve güvenli çerez.",
      "Şifreleri ASLA düz metin saklamıyorum. bcrypt ile 10 round salt kullanarak tek yönlü hash'liyorum. Yani veritabanı sızsa bile şifreler okunamaz; her şifrenin kendine özel rastgele tuzu var, gökkuşağı tablosu (rainbow table) saldırısı da işe yaramaz.",
      "Oturum yönetimi için JWT (JSON Web Token) kullanıyorum. Giriş başarılı olunca bir token üretip httpOnly çereze yazıyorum. Bu çerezi JavaScript okuyamadığı için XSS saldırılarına karşı dayanıklı. 30 gün geçerli; süre dolunca kullanıcı tekrar giriş yapar.",
    ],
    excerpts: [
      {
        from: 15, to: 22,
        highlight: [15, 16, 17, 18],
        note: "⭐ bcrypt ile şifre hash'leme. 10 round → maliyetli (CPU yoğun), brute-force saldırıyı yavaşlatıyor.",
        callout: "Şifre hash",
      },
      {
        from: 24, to: 31,
        highlight: [24, 25, 26, 27, 28, 29, 30],
        note: "⭐ JWT üretimi. sub: userId → token sahibinin kim olduğu. HS256 → simetrik imzalama. 30 gün geçerli.",
        callout: "JWT üretimi",
      },
      {
        from: 45, to: 55,
        highlight: [45, 46, 47, 48, 49, 50, 51, 52, 53, 54],
        note: "⭐ Çerez ayarları. httpOnly (XSS koruması) + sameSite lax (CSRF) + secure (üretimde HTTPS).",
        callout: "Güvenli çerez",
      },
    ],
    sayThis:
      "\"Üç güvenlik katmanım var. Bir: bcrypt — şifre hash'i. İki: JWT — oturum token'ı. Üç: httpOnly çerez — JavaScript bu çerezi okuyamadığı için XSS saldırılarına dayanıklı. Ayrıca üretimde secure: true ile sadece HTTPS üzerinden gönderiliyor.\"",
  },
  {
    file: "src/lib/ai-weekly-plan.ts",
    title: "AI Plan Üreticisi — Projenin Kalbi",
    story: [
      "Bu dosya projenin en kritik kısmı. Google Gemini API'sini kullanarak haftalık antrenman ve beslenme programı üretiyor.",
      "Tasarım kararlarım: BİRİNCİ, antrenman ve beslenmeyi İKİ AYRI çağrıyla üretiyorum. Tek istek olunca Gemini bazen uzun JSON cevabı tam üretmeden kesiyor; ayırınca her biri daha derli toplu çıkıyor.",
      "İKİNCİ, prompt'a iki özel alan ekledim: 'userId' (kullanıcı kimliği) ve 'uniquenessSeed' (her istekte yeni rastgele UUID). Bunlar sayesinde aynı kullanıcı 'yenile' dese bile farklı plan üretiliyor. AI'a 'bu plan yalnızca bu kişiye özel, kopya yapma' diyorum.",
      "ÜÇÜNCÜ, AI cevap verdikten sonra DOĞRULAMA yapıyorum. En az 4 gün başlığı var mı, metin yeterli uzunlukta mı, hedefteki anahtar kelimeler yansımış mı, placeholder metin var mı? Hatalıysa AI'a 'şunu düzelt' diye ikinci tur soru atıyorum.",
      "DÖRDÜNCÜ, birden çok model deniyorum: gemini-2.0-flash → 2.0-flash-001 → 1.5-flash-latest. Biri kotaya takılırsa diğerine geçiyorum. Sunum sırasında ağ veya kota sorunu olsa bile bir model genellikle yanıt veriyor.",
    ],
    excerpts: [
      {
        from: 1, to: 19,
        highlight: [1, 2, 3, 8],
        note: "Dosyanın özeti üstte. userId + uniquenessSeed mantığım buradan başlıyor.",
        callout: "Dosya başlığı",
      },
      {
        from: 122, to: 145,
        highlight: [135, 136, 137, 138, 139, 140, 141, 142],
        note: "⭐ Prompt'un bağlam bölümü. userId ve uniquenessSeed'i AI'a aktarıyorum, sonra 'kopya yapma' uyarısı.",
        callout: "AI'a 'kopya yapma' diyorum",
      },
      {
        from: 222, to: 240,
        highlight: [223, 224, 225],
        note: "temperature 0.62 → modelin yaratıcılık seviyesi. 0 olsa hep aynı yazardı, 1 olsa dağılırdı. Orta-üst seçtim.",
        callout: "AI yaratıcılık ayarı",
      },
    ],
    sayThis:
      "\"Bu projenin en kritik dosyası. AI plan üretirken üç şey yapıyorum: bir, prompt'a userId ve rastgele UUID veriyorum — aynı kullanıcı yenilese bile farklı plan çıkar. İki, AI cevap verince doğrulama yapıyorum, hatalıysa düzeltme isteği atıyorum. Üç, birden çok model deniyorum — biri kotada takılırsa diğeri devreye giriyor.\"",
  },
  {
    file: "src/app/api/plans/weekly/route.ts",
    title: "Plan API'si — AI + Yedek Yol",
    story: [
      "Bu dosya /api/plans/weekly endpoint'i. Kullanıcı arayüzdeki 'AI ile program oluştur' butonuna bastığında buraya istek geliyor.",
      "İki fonksiyon var: GET (kayıtlı planı getir) ve POST (yeni plan üret). POST kısmı kritik. Şu sırayla çalışıyor:",
      "BİR — Kullanıcının hiç hedefi yoksa hata dönüyorum. 'Önce hedef ekle' diyorum. Bu kontrol olmasaydı yeni hesaba otomatik şablon plan basılırdı (eski sürümün hatası).",
      "İKİ — Hedef detayı 25 karakterden az ise yine hata. Çünkü detaysız girdiyle AI iyi plan yazamaz. 'Yağ kaybı' yetmez; 'haftada 4 gün salon, diz hassasiyeti...' gibi gerçek bilgi olmalı.",
      "ÜÇ — Gemini'ye istek atıyorum (uzun yolun detayı ai-weekly-plan.ts'de).",
      "DÖRT — En kritik kısım: Gemini başarısız olursa ne yapıyorum? PAYLAŞILAN ŞABLON BASMIYORUM. userSalt (kullanıcı ID karakter toplamı) + goalSalt (hedef başlığı karakter toplamı) ile her kullanıcı ve hedef için FARKLI varyasyon seçiyorum. Üstüne 'prependGoalsSummary' ile kullanıcının kendi hedef metnini ekliyorum. Yani yedek plan da KİŞİSEL.",
    ],
    excerpts: [
      {
        from: 1, to: 10,
        highlight: [1, 2, 3, 4, 5, 6, 7],
        note: "Dosya başında ne yaptığım yazılı. GET = getir, POST = üret (gemini → yedek).",
        callout: "Endpoint özeti",
      },
      {
        from: 60, to: 95,
        highlight: [62, 63, 78],
        note: "İki kapı: hedef yok mu? Detay 25 karakterden az mı? Aksi durumda 422 dönüyor.",
        callout: "Hedef + detay kontrolleri",
      },
      {
        from: 103, to: 120,
        highlight: [104, 105, 106, 107, 108],
        note: "Gemini'ye istek. randomUUID() → her seferinde yeni özgünlük tohumu.",
        callout: "AI çağrısı + UUID",
      },
      {
        from: 130, to: 165,
        highlight: [137, 138, 139, 140, 141, 142, 143, 144, 145, 146, 147, 148, 149, 150, 151, 152],
        note: "⭐⭐⭐ EN KRİTİK: Gemini başarısızsa yedek. userSalt + goalSalt → her kullanıcı/hedef için farklı varyant. Sonra kullanıcının hedef metni planın üstüne yapıştırılıyor.",
        callout: "Kişisel yedek mantığı",
      },
    ],
    sayThis:
      "\"Buradaki en önemli kararım: Gemini cevap vermezse yedeğe geçiyorum, AMA yedek bile paylaşılan şablon değil. Kullanıcının ID'sinin karakter kodlarını ve hedef başlığını karıştırıp bir varyasyon numarası üretiyorum. Sonra kullanıcının kendi hedef metnini planın en üstüne yapıştırıyorum. Yani iki kullanıcı yan yana otursa bile aynı yedek planı görmüyor.\"",
  },
];

// ──────────────────────────────────────────────────────────────────
// Teknoloji seçimleri — soru-cevap
// ──────────────────────────────────────────────────────────────────
const TECH_QA = [
  {
    q: "Neden Next.js (Express değil)?",
    a: [
      "Frontend (React) ve backend (API Routes) tek projede; ayrı bir Node sunucu kurmak zorunda kalmadım.",
      "App Router ile dosya tabanlı yönlendirme — yapı net, README okumadan herkes anlayabilir.",
      "SSR ve statik üretim desteği var; ileride SEO için ücretsiz avantaj.",
      "Turbopack ile geliştirme sırasında hot reload çok hızlı.",
      "Vercel, Railway, Render gibi platformlara tek tıkla deploy edilebiliyor.",
    ],
  },
  {
    q: "Neden TypeScript (JavaScript değil)?",
    a: [
      "Tip güvenliği → çalıştırmadan çoğu hatayı IDE yakalıyor.",
      "Prisma'nın ürettiği tip tanımları sayesinde DB sorgularında hata yapma şansı çok az.",
      "Otomatik tamamlama ile geliştirme hızı arttı.",
      "JavaScript ile geriye dönük uyumlu — eski kod da çalışıyor.",
    ],
  },
  {
    q: "Neden Prisma + SQLite?",
    a: [
      "Prisma → tip güvenli ORM, schema dosyası ile veritabanını tek elden yönetiyorum.",
      "SQLite → tek dosya, kurulum yok, demo ve geliştirme için ideal.",
      "Üretime taşımak için tek satır değişiklik: 'sqlite' → 'postgresql' + DATABASE_URL.",
      "Migration sistemi sayesinde şema değişiklikleri sürüm kontrollü.",
    ],
  },
  {
    q: "Neden Google Gemini (OpenAI/ChatGPT değil)?",
    a: [
      "Ücretsiz katmanı OpenAI'a göre cömert; öğrenci projesi için ücretsiz çalıştırılabiliyor.",
      "Türkçe çıktı kalitesi yüksek (ChatGPT 3.5 ile karşılaştırılabilir).",
      "responseMimeType: 'application/json' ile JSON parse güvenli.",
      "Birden çok model var (flash, pro); biri kotada takılırsa diğeri kullanılabiliyor.",
    ],
  },
  {
    q: "Neden bcrypt + JWT?",
    a: [
      "bcrypt → adaptif yavaş hash; brute-force saldırılarına karşı dayanıklı.",
      "JWT → sunucu tarafı oturum DB'sine gerek yok; stateless yapı.",
      "httpOnly çerez ile XSS riski yok.",
      "jose kütüphanesi modern; Edge runtime uyumlu (Next.js 16 ile uyum).",
    ],
  },
  {
    q: "Neden TailwindCSS (vanilla CSS değil)?",
    a: [
      "Inline class'larla hızlı stillendirme; ayrı CSS dosyası gezme yok.",
      "Build-time PurgeCSS → sadece kullanılan class'lar pakete giriyor (küçük dosya).",
      "Tasarım tutarlılığı: spacing, renk paletleri standart.",
      "Karanlık tema kolay (dark: prefix).",
    ],
  },
  {
    q: "Neden Recharts?",
    a: [
      "React-native veri görselleştirme; deklaratif API (JSX gibi yazılıyor).",
      "ResponsiveContainer ile mobil uyumlu.",
      "Chart.js'e göre React entegrasyonu daha temiz.",
    ],
  },
  {
    q: "Neden pdf-lib?",
    a: [
      "Saf JavaScript — Chromium veya başka PDF sunucusu gerekmiyor.",
      "Server-side PDF üretimi (Next.js API route'unda çalışıyor).",
      "Hafif: Puppeteer'a göre yaklaşık 10x küçük bağımlılık.",
    ],
  },
  {
    q: "Tek büyük page.tsx neden?",
    a: [
      "MVP hızı için bilinçli tercih; tüm akış tek yerde, hızlı geliştirme.",
      "Proje ölçeği küçük olduğundan modülerleştirme şu an overkill olurdu.",
      "İlerleyen sürümde <DashboardTabs /> gibi alt bileşenlere bölünecek.",
    ],
  },
  {
    q: "Test neden yok?",
    a: [
      "MVP aşaması; öncelik özelliklerin çalışması oldu.",
      "Manuel test yaptım: kayıt, giriş, plan üretimi, PDF indirme akışlarını defalarca denedim.",
      "Sonraki sürümde Vitest ile API testleri eklenecek (özellikle plan üretimi doğrulama mantığına).",
    ],
  },
];

// ──────────────────────────────────────────────────────────────────
// 6 dakikalık konuşma metni
// ──────────────────────────────────────────────────────────────────
const SPEECH = [
  {
    time: "0:00 – 0:30",
    title: "Açılış",
    text: "Merhaba, ben [adın]. Bugün size shackWork adlı projemi anlatacağım. shackWork; spor yapan birinin antrenmanını, beslenmesini, hedeflerini ve gelişim fotoğraflarını tek bir yerden takip etmesini sağlayan bir web uygulaması. Asıl özelliği: haftalık plan yapay zekâ ile, her kullanıcıya farklı üretiliyor — hazır şablon kullanmıyorum.",
  },
  {
    time: "0:30 – 1:00",
    title: "Teknolojiler",
    text: "Next.js 16 App Router (frontend + backend tek projede), TypeScript (tip güvenliği), Prisma ORM + SQLite (demo kolaylığı; PostgreSQL'e tek satır değişiklik), Google Gemini (AI), bcrypt + JWT (güvenlik), TailwindCSS, Recharts (kilo grafiği).",
  },
  {
    time: "1:00 – 1:45",
    title: "Veritabanı",
    text: "Burası prisma/schema.prisma. 8 ana modelim var. En kritik olanlar Goal ve WeeklyPlan. Goal'un description alanını AI plan üretirken okuyor, o yüzden sunucuda en az 25 karakter zorunlu. WeeklyPlan'de @@unique([userId, weekStart]) kısıtı sayesinde aynı hafta için tek plan tutuluyor. İlişkilerde onDelete:Cascade var; kullanıcı silinince tüm bağlı veriler temizleniyor.",
  },
  {
    time: "1:45 – 2:30",
    title: "Güvenlik",
    text: "İki dosyada güvenlik kararlarım var. password-policy.ts'te güçlü şifre kuralları — Unicode-aware regex sayesinde Türkçe karakterler doğru algılanıyor. auth.ts'te bcrypt ile 10 round salt hash, JWT (HS256, 30 gün), ve httpOnly çerez. JavaScript çerezi okuyamadığı için XSS'e dayanıklı.",
  },
  {
    time: "2:30 – 3:15",
    title: "Kısa Demo",
    text: "Şimdi paneli görelim. Yeni hesap açtım, kilo ekledim, hedef yazdım: 'yağ kaybı ve fitness toparlanma'. Detayda haftada 4 gün salon, diz hassasiyeti, beslenme tercihleri yazıyor. Detay 25 karakter zorunlu çünkü AI bunu okuyor. 'AI ile program oluştur' butonuna basıyorum.",
  },
  {
    time: "3:15 – 5:00",
    title: "AI Plan Üretimi (KALP)",
    text: "Bu dosya ai-weekly-plan.ts — projenin kalbi. Dört tasarım kararım var. Bir: antrenman ve beslenmeyi ayrı çağrılarla üretiyorum çünkü tek istek JSON'u kesiyor. İki: prompt'a userId ve uniquenessSeed UUID veriyorum, aynı kullanıcı yenilese bile farklı plan çıkıyor. Üç: cevap geldikten sonra doğrulama yapıyorum; gün başlıkları, uzunluk, anahtar kelimeler. Hatalıysa düzeltme notuyla ikinci tur. Dört: birden çok model deniyorum — biri kotada takılırsa diğeri. plans/weekly/route.ts dosyasında Gemini başarısız olursa yedek var; ama yedek bile userSalt + goalSalt ile kullanıcıya özel varyasyon. Hiç kimse aynı planı görmüyor.",
  },
  {
    time: "5:00 – 5:30",
    title: "Koç + Günlük",
    text: "Sistemde 8 koç var, hedef etiketlerine göre eşleştiriliyor (coach-match.ts). Kullanıcı her gün antrenman ve yemek günlüğü tutabiliyor; AI bu günlükten Türkçe rapor çıkarıyor.",
  },
  {
    time: "5:30 – 6:00",
    title: "Kapanış",
    text: "Toparlayayım: shackWork üç şey için — tek yerden takip, AI ile kişiye özel plan, etiket tabanlı koç eşleştirme. Gelecekte: PostgreSQL'e taşımak, mobil uygulama, koç-danışan mesajlaşma, Apple Health entegrasyonu. Beni dinlediğiniz için teşekkürler. Sorularınızı bekliyorum.",
  },
];

// ──────────────────────────────────────────────────────────────────
const escapeHtml = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

async function readSlice(absFile, from, to) {
  const text = await fs.readFile(absFile, "utf8");
  const lines = text.split(/\r?\n/);
  const start = Math.max(0, from - 1);
  const end = Math.min(lines.length, to);
  return lines.slice(start, end).map((line, i) => ({
    n: start + i + 1,
    text: line,
  }));
}

function codeBlock(rows, highlight) {
  const hSet = new Set(highlight ?? []);
  const out = rows
    .map((r) => {
      const cls = hSet.has(r.n) ? "hl" : "";
      return `<div class="row ${cls}"><span class="lno">${r.n}</span><span class="line">${
        escapeHtml(r.text) || "&nbsp;"
      }</span></div>`;
    })
    .join("");
  return `<div class="code">${out}</div>`;
}

async function main() {
  const slidesHtml = [];

  for (const slide of SLIDES) {
    const absFile = path.join(ROOT, slide.file);

    const storyHtml = slide.story
      .map((p) => `<p>${escapeHtml(p)}</p>`)
      .join("");

    const blocks = [];
    for (const ex of slide.excerpts) {
      const rows = await readSlice(absFile, ex.from, ex.to);
      blocks.push(`
        <div class="excerpt">
          <div class="excerpt-head">
            <span class="callout">${escapeHtml(ex.callout)}</span>
            <span class="loc">${escapeHtml(slide.file)} : ${ex.from}-${ex.to}</span>
          </div>
          ${codeBlock(rows, ex.highlight)}
          <div class="note">📌 ${escapeHtml(ex.note)}</div>
        </div>
      `);
    }

    slidesHtml.push(`
      <section class="slide">
        <p class="filebadge">${escapeHtml(slide.file)}</p>
        <h2>${escapeHtml(slide.title)}</h2>
        <div class="story">${storyHtml}</div>
        <h3 class="section-mark">🔍 İşaretli kod parçaları</h3>
        ${blocks.join("\n")}
        <div class="keypoint">
          <div class="keypoint-title">💬 Sunumda söyleyeceğin cümle</div>
          <p>${escapeHtml(slide.sayThis)}</p>
        </div>
      </section>
    `);
  }

  const qaHtml = TECH_QA.map(
    (qa) => `
      <div class="qa">
        <h3>${escapeHtml(qa.q)}</h3>
        <ul>${qa.a.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul>
      </div>
    `,
  ).join("\n");

  const speechHtml = SPEECH.map(
    (s) => `
      <div class="speech">
        <div class="speech-head">
          <span class="time">${escapeHtml(s.time)}</span>
          <span class="step">${escapeHtml(s.title)}</span>
        </div>
        <p>${escapeHtml(s.text)}</p>
      </div>
    `,
  ).join("\n");

  const html = `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8" />
<title>shackWork — Sunum Rehberi</title>
<style>
  @page { size: A4; margin: 14mm 12mm; }
  * { box-sizing: border-box; }
  html, body {
    font-family: "Segoe UI", -apple-system, system-ui, "Inter", "Noto Sans", sans-serif;
    color: #18181b;
    background: #ffffff;
    font-size: 10.5pt;
    line-height: 1.55;
    margin: 0;
  }
  /* Kapak */
  .cover {
    page-break-after: always;
    text-align: center;
    padding: 50mm 10mm 30mm;
  }
  .cover .tag {
    display: inline-block;
    padding: 3mm 6mm;
    background: #ecfdf5;
    color: #047857;
    border-radius: 999px;
    font-weight: 600;
    font-size: 10pt;
    margin-bottom: 10mm;
  }
  .cover h1 {
    font-size: 38pt;
    color: #064e3b;
    margin: 0 0 4mm;
    letter-spacing: -1px;
  }
  .cover .subtitle {
    color: #555;
    font-size: 13pt;
    margin: 0 0 18mm;
  }
  .cover .toc {
    text-align: left;
    max-width: 130mm;
    margin: 0 auto;
    border-top: 1px dashed #d4d4d8;
    padding-top: 8mm;
  }
  .cover .toc h3 { margin: 0 0 3mm; color: #064e3b; }
  .cover .toc ol { margin: 0; padding-left: 5mm; color: #444; line-height: 1.9; }

  /* Bölüm kapakları */
  .section-cover {
    page-break-before: always;
    text-align: center;
    padding: 70mm 10mm 30mm;
  }
  .section-cover h1 {
    color: #064e3b;
    font-size: 26pt;
    margin: 0 0 4mm;
  }
  .section-cover p {
    color: #555;
    font-size: 11pt;
    max-width: 130mm;
    margin: 0 auto;
  }

  /* Slayt */
  .slide {
    page-break-before: always;
    padding-bottom: 4mm;
  }
  .slide:first-of-type { page-break-before: avoid; }
  .filebadge {
    display: inline-block;
    font-family: ui-monospace, "Cascadia Code", "Consolas", monospace;
    font-size: 9pt;
    color: #047857;
    background: #ecfdf5;
    border: 1px solid #a7f3d0;
    padding: 1mm 3mm;
    border-radius: 4px;
    margin: 0 0 3mm 0;
  }
  h2 {
    font-size: 18pt;
    color: #064e3b;
    margin: 0 0 4mm;
    border-bottom: 2px solid #d1fae5;
    padding-bottom: 2mm;
  }
  .story {
    background: #f0fdf4;
    border-left: 3px solid #10b981;
    padding: 3mm 4mm;
    margin: 0 0 5mm;
    border-radius: 0 4px 4px 0;
  }
  .story p {
    margin: 0 0 2mm;
    color: #1f2937;
  }
  .story p:last-child { margin-bottom: 0; }
  h3.section-mark {
    font-size: 12pt;
    color: #047857;
    margin: 5mm 0 3mm;
    border-bottom: 1px dashed #d1fae5;
    padding-bottom: 1mm;
  }

  /* Kod alıntıları */
  .excerpt {
    margin: 0 0 5mm;
    page-break-inside: avoid;
  }
  .excerpt-head {
    background: #18181b;
    color: #d4d4d8;
    padding: 1.5mm 4mm;
    border-radius: 4px 4px 0 0;
    font-family: ui-monospace, "Cascadia Code", "Consolas", monospace;
    font-size: 8.5pt;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .excerpt-head .callout {
    background: #fbbf24;
    color: #18181b;
    padding: 0.3mm 2mm;
    border-radius: 3px;
    font-weight: 700;
    font-family: "Segoe UI", system-ui, sans-serif;
    font-size: 9pt;
  }
  .excerpt-head .loc { color: #a7f3d0; }
  .code {
    background: #0f172a;
    color: #e2e8f0;
    border: 1px solid #1e293b;
    border-top: 0;
    font-family: ui-monospace, "Cascadia Code", "Consolas", monospace;
    font-size: 8.5pt;
    line-height: 1.45;
    padding: 2mm 0;
    border-radius: 0 0 4px 4px;
    overflow: hidden;
  }
  .row {
    display: flex;
    padding: 0 4mm;
    align-items: flex-start;
  }
  .row.hl {
    background: rgba(234, 179, 8, 0.18);
    border-left: 3px solid #facc15;
    padding-left: calc(4mm - 3px);
  }
  .row.hl .lno { color: #fde047; font-weight: 700; }
  .lno {
    min-width: 9mm;
    color: #64748b;
    text-align: right;
    padding-right: 3mm;
    user-select: none;
    flex-shrink: 0;
  }
  .line {
    white-space: pre-wrap;
    word-break: break-word;
    flex: 1;
  }
  .note {
    background: #fffbeb;
    color: #713f12;
    border: 1px solid #fde68a;
    border-radius: 4px;
    padding: 2mm 3mm;
    margin: 2mm 0 0;
    font-size: 9.5pt;
  }
  .keypoint {
    margin-top: 6mm;
    background: #ecfdf5;
    border: 2px solid #10b981;
    border-radius: 6px;
    padding: 3mm 4mm;
    page-break-inside: avoid;
  }
  .keypoint-title {
    color: #047857;
    font-weight: 700;
    font-size: 11pt;
    margin-bottom: 2mm;
  }
  .keypoint p {
    margin: 0;
    color: #064e3b;
    font-size: 11pt;
    line-height: 1.55;
  }

  /* Q&A */
  .qa {
    margin: 0 0 5mm;
    page-break-inside: avoid;
  }
  .qa h3 {
    color: #064e3b;
    font-size: 12pt;
    margin: 0 0 1mm;
    border-left: 4px solid #10b981;
    padding-left: 3mm;
  }
  .qa ul { margin: 1mm 0 0 4mm; padding: 0; }
  .qa li { margin: 0 0 0.8mm; }

  /* Konuşma */
  .speech {
    margin: 0 0 4mm;
    page-break-inside: avoid;
    border-left: 3px solid #10b981;
    padding-left: 4mm;
  }
  .speech-head { margin-bottom: 1mm; }
  .speech-head .time {
    display: inline-block;
    font-family: ui-monospace, "Cascadia Code", "Consolas", monospace;
    background: #064e3b;
    color: #d1fae5;
    padding: 0.5mm 2mm;
    border-radius: 3px;
    font-size: 9pt;
    margin-right: 2mm;
  }
  .speech-head .step {
    font-weight: 700;
    color: #064e3b;
  }
  .speech p { margin: 0; color: #1f2937; }
</style>
</head>
<body>

<div class="cover">
  <div class="tag">Bitirme Sunumu · Kod anlatımı</div>
  <h1>shackWork</h1>
  <p class="subtitle">Hocaya gösterirken neyi nereden, neden anlatacağın</p>
  <div class="toc">
    <h3>İçindekiler</h3>
    <ol>
      <li>Veritabanı şeması (Prisma)</li>
      <li>Şifre politikası — Güvenlik 1/2</li>
      <li>Kimlik doğrulama — Güvenlik 2/2</li>
      <li>AI plan üreticisi — Projenin kalbi</li>
      <li>Plan API'si — AI + yedek yol</li>
      <li>Teknoloji seçimleri Q&A</li>
      <li>6 dakikalık konuşma metni</li>
    </ol>
  </div>
</div>

<!-- Kod bölümü -->
${slidesHtml.join("\n")}

<!-- Teknoloji Q&A -->
<div class="section-cover">
  <h1>Teknoloji seçimleri</h1>
  <p>Hocalar sorabilir: "Neden bu kütüphane? Neden o veritabanı?" — her teknoloji için kısa ve net cevap.</p>
</div>

<section class="slide">
  ${qaHtml}
</section>

<!-- Konuşma metni -->
<div class="section-cover">
  <h1>6 dakikalık konuşma</h1>
  <p>Süre kutusu + adım başlığı + tam cümle. Sunum sırasında bunu açık tut.</p>
</div>

<section class="slide">
  ${speechHtml}
</section>

</body>
</html>`;

  await fs.writeFile(OUT_HTML, html, "utf8");
  const browser = await chromium.launch();
  let writtenPath = OUT_PDF;
  try {
    const page = await browser.newPage();
    await page.goto(pathToFileURL(OUT_HTML).href, { waitUntil: "load" });
    await page.emulateMedia({ media: "print" });
    try {
      await page.pdf({
        path: OUT_PDF,
        format: "A4",
        printBackground: true,
        margin: { top: "0mm", right: "0mm", bottom: "0mm", left: "0mm" },
      });
    } catch (err) {
      if (err && err.code === "EBUSY") {
        const stamp = new Date()
          .toISOString()
          .replace(/[:.]/g, "-")
          .slice(0, 19);
        writtenPath = path.join(
          path.dirname(OUT_PDF),
          `shackwork-sunum-rehberi-${stamp}.pdf`,
        );
        await page.pdf({
          path: writtenPath,
          format: "A4",
          printBackground: true,
          margin: { top: "0mm", right: "0mm", bottom: "0mm", left: "0mm" },
        });
        console.warn(
          "Hedef PDF açık görünüyor; yeni dosyaya yazdım:",
          writtenPath,
        );
      } else {
        throw err;
      }
    }
  } finally {
    await browser.close();
  }

  console.log("PDF yazıldı:", writtenPath);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
