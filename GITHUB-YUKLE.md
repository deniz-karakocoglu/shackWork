# GitHub’a yükleme rehberi

Projede **Git yüklü değilse** önce Git kurun (yönetici onayı isteyebilir):

1. https://git-scm.com/download/win → indir, kur
2. Bilgisayarı yeniden başlat (veya Cursor’u kapat-aç)

---

## Yöntem A — GitHub Desktop (en kolay, komut yok)

1. https://desktop.github.com/ indir ve kur
2. GitHub hesabınla giriş yap
3. **File → Add local repository**
4. Klasör: `C:\Users\Casper\Desktop\antrenman-gunlugu`
5. “create a repository” derse **Create repository** de
6. Sol altta commit mesajı: `İlk yükleme: shackWork bitirme projesi`
7. **Commit to main** → **Publish repository**
8. İsim: `shackwork` (veya `antrenman-gunlugu`)
9. **Public** seç (iş başvurusu için görünür olsun)
10. Publish

Bitti. Profilinde `github.com/KULLANICI_ADIN/shackwork` görünür.

---

## Yöntem B — Terminal (Git kuruluysa)

PowerShell:

```powershell
cd C:\Users\Casper\Desktop\antrenman-gunlugu

git init
git add .
git status
```

`git status` çıktısında **`.env` görünmemeli**. Görünürse dur, `.env`’i commitleme.

```powershell
git commit -m "İlk yükleme: shackWork full-stack fitness uygulaması"

# GitHub'da yeni boş repo oluştur (README ekleme), sonra:
git branch -M main
git remote add origin https://github.com/KULLANICI_ADIN/shackwork.git
git push -u origin main
```

İlk `git push` sırasında GitHub kullanıcı adı + şifre veya **Personal Access Token** istenir.

---

## Repoya GİTMEYECEK dosyalar (.gitignore)

- `.env` (API anahtarları)
- `node_modules/`
- `.next/`
- `prisma/dev.db` (yerel veritabanı)
- `public/uploads/shackwork/*` (kullanıcı yüklemeleri)

Bunlar zaten `.gitignore` içinde.

---

## İş başvurusu için

1. Repo **Public** olsun
2. README.md ana sayfada görünür (hazır)
3. CV’ye link: `https://github.com/KULLANICI_ADIN/shackwork`
4. İsteğe bağlı: GitHub → Settings → pin repository

---

## Önemli güvenlik

`.env` dosyasında `GEMINI_API_KEY` var. Bu dosya **asla** GitHub’a gitmemeli. Eğer yanlışlıkla yüklediysen:

1. Google AI Studio’dan anahtarı **iptal et / yenisini al**
2. `.env`’i repodan kaldır (GitHub Desktop veya `git rm --cached .env`)
