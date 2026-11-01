# DijiAlbum - Proje Teknik Analiz ve Mimari Raporu

**Rapor Tarihi:** 31 Ekim 2026  
**İnceleme Türü:** Kaynak Kod, Bağımlılık ve Mimari Analizi  
**Proje Niteliği:** Düğün ve Özel Etkinlikler İçin Dokunsal / Nostaljik Dijital Kullan-At Kamera ve Canlı Albüm SaaS Platformu  

---

## 1. Kullanılan Bütün Teknolojiler

Bu bölümde, projenin `package.json`, konfigürasyon dosyaları (`next.config.mjs`, `postcss.config.mjs`, `eslint.config.mjs`, `schema.sql`) ve `src/` altındaki kaynak kodları taranarak aktif olarak kullanılan tüm teknolojiler sınıflandırılmıştır.

### 1.1. Programlama Dilleri
- **JavaScript (ECMAScript 2024+ / Modern ES Modules / JSX):**
  - *Ne amaçla kullanıldı:* Bütün uygulama mantığı, React bileşenleri, API çağrıları, donanım kontrol algoritmaları ve ses sentezleme için temel programlama dili.
  - *Nerede kullanıldı:* `src/` altındaki bütün `.js` dosyalarında (`src/app/**`, `src/lib/**`).
  - *Sağladığı özellik:* Modern tarayıcı API'leri, asenkron akışlar (`async/await`), fonksiyonel bileşenler ve reaktif durum yönetimi.
- **SQL (PostgreSQL DDL & Dialect):**
  - *Ne amaçla kullanıldı:* Veritabanı şemasının, tabloların, yabancı anahtarların (foreign keys), RLS politikalarının ve storage bucket yapılandırmasının tanımlanması.
  - *Nerede kullanıldı:* `schema.sql`.
  - *Sağladığı özellik:* İlişkisel veri modeli (`events`, `guests`, `photos`), UUID birincil anahtarlar, cascade silme ve veri bütünlüğü kuralları.
- **HTML5 Web API'leri (Canvas, Audio, MediaDevices, Orientation, Haptics):**
  - *Ne amaçla kullanıldı:* Donanıma doğrudan erişim, görüntü işleme ve çoklu ortam (multimedia) yetenekleri.
  - *Nerede kullanıldı:* `src/app/camera/CameraView.js`, `src/app/album/[id]/page.js`.
  - *Sağladığı özellik:* Tarayıcı üzerinden mobil kamera donanımına, jiroskopa, ses sentezleyiciye ve grafik belleğine native erişim.
- **CSS3 & Modern CSS Standartları:**
  - *Ne amaçla kullanıldı:* Arayüz stillendirmesi, 35mm film gren efekti (grain animation), neon parlamalar, özel yazı tipleri ve GPU hızlandırmalı geçişler.
  - *Nerede kullanıldı:* `src/app/globals.css`, `src/app/layout.js`.
  - *Sağladığı özellik:* `transform3d`, `will-change`, CSS custom properties (değişkenler), CSS Columns düzeni ve `content-visibility: auto`.

---

### 1.2. Frameworkler ve Kütüphaneler

| Teknoloji / Kütüphane | Sürüm | Kullanım Amacı | Projedeki Konumu | Sağladığı Özellik |
| :--- | :--- | :--- | :--- | :--- |
| **Next.js** | `16.2.9` | Tam yığın (Full-stack) web uygulama omurgası ve App Router mimarisi | `src/app/**`, `next.config.mjs`, `package.json` | Sayfa yönlendirme (routing), asenkron parametre çözümleme (`use(params)`), SSR izolasyonu, dinamik yükleme (`next/dynamic`), Google Fonts optimizasyonu (`next/font/google`) ve görsel optimizasyonu (`next/image`). |
| **React** | `19.2.4` | Kullanıcı arayüzü kütüphanesi | Bütün `src/app/**` bileşenleri | Reaktif bileşen hiyerarşisi, React 19 `use()` kancası, `useState`, `useEffect`, `useRef`, `useCallback`, `useMemo` ve `memo`. |
| **React DOM** | `19.2.4` | React sanal DOM'unun tarayıcı DOM'una bağlanması | `package.json`, Next.js runtime | DOM render motoru. |
| **@supabase/supabase-js** | `^2.108.2` | Supabase Backend-as-a-Service (BaaS) istemci SDK'sı | `src/lib/supabase.js`, `src/app/**` | PostgreSQL veritabanı sorguları (CRUD), S3 uyumlu nesne depolama (Storage upload/getPublicUrl) ve WebSocket tabanlı Realtime veritabanı dinleyicisi. |
| **Framer Motion** | `^12.42.0` | Deklaratif animasyon ve fizik tabanlı hareket kütüphanesi | `CameraView.js`, `album/[id]/page.js`, `reveal/[event_id]/page.js`, `join/[event_id]/page.js` | Sayfa geçişleri, toast bildirimleri, çekmece (bottom sheet) animasyonları, yay fiziği (spring animations), tap mikromolekülleri (`whileTap`), `AnimatePresence` ve Polaroid kartlarının `layoutId` ile paylaşımlı öğe geçişleri. |
| **JSZip** | `^3.10.1` | İstemci tarafı (client-side) ZIP arşivleme kütüphanesi | `src/app/album/[id]/page.js` | Albümdeki tüm fotoğrafları sunucu yükü olmadan doğrudan tarayıcı belleğinde eşzamanlı olarak indirip tek bir `.zip` dosyasına paketleme. |
| **Lucide React** | `^1.21.0` | Vektörel SVG ikon seti | Bütün UI bileşenleri | Arayüz ikonları (`Camera`, `Film`, `Users`, `Share2`, `Download`, `Check`, `AlertTriangle`, `Lock`, `Zap`, `RefreshCw`, `Compass`, `RotateCcw`). |
| **Tailwind CSS** | `^4.0.0` | Utility-first CSS derleyicisi ve tasarım sistemi | `src/app/globals.css`, `postcss.config.mjs` | `@import "tailwindcss";` ve `@theme` direktifleri ile modern CSS token yönetimi, koyu tema paleti ve duyarlı (responsive) tasarım. |
| **@tailwindcss/postcss** | `^4.0.0` | Tailwind CSS v4 PostCSS eklentisi | `postcss.config.mjs` | CSS derleme boru hattı (pipeline). |

