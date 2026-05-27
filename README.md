# shackWork

Kişisel antrenman, beslenme ve gelişim takibi için **full-stack web uygulaması**. Haftalık antrenman + beslenme planı **Google Gemini** ile kullanıcı hedeflerine göre üretilir; her kullanıcıya farklı plan (paylaşılan şablon yok).

## Öne çıkanlar

- **AI haftalık plan** — hedef metni, kilo, odak alanına göre Gemini; doğrulama + düzeltme turu, model fallback
- **Güvenlik** — bcrypt şifre hash, JWT oturum, httpOnly çerez, güçlü şifre kuralları (istemci + sunucu)
- **Koç eşleştirme** — hedef etiketlerine göre 8 koç profili
- **Günlük kayıt** — antrenman, öğün, not; isteğe bağlı AI gün sonu raporu
- **Kilo grafiği** — Recharts
- **PDF export** — haftalık plan `pdf-lib` ile sunucuda üretilir

## Teknoloji yığını

| Katman | Teknoloji |
|--------|-----------|
| Framework | Next.js 16 (App Router) |
| Dil | TypeScript |
| UI | React 19, Tailwind CSS 4 |
| Veritabanı | SQLite + Prisma ORM |
| Kimlik | bcryptjs, jose (JWT) |
| AI | Google Gemini API |
| Grafik | Recharts |
| PDF | pdf-lib |

## Proje yapısı

```
src/app/          → sayfalar + API route'lar
src/lib/          → auth, AI plan, PDF, şifre politikası
prisma/           → schema, migration, seed
public/           → statik dosyalar, koç fotoğrafları
```

## Kurulum

```bash
git clone https://github.com/KULLANICI_ADIN/shackwork.git
cd shackwork
npm install
cp .env.example .env
# .env içine GEMINI_API_KEY ve JWT_SECRET ekleyin
npx prisma db push
npm run db:seed
npm run dev
```

Tarayıcı: [http://localhost:3000](http://localhost:3000)

## Ortam değişkenleri

`.env.example` dosyasına bakın. **`.env` dosyasını asla repoya eklemeyin** (API anahtarları gizli kalmalı).

| Değişken | Açıklama |
|----------|----------|
| `DATABASE_URL` | `file:./prisma/dev.db` |
| `JWT_SECRET` | Oturum imzası (uzun rastgele dize) |
| `GEMINI_API_KEY` | Haftalık plan + günlük AI raporu |

## Veritabanı (9 tablo)

`User`, `Coach`, `Goal`, `BodyMetric`, `DayLog`, `WeeklyPlan`, `ProgressPhoto`, `CoachNote`, `PasswordResetToken`

Şema: `prisma/schema.prisma`

## API örnekleri

- `POST /api/auth/register` · `POST /api/auth/login`
- `GET/POST /api/plans/weekly` — plan getir / AI ile üret
- `GET /api/plans/weekly/pdf` — haftalık plan PDF indir
- `GET/POST /api/goals` · `GET/POST /api/metrics` · `GET/POST /api/day-logs`

## Geliştirme notları

- Üretim için SQLite → PostgreSQL: `schema.prisma` içinde `provider = "postgresql"` + `DATABASE_URL` değiştirmek yeterli.
- Windows’ta Prisma `EPERM` alırsanız: `npm run dev` kapatın, `npx prisma generate` tekrar deneyin.

## Lisans

Bu proje eğitim / portföy amaçlıdır. İş başvurularında referans olarak gösterilebilir.

---

**shackWork** — antrenman günlüğü · Next.js · TypeScript · Prisma · Gemini AI
