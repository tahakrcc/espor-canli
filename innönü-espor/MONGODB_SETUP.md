# MongoDB'ye Geçiş - Hızlı Rehber

## ✅ Yapılan Değişiklikler

Prisma şeması MongoDB için güncellendi:
- ✅ `provider = "mongodb"` olarak değiştirildi
- ✅ Tüm `@id` alanları `@default(auto()) @map("_id") @db.ObjectId` olarak güncellendi
- ✅ Tüm foreign key alanları `@db.ObjectId` olarak işaretlendi
- ✅ `onDelete: Cascade` kaldırıldı (MongoDB desteklemez)
- ✅ Collection isimleri `@@map()` ile belirlendi

## 🔄 MongoDB'ye Geçiş Adımları

### 1. MongoDB Atlas Hesabı Oluştur

1. https://www.mongodb.com/cloud/atlas → "Try Free"
2. Cluster oluştur (Free tier yeterli)
3. Database User oluştur
4. Network Access → IP adresini ekle (0.0.0.0/0 = her yerden)
5. Connection string'i al

### 2. Environment Variables

`.env` dosyasını güncelle:

```env
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/innonu-espor?retryWrites=true&w=majority"
NEXTAUTH_SECRET="your-secret-key-min-32-chars"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Prisma Client'ı Yeniden Oluştur

```bash
npx prisma generate
npx prisma db push
```

### 4. Test Et

```bash
npm run dev
```

## ⚠️ Önemli Notlar

### MongoDB Farkları:

1. **Cascade Delete Yok**: 
   - MongoDB'de `onDelete: Cascade` yok
   - Silme işlemlerini manuel yapman gerekebilir
   - Veya Prisma middleware ile handle edebilirsin

2. **ObjectId Kullanımı**:
   - Tüm ID'ler artık MongoDB ObjectId
   - String olarak saklanır ama ObjectId formatında

3. **Foreign Keys**:
   - MongoDB'de foreign key constraint yok
   - Prisma referential integrity sağlar ama database seviyesinde yok

4. **Indexes**:
   - `@@index` ve `@@unique` çalışır
   - MongoDB'de otomatik oluşturulur

## 🔄 SQLite'dan MongoDB'ye Veri Taşıma

Eğer mevcut SQLite veritabanından veri taşımak istersen:

1. SQLite verilerini export et
2. MongoDB'ye import et
3. ID formatlarını dönüştür (cuid → ObjectId)

Veya sıfırdan başla (önerilen - test için).

## 🚀 Production Deployment

Detaylı deployment rehberi için `DEPLOYMENT.md` dosyasına bak.

## 💡 İpuçları

- MongoDB Atlas Free tier: 512MB storage, yeterli başlangıç için
- Connection string'deki `<username>` ve `<password>` yerine gerçek değerleri yaz
- `NEXTAUTH_SECRET` için güçlü bir key kullan (32+ karakter)
- Production'da Network Access'i sadece kendi sunucu IP'lerine aç

## 🆚 MongoDB vs PostgreSQL

**MongoDB:**
- ✅ NoSQL, esnek şema
- ✅ Kolay ölçeklenebilir
- ✅ JSON benzeri yapı
- ❌ Foreign key constraints yok
- ❌ Transaction desteği sınırlı

**PostgreSQL:**
- ✅ Güçlü SQL desteği
- ✅ Foreign key constraints
- ✅ Transaction desteği
- ✅ Prisma ile daha iyi entegrasyon
- ❌ Şema değişiklikleri daha zor

Her ikisi de çalışır, MongoDB seçimi mantıklı! 🎯

