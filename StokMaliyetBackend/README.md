# Stok Takip Sistemi Backend

Bu proje, yemekhane ve depo yönetimi için geliştirilmiş bir Spring Boot backend uygulamasıdır.

## 🚀 Özellikler

- **Stok Yönetimi**: FIFO (First In First Out) prensibi ile stok giriş/çıkış takibi
- **Bütçe Yönetimi**: Bütçe bazlı harcama takibi
- **Rol Tabanlı Yetkilendirme**: ADMIN, SATINALMA, YEMEKHANE, DEPO rolleri
- **JWT Authentication**: Güvenli token tabanlı kimlik doğrulama
- **Raporlama**: Detaylı rapor ve istatistik sistemi
- **Tender Yönetimi**: İhale ve doğrudan alım süreçleri

## 🛠️ Teknolojiler

- **Java 21**
- **Spring Boot 3.4.3**
- **Spring Security**
- **Spring Data JPA**
- **PostgreSQL**
- **JWT**
- **Lombok**
- **Swagger/OpenAPI**

## 📋 Gereksinimler

- Java 21+
- Maven 3.6+
- PostgreSQL 12+

## 🔧 Kurulum

### 1. Repository'yi Klonlayın
```bash
git clone <repository-url>
cd StokVeMaliyetBackEnd-main
```

### 2. Environment Variables Ayarlayın
`env.example` dosyasını kopyalayıp `.env` olarak yeniden adlandırın ve değerleri güncelleyin:

```bash
cp env.example .env
```

Gerekli environment variables:
- `DB_USERNAME`: Veritabanı kullanıcı adı
- `DB_PASSWORD`: Veritabanı şifresi
- `JWT_SECRET`: JWT imzalama anahtarı (en az 32 karakter)
- `JWT_EXPIRATION`: Token geçerlilik süresi (milisaniye)
- `CORS_ALLOWED_ORIGINS`: İzin verilen CORS origin'leri

### 3. Veritabanını Hazırlayın
PostgreSQL'de yeni bir veritabanı oluşturun:
```sql
CREATE DATABASE "stok-takip";
```

### 4. Uygulamayı Çalıştırın
```bash
mvn spring-boot:run
```

Uygulama varsayılan olarak `http://localhost:8080` adresinde çalışacaktır.

## 🔐 Güvenlik

### Roller ve Yetkiler

| Rol | Yetkiler |
|-----|----------|
| **ADMIN** | Tüm işlemler |
| **SATINALMA** | Satın alma, bütçe, rapor, ürün yönetimi |
| **YEMEKHANE** | Stok çıkışı, talep oluşturma, bilet satışı |
| **DEPO** | Stok giriş/çıkış, ürün görüntüleme, talep onaylama |

### API Endpoints

#### Auth Endpoints
- `POST /api/auth/register` - Kullanıcı kaydı
- `POST /api/auth/login` - Kullanıcı girişi

#### Stok Yönetimi
- `GET /v1/materialEntry/all` - Tüm stok girişleri
- `POST /v1/materialEntry/create` - Stok girişi
- `GET /v1/materialExit/all` - Tüm stok çıkışları
- `POST /v1/materialExit/exit` - Stok çıkışı

#### Ürün Yönetimi
- `GET /v1/product/all` - Tüm ürünler
- `POST /v1/product/create` - Yeni ürün
- `PUT /v1/product/update` - Ürün güncelleme
- `DELETE /v1/product/delete/{id}` - Ürün silme

## 📊 API Dokümantasyonu

Swagger UI: `http://localhost:8080/swagger-ui.html`

## 🔄 Veritabanı Şeması

Ana tablolar:
- `users` - Kullanıcı bilgileri
- `products` - Ürün bilgileri
- `material_entries` - Stok girişleri
- `material_exits` - Stok çıkışları
- `budgets` - Bütçe bilgileri
- `categories` - Ürün kategorileri
- `measurement_types` - Ölçü birimleri

## 🚨 Güvenlik Önlemleri

1. **JWT Secret**: Production'da güçlü bir secret key kullanın
2. **Database Password**: Environment variable olarak saklayın
3. **CORS**: Sadece gerekli origin'lere izin verin
4. **Role-based Access**: Tüm endpoint'ler role kontrolü ile korunmuştur

## 🐛 Bilinen Sorunlar

- Package isimlendirmeleri düzeltilmiştir (entitiy → entity, Repositoriy → repository)
- FIFO stok yönetimi implement edilmiştir
- VAT hesaplama mantığı düzeltilmiştir
- Security açıkları kapatılmıştır

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'Add amazing feature'`)
4. Push yapın (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📝 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 📞 İletişim

Proje Sahibi - [@your-username](https://github.com/ibrahimhalilakgl)

Proje Linki: [https://github.com/your-username/StokVeMaliyetBackEnd](https://github.com/your-username/StokVeMaliyetBackEnd) 
