# Espor Web Platform

Skor bazlı, tek kişilik oyunlar için turnuva/etkinlik platformu. Kullanıcılar bireysel oynar, skorlar canlı liderlik tablosunda toplanır.

## Özellikler

- ✅ Kullanıcı kayıt/giriş sistemi
- ✅ Etkinlik yönetimi
- ✅ Canlı liderlik tablosu (2-3 saniyede bir güncellenir)
- ✅ Oyun turu yönetimi (bekleme odası, geri sayım, oyun başlatma)
- ✅ Güvenlik ve anti-cheat sistemi
- ✅ Admin paneli (oyun yönetimi, güvenlik uyarıları, liderlik tablosu)
- ✅ Real-time güncellemeler (Socket.io)

## Teknolojiler

### Backend
- Node.js + Express
- Socket.io (WebSocket)
- PostgreSQL
- JWT Authentication
- bcrypt (şifre hashleme)

### Frontend
- React + TypeScript
- Vite
- Socket.io Client
- React Router

## Kurulum

### 1. Database Kurulumu

PostgreSQL veritabanı oluşturun:

```sql
CREATE DATABASE espor_db;
```

Backend klasöründeki `src/config/database.sql` dosyasını çalıştırarak tabloları oluşturun:

```bash
psql -U postgres -d espor_db -f backend/src/config/database.sql
```

### 2. Backend Kurulumu

```bash
cd backend
npm install
```

`.env` dosyası oluşturun:

```env
PORT=3001
NODE_ENV=development
DATABASE_URL=postgresql://username:password@localhost:5432/espor_db
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
FRONTEND_URL=http://localhost:5173
```

Backend'i başlatın:

```bash
npm run dev
```

### 3. Frontend Kurulumu

```bash
cd frontend
npm install
```

Frontend'i başlatın:

```bash
npm run dev
```

## Kullanım

### Admin Girişi

Varsayılan admin kullanıcısı:
- Kullanıcı adı: `admin`
- Şifre: `admin123` (İlk kurulumda değiştirin!)

### Oyuncu Akışı

1. Kayıt ol / Giriş yap
2. Etkinlik listesinden etkinlik seç
3. Etkinlik sayfasında bekle (liderlik tablosu ve katılımcılar görünür)
4. Admin tur başlattığında → Bekleme ekranı
5. Geri sayım → Oyun başlar
6. Oyun oyna (skorlar otomatik gönderilir)
7. Elenme veya bitirme → Etkinlik sayfasına dön
8. Liderlik tablosunu görüntüle

### Admin Akışı

1. Admin paneline giriş yap
2. Etkinlik oluştur
3. Oyun turu oluştur (etkinlik seç → oyun seç → onayla)
4. "Turu Başlat" → Geri sayım başlar
5. Oyunda olanları izle
6. "Turu Bitir" → Skorlar işlenir
7. Güvenlik uyarılarını kontrol et
8. Liderlik tablosunu görüntüle

## Güvenlik Özellikleri

- Developer Tools tespiti
- Zaman manipülasyonu tespiti
- Event-based skorlama (client sadece event gönderir, server skor hesaplar)
- Skor validasyonu
- Rate limiting
- Anomaly detection
- 3+ şüpheli aktivite → Admin'e uyarı

## Oyunlar

### Fly Bird
- Skor: Geçilen engel sayısı
- Kontrol: SPACE tuşu

### Endless Runner (Yakında)
- Skor: Mesafe + combo çarpanı

### Reaction Time (Yakında)
- Skor: Doğru cevap + hız bonusu

## API Endpoints

### Authentication
- `POST /api/auth/register` - Kayıt
- `POST /api/auth/login` - Giriş
- `GET /api/auth/me` - Kullanıcı bilgisi

### Events
- `GET /api/events` - Aktif etkinlikler
- `GET /api/events/:eventId` - Etkinlik detayları
- `POST /api/events/:eventId/join` - Etkinliğe katıl

### Admin
- `GET /api/admin/security/alerts` - Güvenlik uyarıları
- `POST /api/admin/security/alerts/:alertId/dismiss` - Uyarıyı kapat
- `POST /api/admin/security/alerts/:alertId/disqualify` - Diskalifiye et
- `GET /api/admin/leaderboard/:eventId` - Liderlik tablosu

## Socket.io Events

### Client → Server
- `event:join` - Etkinliğe katıl
- `leaderboard:subscribe` - Liderlik tablosuna subscribe ol
- `round:waiting` - Bekleme ekranına katıl
- `score:update` - Skor güncelle
- `player:finished` - Oyun bitti
- `player:eliminated` - Oyuncu elendi

### Server → Client
- `event:details` - Etkinlik detayları
- `leaderboard:update` - Liderlik tablosu güncellendi
- `round:created` - Oyun turu oluşturuldu
- `round:countdown` - Geri sayım
- `round:start` - Oyun başladı
- `round:finished` - Tur bitti

## Lisans

MIT