---

### 1.3. Frontend Web API'leri ve Donanım Entegrasyonları
DijiAlbum, web tarayıcısını fiziksel bir kullan-at analog fotoğraf makinesine dönüştürmek için kapsamlı HTML5 donanım API'lerini kullanır:

1. **HTML5 Canvas 2D API (`HTMLCanvasElement`, `CanvasRenderingContext2D`):**
   - *Konum:* `src/app/camera/CameraView.js` (`handleShutterClick`).
   - *İşlev:* Video akışından kare yakalama (`drawImage`), ön kamera çekimlerinde aynalama (`ctx.scale(-1, 1)`), ham piksel manipülasyonu (`ctx.getImageData`, `ctx.putImageData`), Polaroid altlık filigranı ekleme (el yazısı misafir imzası ve turuncu dijital saat formatında tarih damgası basımı) ve Base64/Blob çıktısı üretme (`toDataURL`).
2. **MediaDevices & MediaStream API (`navigator.mediaDevices.getUserMedia`):**
   - *Konum:* `src/app/camera/CameraView.js` (`initCamera`).
   - *İşlev:* Mobil cihazın ön (`facingMode: 'user'`) ve arka (`facingMode: 'environment'`) kameralarına doğrudan erişim; akış açma/kapama ve iz (track) yönetimi.
3. **MediaStreamTrack & ImageCapture Constraints API:**
   - *Konum:* `src/app/camera/CameraView.js` (`toggleTorch`, `changeZoom`).
   - *İşlev:* Donanımsal el feneri/flaş kontrolü (`track.applyConstraints({ advanced: [{ torch: true/false }] })`) ve donanımsal odak/yakınlaştırma (`track.applyConstraints({ advanced: [{ zoom: clampedZoom }] })`).
4. **DeviceOrientation API & iOS Permission API (`DeviceOrientationEvent`):**
   - *Konum:* `src/app/camera/CameraView.js` (`handleOrientation`, `requestSensorPermission`).
   - *İşlev:* Telefonun uzaydaki eğim açısını (Beta: dikey eksen, Gamma: yatay eksen) algılama. iOS 13+ güvenlik protokollerine uygun kullanıcı izni isteme (`DeviceOrientationEvent.requestPermission()`).
5. **Web Audio API (`AudioContext`, `OscillatorNode`, `GainNode`, `BiquadFilterNode`, `AudioBuffer`):**
   - *Konum:* `src/app/camera/CameraView.js` (`playClickSound`, `playShutterSound`).
   - *İşlev:* Harici ses dosyası (`.mp3`/`.wav`) indirmeden; osilatör dalgaları, frekans rampaları (`exponentialRampToValueAtTime`) ve beyaz gürültü (white noise buffer) sentezleyerek mekanik deklanşör sesi ve analog ayna çarpma bası (`mirror slap thump`) üretme.
6. **Web Vibration API (`navigator.vibrate`):**
   - *Konum:* `src/app/camera/CameraView.js`.
   - *İşlev:* Telefon tam dik açıya (75°-95° Beta, -10°/10° Gamma) geldiğinde ve deklanşöre basıldığında dokunsal (haptic) titreşim geri bildirimi sağlama.
7. **Clipboard API (`navigator.clipboard.writeText`):**
   - *Konum:* `src/app/album/[id]/page.js` (`handleShareLink`).
   - *İşlev:* Etkinlik albüm bağlantısını tek tıkla panoya kopyalama.
8. **Web Storage API (`localStorage`):**
   - *Konum:* `src/app/join/[event_id]/page.js`, `src/app/camera/CameraView.js`.
   - *İşlev:* Kullanıcının kalan çekim hakkını (`dijialbum_remaining_shots`), misafir ID'sini (`dijialbum_guest_id`), misafir adını (`dijialbum_guest_name`), aktif etkinlik ID'sini (`dijialbum_event_id`) ve çekilen fotoğrafların yerel önbelleğini (`dijialbum_captured_photos`) kalıcılaştırma.

---

### 1.4. Backend ve Veritabanı Teknolojileri

