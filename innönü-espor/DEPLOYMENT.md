# Deployment Rehberi - MongoDB ile

## 🚀 MongoDB Atlas Kurulumu (Ücretsiz)

### 1. MongoDB Atlas Hesabı Oluştur

1. https://www.mongodb.com/cloud/atlas adresine git
2. "Try Free" butonuna tıkla
3. Hesap oluştur

### 2. Cluster Oluştur

1. "Build a Database" → "Free" seçeneğini seç
2. Cloud Provider: AWS (veya istediğin)
3. Region: En yakın bölgeyi seç (örn: Europe - Frankfurt)
4. Cluster adı: `innonu-espor` (veya istediğin)
5. "Create" butonuna tıkla

### 3. Database User Oluştur

1. "Database Access" → "Add New Database User"
2. Authentication Method: Password
3. Username ve Password belirle (SAKLA!)
4. Database User Privileges: "Atlas admin" veya "Read and write to any database"
5. "Add User" butonuna tıkla

### 4. Network Access Ayarla

1. "Network Access" → "Add IP Address"
2. "Allow Access from Anywhere" seç (0.0.0.0/0)
   - Veya sadece kendi IP'ni ekle (daha güvenli)
3. "Confirm" butonuna tıkla

### 5. Connection String Al

1. "Database" → "Connect" butonuna tıkla
2. "Connect your application" seçeneğini seç
3. Driver: Node.js, Version: 5.5 veya üzeri
4. Connection string'i kopyala:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

## 📝 Environment Variables

`.env` dosyasını güncelle:

```env
# MongoDB Atlas Connection String
DATABASE_URL="mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/innonu-espor?retryWrites=true&w=majority"

# NextAuth
NEXTAUTH_SECRET="your-super-secret-key-here-min-32-chars"
NEXTAUTH_URL="https://your-domain.com"

# Socket.io (production için)
NEXT_PUBLIC_SOCKET_URL="https://your-domain.com"
```

**ÖNEMLİ:** 
- `<username>` ve `<password>` yerine gerçek değerleri yaz
- `NEXTAUTH_SECRET` için güçlü bir key oluştur (32+ karakter)
- Production'da `NEXTAUTH_URL` ve `NEXT_PUBLIC_SOCKET_URL` gerçek domain olmalı

## 🔄 Veritabanını Güncelle

```bash
# Prisma client'ı yeniden oluştur
npx prisma generate

# MongoDB'ye şemayı push et
npx prisma db push
```

## 🌐 Deployment Platformları

### Vercel (Önerilen - Next.js için en iyi)

1. GitHub'a push et:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-repo-url>
git push -u origin main
```

2. Vercel'e git: https://vercel.com
3. "Import Project" → GitHub repo'nu seç
4. Environment Variables ekle:
   - `DATABASE_URL`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` (vercel otomatik ekler)
   - `NEXT_PUBLIC_SOCKET_URL` (vercel URL'i)
5. Deploy!

**Not:** Vercel serverless functions kullanır, `server.js` için ayrı bir sunucu gerekebilir (Socket.io için).

### Railway / Render (Socket.io için daha iyi)

Bu platformlar tam Node.js sunucusu çalıştırır, `server.js` ile uyumludur.

#### Railway:

1. https://railway.app → "New Project" → "Deploy from GitHub"
2. Repo'yu seç
3. Environment Variables ekle
4. Deploy!

#### Render:

1. https://render.com → "New Web Service"
2. GitHub repo'yu bağla
3. Build Command: `npm install && npm run build`
4. Start Command: `npm start`
5. Environment Variables ekle
6. Deploy!

## 🔧 Socket.io için Özel Ayarlar

Socket.io production'da ekstra ayar gerektirebilir. `server.js` dosyasını güncelle:

```javascript
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXTAUTH_URL || "*",
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling']
})
```

## ✅ Deployment Sonrası Kontrol

1. ✅ Veritabanı bağlantısı çalışıyor mu?
2. ✅ Authentication çalışıyor mu?
3. ✅ Socket.io bağlantısı kuruluyor mu?
4. ✅ Admin panel erişilebilir mi?
5. ✅ Oyunlar çalışıyor mu?

## 🐛 Sorun Giderme

### MongoDB bağlantı hatası:
- Network Access'te IP adresin ekli mi?
- Connection string doğru mu?
- Username/password doğru mu?

### Socket.io bağlanmıyor:
- `NEXT_PUBLIC_SOCKET_URL` doğru mu?
- CORS ayarları doğru mu?
- WebSocket desteği var mı? (Vercel'de sınırlı)

### NextAuth hatası:
- `NEXTAUTH_SECRET` en az 32 karakter mi?
- `NEXTAUTH_URL` doğru domain mi?

## 📊 Alternatif: PostgreSQL (MongoDB yerine)

Eğer MongoDB yerine PostgreSQL kullanmak istersen:

1. Prisma şemasında `provider = "postgresql"` yap
2. PostgreSQL database oluştur (Railway, Supabase, Neon gibi)
3. Connection string'i al
4. `DATABASE_URL` olarak ekle

PostgreSQL avantajları:
- Prisma ile daha iyi entegrasyon
- Foreign key constraints
- Daha güçlü transaction desteği

MongoDB avantajları:
- Daha esnek şema
- Kolay ölçeklenebilir
- NoSQL yapısı

Her ikisi de çalışır! 🚀

