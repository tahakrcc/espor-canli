# Render Deployment Guide - İnönü E-Spor Platform

## Render'da Deploy Adımları

### 1. GitHub Repository Hazırlığı

1. Projeyi GitHub'a push edin
2. Repository'yi public veya private olarak ayarlayın

### 2. Render Dashboard'da Servisler Oluşturma

#### A. PostgreSQL Database

1. Render Dashboard → New → PostgreSQL
2. Name: `espor-db`
3. Plan: Starter (ücretsiz)
4. Database Name: `espor_db`
5. User: `espor_user`
6. **Internal Database URL'yi kopyalayın** (sonra kullanılacak)

#### B. Backend Service

1. Render Dashboard → New → Web Service
2. Connect GitHub repository
3. Ayarlar:
   - **Name**: `espor-backend`
   - **Environment**: `Node`
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Plan**: Starter (ücretsiz)

4. **Environment Variables** ekleyin:
   ```
   NODE_ENV=production
   PORT=10000
   DATABASE_URL=<PostgreSQL Internal Database URL>
   JWT_SECRET=<Güçlü bir random string, en az 32 karakter>
   FRONTEND_URL=<Frontend URL'i, deploy sonrası güncellenecek>
   ```

5. **Advanced Settings**:
   - Health Check Path: `/api/health`

6. Deploy edin

#### C. Frontend Service

1. Render Dashboard → New → Static Site (veya Web Service)
2. Connect GitHub repository
3. Ayarlar:
   - **Name**: `espor-frontend`
   - **Environment**: `Node`
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Publish Directory**: `frontend/dist`
   - **Plan**: Starter (ücretsiz)

4. **Environment Variables**:
   ```
   NODE_ENV=production
   VITE_API_URL=<Backend URL'i>
   ```

5. Deploy edin

### 3. Database Initialization

Backend deploy olduktan sonra:

1. Render Dashboard → Backend Service → Shell
2. Şu komutu çalıştırın:
   ```bash
   cd backend && node src/utils/initDatabase.js
   ```

Veya manuel olarak:
1. Backend Service → Logs
2. Internal Database URL'yi kopyalayın
3. Local'de PostgreSQL client ile bağlanın ve `backend/src/config/database.sql` dosyasını çalıştırın

### 4. Admin Kullanıcı Oluşturma

1. Frontend'e gidin ve kayıt olun
2. Render Dashboard → PostgreSQL → Connect → Query Editor
3. Şu SQL'i çalıştırın:
   ```sql
   UPDATE users SET role = 'admin' WHERE username = 'your_username';
   ```

### 5. Environment Variables Güncelleme

Backend deploy olduktan sonra:

1. Backend Service → Environment
2. `FRONTEND_URL` değişkenini frontend URL'i ile güncelleyin
3. Redeploy edin

Frontend deploy olduktan sonra:

1. Frontend Service → Environment
2. `VITE_API_URL` değişkenini backend URL'i ile güncelleyin
3. Redeploy edin

### 6. Socket.io CORS Ayarları

Backend'de `src/server.js` dosyasında CORS ayarları otomatik olarak `FRONTEND_URL` environment variable'ını kullanıyor.

## Önemli Notlar

1. **JWT_SECRET**: Güçlü bir random string oluşturun:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **Database URL**: Render'da Internal Database URL kullanın (güvenlik için)

3. **Health Check**: Backend'de `/api/health` endpoint'i var

4. **Auto-Deploy**: GitHub'a push yaptığınızda otomatik deploy olur

5. **Logs**: Render Dashboard → Service → Logs'tan logları görebilirsiniz

## Troubleshooting

### Database Connection Error
- Internal Database URL kullandığınızdan emin olun
- Database'in aynı region'da olduğundan emin olun

### CORS Error
- `FRONTEND_URL` environment variable'ının doğru olduğundan emin olun
- Backend'i redeploy edin

### Build Error
- Logs'u kontrol edin
- `package.json` dosyalarının doğru olduğundan emin olun

## Production Checklist

- [ ] Database oluşturuldu
- [ ] Backend deploy edildi
- [ ] Frontend deploy edildi
- [ ] Database initialization yapıldı
- [ ] Admin kullanıcı oluşturuldu
- [ ] Environment variables güncellendi
- [ ] CORS ayarları kontrol edildi
- [ ] Health check çalışıyor
- [ ] Socket.io bağlantısı test edildi