- **Supabase BaaS (Backend-as-a-Service):**
  - *Ne amaçla kullanıldı:* Sunucusuz (serverless) mimaride veritabanı, gerçek zamanlı veri akışı ve görsel nesne depolama motoru.
  - *Bileşenleri:*
    - **PostgreSQL 15+ (Supabase Database):** İlişkisel veri saklama.
    - **Supabase Storage:** S3 uyumlu nesne deposu. `raw_photos` adlı halka açık (public) bir kova (bucket) üzerinden fotoğrafları barındırır.
    - **Supabase Realtime:** PostgreSQL Write-Ahead Log (WAL) değişikliklerini WebSocket üzerinden istemciye ileten reaktif yayın/abone (Pub/Sub) motoru.
- **PostgreSQL Uzantıları (Extensions):**
  - `"uuid-ossp"` ve dahili `gen_random_uuid()`: Birincil anahtarların kriptografik olarak benzersiz UUID olarak üretilmesini sağlar.
- **Paket Notu (pg - node-postgres):**
  - `package.json` içerisinde `devDependencies` altında `pg: "^8.22.0"` tanımlıdır. Kaynak kod içerisinde doğrudan Node.js backend seviyesinde bir `Client`/`Pool` importu bulunmamaktadır; doğrudan veritabanı şema provizyonu veya lokal script ihtiyaçları için geliştirme ortamı bağımlılığı olarak yer almaktadır. Uygulama çalışma zamanında veritabanı haberleşmesini tamamen `@supabase/supabase-js` SDK'sı üzerinden yürütür.

---

### 1.5. Tipografi ve Varlık (Asset) Yönetimi

- **next/font/google:**
  - *Yazı Tipleri:*
    - `Geist Sans`: Modern arayüz ve gövde metinleri için sans-serif font.
    - `Geist Mono`: Sayaçlar, deklanşör bilgileri, ISO değerleri ve teknik etiketler için monospace font.
    - `Cormorant Garamond` (Weights: 300, 400, 500, 600, 700): Başlıklar, editoryal metinler ve Polaroid üzerindeki el yazısı tarzı misafir imzaları için serif font.
  - *Özellik:* Sıfır kümülatif düzen kayması (zero CLS) ve otomatik yerel barındırma optimizasyonu.
- **Prosedürel SVG Noise / Grain:**
  - `src/app/globals.css` içinde `feTurbulence` filtreli satır içi data-URI SVG kullanılarak CPU/GPU dostu hareketli analog film gren efekti oluşturulmuştur.

---

### 1.6. Test, Kod Kalitesi ve Yapılandırma Araçları

- **ESLint v9 (`eslint.config.mjs`):**
  - Yeni Flat Config formatında yapılandırılmıştır.
  - `eslint-config-next/core-web-vitals` kural kümesi entegre edilmiştir.
  - `.next/**`, `out/**`, `build/**` otomatik yoksayma kuralları tanımlıdır.
- **Next.js Konfigürasyonu (`next.config.mjs`):**
  - `images.remotePatterns` tanımlanarak `*.supabase.co` ve `images.unsplash.com` alan adlarından gelen harici görsellerin `next/image` optimizasyon boru hattından geçmesine izin verilmiştir.
- **PostCSS (`postcss.config.mjs`):**
  - `@tailwindcss/postcss` eklentisiyle CSS dönüşümlerini yürütür.
- **Path Aliasing (`jsconfig.json`):**
  - `@/*` eşlemesi ile `./src/*` mutlak yol importları standartlaştırılmıştır.

---

### 1.7. AI / LLM Entegrasyonu Durumu

Kaynak kodlar analiz edildiğinde; uygulamada son kullanıcıya dönük çalışan doğrudan bir AI/LLM API entegrasyonu (OpenAI, Gemini, Anthropic API çağrısı, vektör veritabanı veya embedding modeli) **bulunmamaktadır**. Projedeki filtreleme ve görüntü işleme algoritmaları, harici bir yapay zeka servisine bağlanmaksızın, tamamen istemci tarafında matematiksel piksel matris dönüşümleriyle (Raw Pixel Canvas Manipulation) gerçekleştirilmektedir. (Projeye rehberlik eden `.cursorrules` ve agent dokümanları geliştirme süreci rehberleridir).

---

## 2. Proje Mimarisi

DijiAlbum, mobil öncelikli (mobile-first), istemci tarafında zengin donanım etkileşimlerine sahip, sunucusuz (serverless) mimari ile desteklenen bir **Etkinlik Tabanlı Reaktif Fotoğraf Paylaşım Platformudur**.

```
                   +---------------------------------------------+
                   |           MİSAFİR AKILLI TELEFONU           |
                   | (Tarayıcı / PWA - Next.js React 19 Client)   |
                   +----------------------+----------------------+
                                          |
                +-------------------------+-------------------------+
                |                                                   |
       [Donanım & Web API]                                 [Uygulama Motoru]
  - getUserMedia (Kamera Ön/Arka)                    - React 19 / App Router
  - DeviceOrientation (Jiroskop)                     - Framer Motion
  - Web Audio API (Deklanşör Sentezi)                - LocalStorage Senkronizasyonu
  - Canvas 2D (Piksel Filtreleri & Damga)            - JSZip Paketleyici
                |                                                   |
                +-------------------------+-------------------------+
                                          |
                               [HTTPS / WSS]
                                          |
                                          v
                   +---------------------------------------------+
                   |             SUPABASE CLOUD BAAS             |
                   +----------------------+----------------------+
                                          |
         +--------------------------------+--------------------------------+
         |                                |                                |
         v                                v                                v
+------------------+             +------------------+             +------------------+
| Supabase Storage |             |   PostgreSQL     |             | Supabase Realtime|
|   (raw_photos)   |             | (events, guests, |             | (WebSocket CDC)  |
|  S3 Object Store |             |     photos)      |             | postgres_changes |
+------------------+             +------------------+             +------------------+
         ^                                                                 |
         |                                                                 |
         +------------------- [CANLI GÜNCELLEME] --------------------------+
                                          |
                                          v
                   +---------------------------------------------+
                   |           CANLI ALBÜM EKRANI                |
                   |      (/album/[id] - Polaroid Duvarı)        |
                   +---------------------------------------------+
```

