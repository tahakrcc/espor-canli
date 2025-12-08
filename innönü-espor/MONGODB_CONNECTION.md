# MongoDB Connection String Oluşturma

## Database User Bilgileri
- **Username:** `ollamataha_db_user`
- **Password:** `DZ3ipnZaiCyaYVvi`

## Connection String Formatı

```
mongodb+srv://ollamataha_db_user:DZ3ipnZaiCyaYVvi@<CLUSTER-NAME>.mongodb.net/innonu-espor?retryWrites=true&w=majority
```

## Cluster Adını Bulma

1. MongoDB Atlas'a git
2. Sol menüden "Database" → "Deployments" seç
3. Cluster'ının adını gör (genellikle `Cluster0` veya `taha`)

## Connection String'i Alma (Alternatif Yöntem)

1. MongoDB Atlas → "Database" → "Connect" butonuna tıkla
2. "Connect your application" seçeneğini seç
3. Driver: "Node.js", Version: "5.5 or later"
4. Connection string'i kopyala
5. `<password>` yerine `DZ3ipnZaiCyaYVvi` yaz
6. `<database>` yerine `innonu-espor` yaz

## Örnek Connection String

Eğer cluster adın `Cluster0` ise:

```
mongodb+srv://ollamataha_db_user:DZ3ipnZaiCyaYVvi@cluster0.xxxxx.mongodb.net/innonu-espor?retryWrites=true&w=majority
```

## .env Dosyasına Ekleme

`.env` dosyasındaki `DATABASE_URL` satırını yukarıdaki connection string ile değiştir.

## Sonraki Adımlar

1. Connection string'i `.env` dosyasına ekle
2. `NEXTAUTH_SECRET` için güçlü bir key oluştur (32+ karakter)
3. Veritabanını oluştur:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

## Network Access Kontrolü

MongoDB Atlas'ta:
1. "Network Access" → "IP Access List"
2. "Add IP Address" → "Allow Access from Anywhere" (0.0.0.0/0)
3. Veya sadece kendi IP'ni ekle (daha güvenli)

## Güvenlik Notu

⚠️ **ÖNEMLİ:** 
- `.env` dosyasını asla Git'e commit etme (zaten `.gitignore`'da)
- Password'ü kimseyle paylaşma
- Production'da daha güçlü password kullan

