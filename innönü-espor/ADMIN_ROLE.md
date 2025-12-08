# Admin Rolü Verme Rehberi

## Yöntem 1: Prisma Studio (Önerilen)

### Adımlar:

1. **Terminal'de Prisma Studio'yu başlat:**
   ```bash
   npm run db:studio
   ```

2. **Tarayıcıda açılan Prisma Studio'da:**
   - Sol menüden `users` collection'ını seç
   - Admin yapmak istediğin kullanıcıyı bul
   - Kullanıcıya tıkla
   - `role` alanını bul
   - Dropdown'dan `ADMIN` seç
   - "Save" butonuna tıkla

3. **Hazır!** Artık o kullanıcı admin olarak giriş yapabilir.

---

## Yöntem 2: MongoDB Atlas (Web Arayüzü)

### Adımlar:

1. **MongoDB Atlas'a git:**
   - https://cloud.mongodb.com
   - Giriş yap

2. **Database'e bağlan:**
   - Sol menüden "Database" → "Browse Collections"
   - `innonu-espor` database'ini seç
   - `users` collection'ını seç

3. **Kullanıcıyı bul ve düzenle:**
   - Admin yapmak istediğin kullanıcıyı bul
   - Kullanıcıya tıkla (veya "Edit Document" butonuna tıkla)
   - `role` alanını bul
   - Değeri `USER` → `ADMIN` olarak değiştir
   - "Update" butonuna tıkla

4. **Hazır!** Artık o kullanıcı admin olarak giriş yapabilir.

---

## Yöntem 3: MongoDB Compass (Desktop Uygulaması)

### Adımlar:

1. **MongoDB Compass'ı indir ve kur:**
   - https://www.mongodb.com/try/download/compass

2. **Connection string ile bağlan:**
   - Connection string: `.env` dosyasındaki `DATABASE_URL`
   - Connect butonuna tıkla

3. **Kullanıcıyı düzenle:**
   - `innonu-espor` → `users` collection'ını seç
   - Admin yapmak istediğin kullanıcıyı bul
   - Düzenle (Edit Document)
   - `role: "USER"` → `role: "ADMIN"` olarak değiştir
   - Update butonuna tıkla

---

## Yöntem 4: API Endpoint (Gelecekte)

Admin panelinden admin rolü verme özelliği eklenebilir. Şu an için yukarıdaki yöntemlerden birini kullan.

---

## Kontrol Et

Admin rolü verildikten sonra:

1. Kullanıcı çıkış yapsın (eğer giriş yaptıysa)
2. Tekrar giriş yapsın
3. Otomatik olarak `/admin` sayfasına yönlendirilmeli

---

## Notlar

- İlk admin kullanıcısını mutlaka oluştur (kayıt ol → admin yap)
- Admin rolü verilen kullanıcılar tüm admin panel özelliklerine erişebilir
- Güvenlik için admin sayısını sınırlı tut