### 2.1. İletişim ve Veri Akışı Mekanizması

1. **Giriş ve Seans Doğrulama (`/join/[event_id]`):**
   - Kullanıcı etkinlik masasındaki QR kodu okutur.
   - Sayfa URL'deki `event_id` parametresini Regex ile doğrular (`UUID` formatı kontrolü).
   - Supabase üzerinden etkinliğin `active` durumu sorgulanır.
   - Etkinlik aktifse `localStorage` seans bilgileri sıfırlanıp `/camera` sayfasına yönlendirilir; etkinlik kapalıysa doğrudan `/reveal/[event_id]` banyo galerisine yönlendirilir.
2. **Kamera & Misafir Onboarding (`/camera`):**
   - Next.js SSR kısıtlamalarını aşmak için `dynamic(() => import('./CameraView'), { ssr: false })` deseni kullanılmıştır.
   - Misafir kayıtlı değilse onboarding modalı açılır; girilen isimle `guests` tablosuna kayıt atılır ve UUID yerel depolamaya yazılır.
   - `getUserMedia` ile video akışı başlatılır; jiroskop ve donanım yetenekleri (torch, zoom) taranır.
3. **Fotoğraf Çekimi & Yerinde İşleme:**
   - Deklanşöre basıldığında Web Audio API anında ses üretir; ekranda flaş efekti patlatılır ve haptik titreşim verilir.
   - Video karesi Canvas'a aktarılır; seçili filtrenin RGBA piksel matrisi doğrudan bellek üzerinde (`getImageData` -> `data[i]` manipülasyonu -> `putImageData`) işlenir.
   - Cormorant Garamond fontu ile misafir adı ve Geist Mono ile turuncu tarih damgası Canvas'a yazılır.
   - Base64 formatına çevrilen görsel yerel state'e eklenir ve kalan poz sayısı (12'den geriye) düşürülür.
4. **Asenkron Arka Plan Senkronizasyonu (`uploadPhotoInBackground`):**
   - Çekim işlemi arayüzü kilitlemez (Non-blocking / Optimistic).
   - Base64 verisi `Blob` nesnesine çevrilir.
   - Supabase Storage `raw_photos` kovasına `{event_id}/{timestamp}-{uuid}.jpg` yoluyla yüklenir.
   - Dönen public URL ile `photos` tablosuna `guest_id`, `event_id`, `image_url` ve `filter_used` kaydedilir.
   - `guests` tablosundaki `remaining_shots` değeri güncellenir.
5. **Gerçek Zamanlı Albüm Yansıtma (`/album/[id]`):**
   - Albüm sayfası Supabase Realtime WebSocket kanalına abone olur (`album-photos-stream-${eventId}`).
   - `photos` tablosuna gelen `INSERT` olaylarını yakalar ve sayfayı yenilemeden yeni çekilen Polaroid kartını en başa ekler (`layoutId` spring animasyonuyla).

---

### 2.2. Klasör ve Dosya Hiyerarşisi

```
DijiAlbum/
├── .cursorrules              # Antigravity/Cursor tasarım ve kodlama kuralları
├── AGENTS.md                 # Agent ve Next.js versiyon talimatları
├── eslint.config.mjs         # ESLint 9 Flat Config yapılandırması
├── jsconfig.json             # Modül yol takma adları (@/*)
├── next.config.mjs           # Next.js görsel alan adı ve çalışma zamanı ayarları
├── package.json              # Bağımlılıklar ve npm scriptleri
├── postcss.config.mjs        # Tailwind CSS PostCSS yapılandırması
├── schema.sql                # PostgreSQL veritabanı şeması ve RLS kuralları
├── public/                   # Statik varlıklar ve SVG ikonlar
└── src/
    ├── lib/
    │   └── supabase.js       # Singleton Supabase Client başlatıcısı
    └── app/
        ├── layout.js         # Kök düzen, global fontlar (Geist, Cormorant) ve meta veriler
        ├── globals.css        # Tailwind v4 tema değişkenleri, gren ve neon animasyonları
        ├── page.js           # Kök dizin (Erişim kısıtlı bilgilendirme ekranı)
        ├── join/
        │   └── [event_id]/
        │       ├── page.js   # QR seans doğrulama ve akıllı yönlendirici
        │       └── error.js  # Seans yükleme hata sınırı (Error Boundary)
        ├── camera/
        │   ├── page.js       # SSR-kapalı dinamik kamera sarmalayıcısı
        │   └── CameraView.js # Kamera, vizör, jiroskop, filtre ve ses motoru (1498 satır)
        ├── album/
        │   └── [id]/
        │       ├── page.js   # Canlı Polaroid albümü, JSZip indirme ve lightbox
        │       └── error.js  # Albüm hata sınırı (Error Boundary)
        └── reveal/
            └── [event_id]/
                └── page.js   # Banyo edilmiş arşiv galerisi ve sayfalama (Pagination)
```

