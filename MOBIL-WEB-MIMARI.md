# shackWork — Web + Mobil mimari

Web sitesi ve mobil uygulama **ayrı istemciler**, **aynı backend API**.

```
┌─────────────────┐     ┌─────────────────┐
│  Web (Next.js)  │     │ Mobil (Expo RN) │
│  src/app/       │     │ mobile/         │
│  Tarayıcı UI    │     │ iOS / Android   │
└────────┬────────┘     └────────┬────────┘
         │ httpOnly çerez        │ Bearer JWT
         └───────────┬───────────┘
                     ▼
         ┌───────────────────────┐
         │  API                  │
         │  src/app/api/*        │
         │  Prisma + SQLite      │
         └───────────────────────┘
```

## Kural: Web sayfalarına dokunma

| Dokunulmaz (web) | Mobil (ayrı klasör) |
|------------------|---------------------|
| `src/app/page.tsx` ve diğer sayfalar | `mobile/app/*` |
| Web giriş / kayıt formları | `mobile/app/(auth)/*` |
| Tailwind, Recharts, web PDF | React Native UI |
| httpOnly çerez oturumu | SecureStore + Bearer token |

**Web sitesinin davranışı aynı kalır.** Mobil için yapılan backend değişiklikleri yalnızca **ek** özellik:

- `src/lib/auth.ts` — çerez **veya** `Authorization: Bearer` okur (web hâlâ çerez kullanır)
- `login` / `register` — JSON’da ekstra `token` alanı döner (web bunu kullanmaz)
- Şifre sıfırlama e-postası web linkine ek olarak `shackwork://reset?token=` içerir

## Geliştirme

```bash
# Terminal 1 — backend + web sitesi
npm run dev          # http://localhost:3000

# Terminal 2 — mobil (ayrı proje)
cd mobile && npm start
```
