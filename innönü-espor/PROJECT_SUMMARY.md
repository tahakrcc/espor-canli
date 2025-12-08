# İnönü E-Spor Platformu - Proje Özeti

## 🎯 Proje Genel Bakış

Modern bir turnuva yönetim platformu. Kullanıcılar sadece oynar, adminler her şeyi yönetir.

## ✅ Tamamlanan Özellikler

### 👤 Kullanıcı Tarafı
- ✅ Kayıt ol / Giriş yap sistemi
- ✅ Etkinliklere katılma
- ✅ Otomatik oyun yönlendirme (admin oyun başlattığında)
- ✅ 4 oyun: Pong, Slime Volleyball, Snake, Tetris
- ✅ Canlı liderlik tablosu
- ✅ Real-time skor güncellemeleri

### 🛠️ Admin Panel
- ✅ Etkinlik oluşturma ve yönetimi
  - Etkinlik adı, açıklama, tarih aralığı
  - Turnuva modu açma/kapama
  - Canlı mod açma/kapama
- ✅ Oyun kontrolü
  - Oyun başlatma (tüm kullanıcılar otomatik yönlenir)
  - Oyun durdurma
  - 4 oyun tipi: PONG, SLIME_VOLLEYBALL, SNAKE, TETRIS
- ✅ Turnuva eşleştirmeleri
  - Otomatik 1v1 eşleştirme
  - Turnuva bracket görünümü
- ✅ Kullanıcı yönetimi
  - Ban/Mute işlemleri
  - XP verme
  - Profil notu ekleme
- ✅ Canlı yayın ekranı (Broadcast Mode)
  - Kafe/sınıf için tasarlandı
  - Sadece gösterim modu
  - Canlı liderlik tablosu

### 🔧 Teknik Özellikler
- ✅ Next.js 14 (App Router)
- ✅ TypeScript
- ✅ Prisma ORM (SQLite)
- ✅ NextAuth.js (Kimlik doğrulama)
- ✅ Socket.io (Real-time iletişim)
- ✅ Tailwind CSS (Stil)
- ✅ Canvas API (Oyunlar)

## 📁 Proje Yapısı

```
innonu-espor/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── admin/         # Admin API'leri
│   │   ├── auth/          # Kimlik doğrulama
│   │   └── events/        # Etkinlik API'leri
│   ├── admin/             # Admin panel sayfası
│   ├── auth/              # Giriş/kayıt sayfaları
│   ├── dashboard/         # Kullanıcı dashboard'u
│   └── page.tsx           # Ana sayfa
├── components/
│   ├── admin/             # Admin bileşenleri
│   ├── dashboard/         # Kullanıcı dashboard bileşenleri
│   └── games/             # Oyun bileşenleri
├── lib/                   # Yardımcı fonksiyonlar
├── prisma/                # Veritabanı şeması
└── server.js              # Socket.io sunucusu
```

## 🚀 Kullanım Senaryosu

### 1. Admin Etkinlik Oluşturur
- Admin panel → Etkinlikler → Yeni Etkinlik
- Etkinlik bilgilerini doldur
- "Canlı Mod" ve "Turnuva Modu" seçeneklerini ayarla

### 2. Kullanıcılar Katılır
- Kullanıcılar dashboard'a girer
- "Etkinliğe Katıl" butonuna basar
- Bekleme ekranında bekler

### 3. Admin Oyun Başlatır
- Admin panel → Oyun Kontrolü
- Etkinlik seçer
- Oyun seçer (örn: Pong)
- "Oyunu Başlat" butonuna basar
- **Tüm kullanıcılar otomatik olarak Pong ekranına yönlenir**

### 4. Kullanıcılar Oynar
- Kullanıcılar oyunu oynar
- Skorlar otomatik kaydedilir
- Liderlik tablosu canlı güncellenir

### 5. Admin Yeni Oyun Başlatır
- Admin başka bir oyun seçer (örn: Snake)
- "Oyunu Başlat" butonuna basar
- **Tüm kullanıcılar otomatik olarak Snake ekranına geçer**

### 6. Turnuva Eşleştirmeleri
- Admin → Turnuva
- "Otomatik Eşleştirme Yap" butonuna basar
- Sistem katılımcıları eşleştirir

### 7. Canlı Yayın
- Admin → Yayın Ekranı
- Etkinlik seçer
- Ekranı kafe/sınıf ekranına yansıtır
- Liderlik tablosu canlı görünür

## 🔐 Güvenlik

- Şifreler bcrypt ile hash'lenir
- NextAuth.js ile güvenli oturum yönetimi
- Admin işlemleri role-based kontrol edilir
- API route'ları authentication kontrolü yapar

## 📝 Notlar

- İlk admin kullanıcısı manuel olarak veritabanında oluşturulmalı
- Socket.io sunucusu `server.js` ile birlikte çalışır
- Production'da PostgreSQL kullanılması önerilir
- `.env` dosyasında `NEXTAUTH_SECRET` mutlaka değiştirilmeli

## 🎮 Oyunlar

1. **Pong**: W/S tuşları ile paddle kontrolü
2. **Slime Volleyball**: A/D tuşları ile hareket
3. **Snake**: Ok tuşları ile yön kontrolü
4. **Tetris**: Ok tuşları + Space (döndürme)

## 🔄 Real-time Özellikler

- Oyun değişiklikleri anında yansır
- Liderlik tablosu otomatik güncellenir
- Etkinlik durumu değişiklikleri canlı
- Skor güncellemeleri anlık

## 📊 Veritabanı Şeması

- **User**: Kullanıcılar (role, xp, ban, mute)
- **Event**: Etkinlikler (status, isLive, tournamentMode)
- **Game**: Oyunlar (gameType, isActive)
- **Match**: Maçlar (player1, player2, winner)
- **Score**: Skorlar (score, wins, losses)
- **EventParticipant**: Etkinlik katılımcıları

## 🚧 Gelecek Geliştirmeler (Opsiyonel)

- [ ] Daha gelişmiş turnuva bracket görünümü
- [ ] Oyun içi chat
- [ ] İstatistikler ve analitik
- [ ] Mobil uygulama
- [ ] Daha fazla oyun
- [ ] Video yayın entegrasyonu