---

### 2.3. Veritabanı Modeli ve İlişki Yapısı (`schema.sql`)

```
                  +---------------------------+
                  |       auth.users          |
                  | (Supabase Auth Kullanıcı) |
                  +-------------+-------------+
                                | 1
                                |
                                | N (user_id)
                  +-------------v-------------+
                  |          events           |
                  |---------------------------|
                  | id (UUID, PK)             |
                  | user_id (UUID, FK)        |
                  | name (TEXT)               |
                  | event_type (TEXT)         |
                  | max_guests (INT)          |
                  | cover_image_url (TEXT)    |
                  | price (INT)               |
                  | active (BOOLEAN)          |
                  | created_at (TIMESTAMPTZ)  |
                  +-------------+-------------+
                                | 1
        +-----------------------+-----------------------+
        | 1 (event_id)                                  | 1 (event_id)
        |                                               |
+-------v-------------------+                   +-------v-------------------+
|          guests           |                   |          photos           |
|---------------------------|                   |---------------------------|
| id (UUID, PK)             | 1               N | id (UUID, PK)             |
| event_id (UUID, FK)       +-------------------+ guest_id (UUID, FK)       |
| guest_name (TEXT)         | (guest_id)        | event_id (UUID, FK)       |
| remaining_shots (INT: 12) |                   | image_url (TEXT)          |
| created_at (TIMESTAMPTZ)  |                   | filter_used (TEXT)        |
+---------------------------+                   | created_at (TIMESTAMPTZ)  |
                                                +---------------------------+
```

- **Güvenlik ve RLS Stratejisi:**
  - `public.events`, `public.guests` ve `public.photos` tablolarında RLS devre dışı bırakılmıştır (`DISABLE ROW LEVEL SECURITY`). Bunun teknik gerekçesi, etkinlikteki davetlilerin herhangi bir kimlik doğrulama (şifre, OTP, e-posta) sürecine maruz kalmadan, tamamen anonim ve sürtünmesiz (frictionless) bir şekilde fotoğraf çekip veritabanına ekleyebilmesidir.
  - `storage.objects` üzerinde RLS devrededir ve `raw_photos` bucket'ı için herkese açık `INSERT` ve `SELECT` politikaları oluşturulmuştur.

---

### 2.4. Kullanılan Mimari Desenler ve Tasarım Yaklaşımları

1. **Client-Side Rendering (CSR) Hardware Isolation:**
   - Tarayıcının donanım API'leri (`navigator.mediaDevices`, `AudioContext`, `DeviceOrientationEvent`) Node.js sunucu tarafında bulunmadığından, `next/dynamic` kullanılarak `ssr: false` bayrağı ile donanım katmanı SSR'dan tamamen izole edilmiştir.
2. **React 19 Async Unwrapping Pattern:**
   - Next.js 15/16 App Router mimarisinde dinamik parametreler asenkron olarak iletilir. Projede `use(params)` kancası kullanılarak `[event_id]` ve `[id]` parametreleri modern React 19 standardında çözümlenmiştir.
3. **Singleton Pattern:**
   - Supabase istemcisi (`src/lib/supabase.js`) tüm uygulama genelinde tekil bir örnek (singleton) olarak başlatılmış, bellek ve WebSocket bağlantı tüketimi optimize edilmiştir.
4. **Optimistic & Resilient Background Sync:**
   - Deklanşöre basıldığında arayüz hemen tepki verir (deklanşör animasyonu, sayaç düşüşü, film rulosuna yerel ekleme). Buluta yükleme işlemi arka planda sessizce yürütülür; ağ hatası meydana gelirse kullanıcı kırmızı uyarı tostu ile bilgilendirilirken yerel kopyası korunur.
5. **Zero-Asset Procedural Audio:**
   - Ses dosyaları ağdan indirilmez. Web Audio API osilatörleri çalışma anında ses dalgalarını sentezler. Sıfır HTTP gecikmesi ve sıfır bant genişliği tüketilir.
6. **Raw Memory Pixel Clamping:**
   - Safari/iOS tarayıcılarında `CanvasRenderingContext2D.filter` API'sinin donanımsal kısıtlamaları veya anlık render hataları nedeniyle doğrudan bellek seviyesinde `Uint8ClampedArray` döngüsü kullanılarak pikseller işlenir.

---

## 3. Geliştirilen Özellikler (Gerçek Kod İncelemesi)

Projede aktif olarak yer alan ve kaynak kodları doğrulanmış özellikler:

### 3.1. QR Seans Doğrulama ve Akıllı Yönlendirme (Event Router)
- **Ne işe yarar:** QR kod ile gelen misafirin doğru etkinliğe yönlendirilmesini, geçersiz linklerin filtrelenmesini sağlar.
- **Nasıl çalışır:** URL'den gelen `event_id` parametresi regex ile UUID biçim kontrolünden geçer. Supabase üzerinden etkinliğin aktifliği denetlenir. Etkinlik devam ediyorsa kamera açılır, etkinlik tamamlanmışsa banyo galerisine yönlendirilir.
- **Kullanılan Teknolojiler:** Next.js App Router, `@supabase/supabase-js`, `framer-motion`, Lucide React.
- **Teknik Uygulama:** `src/app/join/[event_id]/page.js` ve hata durumları için `error.js`.

