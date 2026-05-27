import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/** Koç listesi. Yeni koç: obje ekle + foto `public/coaches/` + `npm run db:seed`. */
const COACHES = [
  {
    name: "Deniz Karakoçoğlu",
    title: "20 yaş · basketbol geçmişi · fitness & toparlanma",
    bio: "Merhaba, ben Deniz Karakoçoğlu. 20 yaşındayım; sporla ilgilenmeye yaklaşık 5 yıldır devam ediyorum. İlk serüvenim basketboldu — sahada tempo, koordinasyon ve takım oyununu orada öğrendim. Tekrarlayan sakatlıklar nedeniyle basketi bırakmak zorunda kaldım; süreci kabullenip kuvvet, mobilite ve sürdürülebilir antrenmana yöneldim. Bugün fitness tarafında form tekniği, toparlanma ve hedefe göre program yazımına odaklanıyorum. shackWork’ta hedefini netleştirip güvenli şekilde ilerlemene yardımcı olmak için buradayım.",
    specialties: "fitness,basketbol_gecmisi,toparlanma,kuvvet,mobilite,genel_saglik",
    avatarEmoji: "🏀",
    photoUrl: "/coaches/deniz-karakocoglu.png",
  },
  {
    name: "Ali Aktaş",
    title: "Fizyoterapi öğrencisi · antrenman",
    bio: "Merhaba, ben Ali Aktaş. 28 Haziran 2005 doğumluyum. İstanbul Atlas Üniversitesi Fizyoterapi ve Rehabilitasyon bölümü 3. sınıf öğrencisiyim. Bunun yanında yaklaşık 1,5 yıldır aktif olarak spor yapmaktayım. Bu süreçte edindiğim bilgi ve deneyimleri fizyoterapi ile birleştirerek sizlerle paylaşmaktan mutluluk duyarım.",
    specialties: "fizyoterapi,rehabilitasyon,spor,genel_saglik,ogrenci",
    avatarEmoji: "🏋️",
    photoUrl: "/coaches/ali.png",
  },
  {
    name: "Alper Usta",
    title: "İngilizce İktisat öğrencisi · antrenman",
    bio: "Merhaba, ben Alper Usta. 21 Nisan 2005 doğumluyum. Marmara Üniversitesi İngilizce İktisat bölümü 3. sınıf öğrencisiyim. Bunun yanında yaklaşık 1,5 yıldır aktif olarak spor yapmaktayım. Bu süreçte edindiğim bilgi ve deneyimleri sizlerle paylaşmaktan mutluluk duyarım.",
    specialties: "iktisat,ingilizce,spor,genel_saglik,ogrenci",
    avatarEmoji: "📊",
    photoUrl: "/coaches/alper.png",
  },
  {
    name: "Deniz Kaya",
    title: "Beslenme koçu · kilo yönetimi",
    bio: "Merhaba, ben Deniz Kaya. 8 yıldır spor beslenmesi ve kilo yönetimi alanında danışmanlık veriyorum. Makro dengesi, öğün planlama ve sürdürülebilir alışkanlıklar üzerine çalışırım; aşırı kısıtlayıcı diyetler yerine gerçek hayata uyan programlar yazarım. Hedefin yağ kaybı veya performans olsun, antrenman günlerine göre enerji ve protein dağılımını birlikte netleştiririz.",
    specialties: "beslenme,kilo_yonetimi,makro,performans,aliskanlik",
    avatarEmoji: "🥗",
    photoUrl: "/coaches/av-1.svg",
  },
  {
    name: "Merve Arslan",
    title: "Mobilite & yoga eğitmeni",
    bio: "Merhaba, ben Merve Arslan. Yoga Alliance 200 saat sertifikalıyım; ofis çalışanları ve sporcular için mobilite, nefes ve esneklik seansları veriyorum. Omuz, kalça ve bel bölgesinde kısıtlılık yaşayanlara günlük 15–20 dakikalık rutinler hazırlıyorum. Amacım ağrısız hareket aralığını artırıp antrenman kaliteni yükseltmek.",
    specialties: "yoga,mobilite,esneklik,nefes,ofis_sporcu",
    avatarEmoji: "🧘",
    photoUrl: "/coaches/av-2.svg",
  },
  {
    name: "Selin İpek",
    title: "Pilates & core uzmanı",
    bio: "Merhaba, ben Selin İpek. Klasik ve reformer pilates eğitmeniyim; core stabilite, postür ve derin kas aktivasyonu benim odağım. Hamilelik sonrası veya masa başı çalışan danışanlarda sık görülen bel-boyun yükünü azaltmaya yönelik kademeli programlar uygularım. Her seviyeye uygun, kontrollü ve güvenli ilerleriz.",
    specialties: "pilates,core,postur,reformer,genel_saglik",
    avatarEmoji: "💪",
    photoUrl: "/coaches/av-3.svg",
  },
  {
    name: "Burak Özkan",
    title: "Kuvvet & hipertrofi koçu",
    bio: "Merhaba, ben Burak Özkan. 6 yıldır salon ortamında kuvvet ve hipertrofi antrenmanı koçluğu yapıyorum. Squat, deadlift ve press varyasyonlarında teknik düzeltme; haftalık hacim ve RPE ile progresyon planları hazırlarım. Yeni başlayanlardan ileri seviyeye kadar hedefe göre split ve toparlanma düzenini birlikte kurarız.",
    specialties: "kuvvet,hipertrofi,salon,teknik,progresyon",
    avatarEmoji: "🏋️",
    photoUrl: "/coaches/av-4.svg",
  },
  {
    name: "Emre Yıldız",
    title: "Kondisyon & HIIT",
    bio: "Merhaba, ben Emre Yıldız. Eskiden amatör futbol oynadım; bugün kondisyon, interval ve dayanıklılık antrenmanlarına odaklanıyorum. Kısa sürede nabız kontrolü, yağ yakımı ve maç/etkinlik hazırlığı için bisiklet, kürek, koşu ve vücut ağırlığı devreleri tasarlarım. Sakatlık geçmişin varsa tempo ve hacmi buna göre ayarlarız.",
    specialties: "kondisyon,hiit,dayaniklilik,interval,futbol",
    avatarEmoji: "⚡",
    photoUrl: "/coaches/av-5.svg",
  },
] as const;

async function main() {
  await prisma.user.updateMany({ data: { coachId: null } });
  await prisma.coach.deleteMany({});

  for (const row of COACHES) {
    await prisma.coach.create({ data: { ...row } });
  }

  console.log(`Seed: ${COACHES.length} koç eklendi.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
