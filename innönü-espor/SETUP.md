# Kurulum Talimatları

## 1. Bağımlılıkları Yükle

```bash
npm install
```

## 2. Veritabanını Oluştur

### Seçenek 1: SQLite (Local Development)

`.env` dosyası oluşturun ve şu içeriği ekleyin:

```
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="your-secret-key-here-change-in-production"
NEXTAUTH_URL="http://localhost:3000"
```

### Seçenek 2: MongoDB (Production için)

`.env` dosyası oluşturun:

```
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/innonu-espor?retryWrites=true&w=majority"
NEXTAUTH_SECRET="your-secret-key-here-change-in-production"
NEXTAUTH_URL="http://localhost:3000"
```

**Not:** MongoDB kullanıyorsan, `prisma/schema.prisma` dosyasında `provider = "mongodb"` olduğundan emin ol.

Sonra veritabanını oluşturun:

```bash
npm run db:push
```

## 3. İlk Admin Kullanıcısını Oluştur

1. Uygulamayı başlatın: `npm run dev`
2. Tarayıcıda `http://localhost:3000` adresine gidin
3. "Kayıt Ol" butonuna tıklayın ve bir kullanıcı oluşturun
4. Prisma Studio'yu açın: `npm run db:studio`
5. `User` tablosunda oluşturduğunuz kullanıcıyı bulun
6. `role` alanını `ADMIN` olarak değiştirin

## 4. Uygulamayı Başlat

```bash
npm run dev
```

Tarayıcıda `http://localhost:3000` adresine gidin.

## Özellikler

### Kullanıcı Tarafı
- Ana sayfadan kayıt ol / giriş yap
- Etkinliğe katıl
- Admin oyun başlattığında otomatik yönlendirilir
- Oyun oyna ve skorunu gör
- Canlı liderlik tablosunu takip et

### Admin Panel
- Etkinlik oluştur ve yönet
- Oyunları başlat/durdur (tüm kullanıcılar otomatik yönlenir)
- Turnuva eşleştirmeleri yap
- Kullanıcıları yönet (ban, mute, XP, notlar)
- Canlı yayın ekranı (kafe/sınıf için)

## Notlar

- Socket.io sunucusu `server.js` dosyasında çalışır
- Veritabanı SQLite kullanır (production'da PostgreSQL önerilir)
- Tüm oyunlar tarayıcıda çalışır (Canvas API)