### 3.2. Sürtünmesiz Misafir Kayıt / Onboarding Modalı
- **Ne işe yarar:** Misafirin şifre belirlemeden yalnızca isim-soyisim girerek anında seansa dahil olmasını sağlar.
- **Nasıl çalışır:** Kullanıcının `localStorage` kaydı yoksa ekrana şık bir modal açılır. Girilen isim `guests` tablosuna 12 poz hakkıyla eklenir; dönen ID ve isim yerel depolamaya kaydedilir.
- **Kullanılan Teknolojiler:** React Form State, Supabase DB, Framer Motion.
- **Teknik Uygulama:** `CameraView.js` (`handleOnboardingSubmit`).

### 3.3. Donanımsal Kamera Vizörü & Çift Kamera Desteği
- **Ne işe yarar:** Kullan-at fotoğraf makinesi vizör deneyimi sunar; ön ve arka kameralar arasında kesintisiz geçiş sağlar.
- **Nasıl çalışır:** `navigator.mediaDevices.getUserMedia` üzerinden `user` veya `environment` kısıtlamaları ile akış başlatılır. Ön kamera modunda video ve yakalanan kare `scaleX(-1)` ile aynalanır. Kamera değişiminde önceki video izleri (`track.stop()`) kapatılarak bellek sızıntıları önlenir.
- **Kullanılan Teknolojiler:** WebRTC MediaDevices API, HTML5 `<video>` elementi, CSS GPU hızlandırma.
- **Teknik Uygulama:** `CameraView.js` (`initCamera`, `toggleCameraFacing`).

### 3.4. Donanımsal Flaş (Torch) ve Odaklama (Zoom) Kontrolü
- **Ne işe yarar:** Mobil cihazın arkasındaki gerçek LED flaşı açıp kapatır ve donanımsal yakınlaştırma (0.5x geniş açı / 1.2x odak) sağlar.
- **Nasıl çalışır:** Video izinin donanım kabiliyetleri taranır (`track.getCapabilities()`). `torch` ve `zoom` özellikleri destekleniyorsa `track.applyConstraints()` ile cihaza doğrudan komut gönderilir; desteklenmiyorsa arayüzde kullanıcıya bilgi verilir.
- **Kullanılan Teknolojiler:** MediaStreamTrack Constraints API.
- **Teknik Uygulama:** `CameraView.js` (`toggleTorch`, `changeZoom`).

### 3.5. Jiroskop Destekli "Mükemmel Açı" Asistanı ve Oyunlaştırma
- **Ne işe yarar:** Misafirlerin rastgele ve yamuk açılar yerine telefonu tam dik ve göz hizasında tutarak estetik fotoğraflar çekmesini teşvik eder.
- **Nasıl çalışır:** `deviceorientation` dinleyicisi Beta ve Gamma açılarını izler. Telefon Beta: 75°-95° ve Gamma: -10°/+10° aralığına geldiğinde vizör çerçevesi neon yeşile döner, "MÜKEMMEL AÇI! ŞİMDİ ÇEK!" uyarısı çıkar ve cihaz hafifçe titrer (`navigator.vibrate(50)`). iOS cihazlar için izin isteme arayüzü, masaüstü cihazlar içinse fare koordinatlarından açı türeten simülatör entegre edilmiştir.
- **Kullanılan Teknolojiler:** DeviceOrientation API, Vibration API, Framer Motion.
- **Teknik Uygulama:** `CameraView.js` (`handleOrientation`, `requestSensorPermission`, `handleMouseMove`).

### 3.6. Algoritmik Web Audio Sentezleme Motoru
- **Ne işe yarar:** Düğmeler tıklandığında ve deklanşöre basıldığında analog kamera hissini güçlendiren sesler üretir.
- **Nasıl çalışır:** Dairesel kadran dönüşlerinde 750 Hz'den 120 Hz'e 15 ms'de sönen üçgen dalga osilatörü (`playClickSound`); deklanşör anında ise 1000 Hz bandpass filtreli beyaz gürültü patlaması ile 110 Hz'den 35 Hz'e düşen sinüs ayna çarpma darbesi (`playShutterSound`) eşzamanlı çalıştırılır.
- **Kullanılan Teknolojiler:** Web Audio API (`AudioContext`, `BiquadFilterNode`, `createBuffer`).
- **Teknik Uygulama:** `CameraView.js` (satır 445-518).

### 3.7. Doğrudan Piksel Manipülasyonlu Retro Filtre Motoru
- **Ne işe yarar:** Çekilen fotoğraflara anında nostaljik analog film atmosferi kazandırır.
- **Nasıl çalışır:** 6 farklı modül sunulur:
  1. *Normal:* Standart çekim.
  2. *Yeşilçam:* Sepia 0.6 katsayıları, kontrast artışı, sıcak ton kayması.
  3. *Karanlık Oda:* Yüksek kontrastlı siyah-beyaz (Grayscale).
  4. *Altın Saat:* Sıcak sepia, doygunluk artışı, altın sarısı ton kayması.
  5. *Gümüş Vizör:* %40 doygunluk düşürme, hafif soğuk mavi tonlama.
  6. *Disko 90'lar:* Yüksek kontrast, pembe/camgöbeği renk kaydırma.
  7. *Polaroid:* Düşük kontrast, pastel doygunluk.
  Tüm renk hesaplamaları Canvas piksel tamponundaki her 4 baytta (`r, g, b, a`) matematiksel formüllerle çalıştırılır.
