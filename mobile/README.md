# shackWork Mobile

React Native (Expo) mobil istemci — mevcut Next.js API'sine bağlanır.

## Mimari

```
mobile/          ← Expo uygulaması (iOS + Android)
../src/app/api/  ← Backend (çerez veya Bearer JWT)
```

- **Auth:** JWT `Authorization: Bearer` + SecureStore (web'de localStorage)
- **Navigasyon:** Expo Router (tabs)
- **Ekranlar:** Ana Sayfa, Plan (AI), Günlük, Profil, şifre unuttum / sıfırla

## Kurulum

```bash
cd mobile
npm install
cp .env.example .env
# .env içinde EXPO_PUBLIC_API_URL = bilgisayarının IP:3000
```

Backend ayrı terminalde çalışmalı:

```bash
cd ..
npm run dev
```

Mobil uygulama:

```bash
cd mobile
npm start
```

Expo Go ile QR kodu tara (Android/iOS) veya `w` (Expo web).

## API URL ipuçları

| Ortam | URL |
|-------|-----|
| iOS simülatör / Expo web | `http://localhost:3000` |
| Android emülatör | `http://10.0.2.2:3000` |
| Fiziksel telefon | `http://192.168.x.x:3000` (aynı Wi‑Fi) |

Windows'ta IP: `ipconfig` → IPv4 Address.

## Özellikler

- [x] Giriş / kayıt (güçlü şifre ipuçları)
- [x] Şifre unuttum / sıfırla (`shackwork://reset?token=`)
- [x] Ana panel (kilo, VKİ, grafik, hedefler, koç)
- [x] Hedef ekleme + AI haftalık plan
- [x] Günlük antrenman/beslenme kaydı (gün gezintisi + AI rapor)
- [x] Profil düzenleme (ad, boy, odak) + kilo / yağ ölçümü
- [ ] PDF indirme
- [ ] Fotoğraf yükleme
- [ ] Push bildirimleri

## Store yayını (ileride)

```bash
npx eas build --platform android
npx eas build --platform ios
```

EAS hesabı ve `eas.json` gerekir.
