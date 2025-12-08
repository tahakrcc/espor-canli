# İnönü E-Spor Platformu

Modern turnuva yönetim platformu - Kullanıcılar oynar, Adminler yönetir.

## Özellikler

### Kullanıcı Tarafı
- Kayıt/Giriş
- Etkinliklere katılım
- Otomatik oyun yönlendirme
- Canlı liderlik tablosu
- Sadece oyna - tüm kontrol admin'de

### Admin Panel
- Etkinlik oluşturma ve yönetimi
- Oyun başlatma/durdurma (tüm kullanıcıları yönlendirir)
- Otomatik eşleştirme ve turnuva sistemi
- Canlı liderlik tablosu
- Kullanıcı yönetimi (ban, mute, XP, notlar)
- Canlı yayın ekranı (Broadcast Mode)

## Kurulum

1. Bağımlılıkları yükle:
```bash
npm install
```

2. Veritabanını oluştur:
```bash
npm run db:push
```

3. Geliştirme sunucusunu başlat:
```bash
npm run dev
```

4. Tarayıcıda aç: http://localhost:3000

## İlk Admin Kullanıcısı

İlk admin kullanıcısını oluşturmak için:
- Kayıt sayfasından normal kullanıcı olarak kayıt ol
- Veritabanında `User` tablosunda `role` alanını `ADMIN` olarak güncelle

## Teknolojiler

- Next.js 14
- TypeScript
- Prisma (SQLite)
- Socket.io (Real-time)
- NextAuth.js (Authentication)
- Tailwind CSS
- Radix UI