- **Kullanılan Teknolojiler:** HTML5 Canvas ImageData, TypedArrays.
- **Teknik Uygulama:** `CameraView.js` (satır 738-890).

### 3.8. Otomatik Polaroid Damgalama ve Filigran Motoru
- **Ne işe yarar:** Çekilen her fotoğrafın altına çekimi yapan misafirin adını ve etkinliğin tarihini basar.
- **Nasıl çalışır:** Fotoğraf işlendikten sonra Canvas üzerine dinamik metin basılır: sol alt köşeye `Cormorant Garamond` italik fontuyla `* Misafir Adı *`, sağ alt köşeye ise turuncu dijital gösterge renginde `Geist Mono` fontuyla `GG AA YYYY` formatında tarih damgalanır. Arka plan gölgeleriyle kontrast güvenceye alınır.
- **Kullanılan Teknolojiler:** Canvas 2D Text API, Google Fonts entegrasyonu.
- **Teknik Uygulama:** `CameraView.js` (satır 892-925).

### 3.9. 12 Pozluk Mekanik Sayaç ve Harcanabilir Film Mantığı
- **Ne işe yarar:** Gerçek bir kullan-at makine hissi oluşturarak sınırsız ve özensiz çekim yerine sınırlı ve değerli kareler yakalanmasını sağlar.
- **Nasıl çalışır:** Her misafire 12 çekim hakkı tanınır. Sayaç hem yerel depolamada hem de veritabanında saklanır. 12 poz bittiğinde deklanşör kilitlenir, arayüz kararır ve "Fotoğraflarınız Tamamdır! Albüm hazır olduğunda etkinlik sahibi sizinle paylaşacaktır" mesajı çıkar.
- **Kullanılan Teknolojiler:** React State, LocalStorage, Supabase DB.
- **Teknik Uygulama:** `CameraView.js` (satır 1171-1185, 1250-1275).

### 3.10. Koyu Kırmızı Loş Oda (Safelight Red) Alt Çekmecesi (Roll In Drawer)
- **Ne işe yarar:** Misafirin o seans boyunca çektiği kareleri retro karanlık oda banyosu estetiğinde incelemesini sağlar.
- **Nasıl çalışır:** Sağ alttaki film rulosu butonuna tıklandığında alttan yukarı yayılan (spring) koyu kırmızı ışıklı bir çekmece açılır. Çekilen fotoğraflar Polaroid bento grid düzeninde asimetrik açılarla (`rotate(1.5deg)` / `rotate(-1.5deg)`) listelenir; henüz çekilmemiş pozlar asma kilit (`Lock`) ikonu ile gösterilir.
- **Kullanılan Teknolojiler:** Framer Motion `AnimatePresence`, CSS Bento Grid.
- **Teknik Uygulama:** `CameraView.js` (satır 1308-1406).

### 3.11. Canlı Gerçek Zamanlı Albüm Ekranı (Live Collaborative Album)
- **Ne işe yarar:** Düğün salonundaki dev ekranda veya misafirlerin telefonlarında çekilen fotoğrafların anında belirmesini sağlar.
- **Nasıl çalışır:** `/album/[id]` sayfası açıldığında etkinlik bilgileri, misafir sayısı ve mevcut fotoğraflar yüklenir. Ardından Supabase Realtime kanalına abone olunarak yeni eklenen her fotoğraf sayfası yenilenmeksizin animasyonla en başa eklenir. Asimetrik duvar düzeninde Polaroid olarak sergilenir.
- **Kullanılan Teknolojiler:** Supabase Realtime (WebSockets), Next.js Image, Framer Motion `layoutId`.
- **Teknik Uygulama:** `src/app/album/[id]/page.js`.

### 3.12. İstemci Tarafında Tek Tıkla Toplu ZIP İndirme
- **Ne işe yarar:** Etkinlik sahibinin veya misafirlerin albümdeki tüm yüksek çözünürlüklü fotoğrafları tek seferde arşiv olarak indirebilmesini sağlar.
- **Nasıl çalışır:** Sunucuda bir zip servisi çalıştırmak yerine; tarayıcı `fetch` ile tüm görsel URL'lerini Blob olarak çeker, `JSZip` ile bellek içinde `dijialbum-[misafir-adi]-[tarih].jpg` adlandırma standardıyla sıkıştırır ve tarayıcıya otomatik indirme tetikler (`URL.createObjectURL`). İlerleme çubuğu anlık olarak kullanıcıya gösterilir.
- **Kullanılan Teknolojiler:** JSZip kütüphanesi, JavaScript Blob API.
- **Teknik Uygulama:** `src/app/album/[id]/page.js` (`downloadAllAsZip`).

### 3.13. Banyo Edilmiş Arşiv Galerisi (Developed Reveal Page)
- **Ne işe yarar:** Etkinlik sona erdiğinde (aktifliği kapatıldığında) tüm fotoğrafların kamuya açık bir hatıra duvarı olarak sunulmasını sağlar.
- **Nasıl çalışır:** `/reveal/[event_id]` rotasında fotoğraflar 12'şerli parçalar (pagination / `.range(from, to)`) halinde çekilir. Masonry çoklu sütun düzeni ile akışkan bir editoryal dergi görünümü sunulur. Fotoğraflara tıklandığında tam ekran Lightbox açılır.
- **Kullanılan Teknolojiler:** Supabase range pagination, CSS Multi-column masonry, Framer Motion.
- **Teknik Uygulama:** `src/app/reveal/[event_id]/page.js`.

---

## 4. Teknik Yetkinlikler

Bu projenin kaynak kodları, mimarisi ve problem çözme yaklaşımları aşağıdaki yazılım mühendisliği yetkinliklerini somut olarak ortaya koymaktadır:

1. **İleri Seviye Tarayıcı ve Donanım API Entegrasyonu:**
   - WebRTC / MediaDevices üzerinden kamera donanımı kısıtlamalarını yönetebilme (ön/arka kamera geçişleri, çözünürlük ölçekleme, bellek izi temizliği).
   - MediaStreamTrack capabilities API ile donanımsal torch (flaş) ve zoom seviyelerini kontrol edebilme.
   - DeviceOrientation API ile mobil ivmeölçer/jiroskop verilerini işleyip kullanıcı arayüzü etkileşimlerine ve haptik titreşimlere (Vibration API) dönüştürebilme.
2. **Görüntü İşleme ve Düşük Seviyeli Piksel Manipülasyonu:**
   - Standart CSS filtrelerine güvenmek yerine, tarayıcı ve iOS Safari uyumluluğunu garantiye almak için Canvas 2D üzerinde doğrudan piksel baytları (`Uint8ClampedArray`) ile renk matrisi algoritmaları (Sepia, Kontrast, Doygunluk, Parlaklık, Renk Döndürme) geliştirebilme.
   - Görsel üzerine dinamik tipografik filigran ve zaman damgası yerleştirme.
3. **Sıfır Varlık (Zero-Asset) Prosedürel Ses Tasarımı:**
   - Web Audio API ile osilatör, kazanç düğümü ve gürültü tamponları (noise buffer) kullanarak tamamen kod üzerinden fiziksel mekanik ses sentezleyebilme.
4. **Gerçek Zamanlı (Realtime) ve Olay Güdümlü (Event-Driven) Sistemler:**
   - Supabase Realtime ve PostgreSQL CDC (Change Data Capture) kullanarak istemci tarafında WebSocket tabanlı anlık veri senkronizasyonu kurabilme.
5. **Modern React ve Next.js App Router Uzmanlığı:**
   - React 19'un yeni kancalarını (`use()`) kullanarak asenkron route parametrelerini yönetebilme.
   - Donanım kütüphanelerini SSR çökme riskine karşı `next/dynamic` ile dinamik yükleyebilme.
   - Hata sınırları (`error.js`) ile güvenli hata yönetimi uygulayabilme.
6. **İstemci Tarafı İkili (Binary) Veri ve Dosya Yönetimi:**
   - Base64 -> ArrayBuffer -> Blob dönüşümlerini bellek dostu şekilde yönetebilme.
   - `JSZip` ile harici bir sunucu mimarisine ihtiyaç duymadan yüzlerce görseli tarayıcı belleğinde sıkıştırıp tek tıkla arşiv olarak sunabilme.
7. **Yüksek Kaliteli UI/UX, Motion ve Performans Mühendisliği:**
   - Koyu tema, safelight kırmızı ışık yansıması, 35mm film greni ve editoryal tipografi ile özgün bir retro-modern tasarım dili inşa edebilme.
   - `content-visibility: auto`, `containIntrinsicSize`, CSS GPU hızlandırma (`transform-gpu`, `scroll-gpu`) ile binlerce fotoğraf barındırabilecek yüksek performanslı asimetrik duvarlar oluşturabilme.
   - Framer Motion ile fizik kurallarına uygun yay (spring) ve paylaşımlı öğe (`layoutId`) animasyonları kurgulayabilme.
8. **Sunucusuz (Serverless) ve BaaS Mimari Tasarımı:**
   - Supabase PostgreSQL ilişkisel veri modellemesi, yabancı anahtarlar, indeksler ve Storage RLS politikaları oluşturabilme.
   - Misafir deneyimini sıfır sürtünmeyle (şifresiz, link/QR tabanlı) tasarlayıp seans güvenliğini UUID doğrulamalarıyla sağlama.

---

## 5. Rapor Özeti ve Dosya Durumu

| Kriter | Detay |
| :--- | :--- |
| **Proje Adı** | DijiAlbum |
| **Paket Adı** | `temp-app` |
| **Uygulama Modeli** | Client-First Tactile Photo SaaS / PWA |
| **Frontend Yığını** | Next.js 16.2.9, React 19.2.4, Tailwind CSS v4, Framer Motion 12, Lucide React |
| **Backend Yığını** | Supabase BaaS (PostgreSQL, Storage, Realtime WebSockets) |
| **Donanım Motoru** | MediaDevices, DeviceOrientation, Web Audio API, Canvas 2D, Web Vibration |
| **Dosya Sayısı (Kaynak)** | 10 temel kod dosyası + 1 veritabanı şeması + konfigürasyonlar |
| **Rapor Çıktısı** | `PROJECT_TECHNICAL_REPORT.md` |
