# 🎨 GıdaKöprüsü — Ekran Tasarım Promptları (Web + Mobil)

> **Renk Teması:** Beyaz & Yeşil — Göz yormayan, sade, modern  
> **CSS Framework:** Tailwind CSS  
> **Tasarım Felsefesi:** Minimalist, kullanımı kolay, premium hissiyat

---

## 🎯 Genel Tasarım Sistemi Promptu (Tüm Ekranlarda Geçerli)

Aşağıdaki promptu her ekran promptunun **başına** ekle:

```
Tasarım Sistemi:
- Renk Paleti: Beyaz (#FFFFFF) ana arka plan, Yeşil tonları aksan renk olarak.
  Primary: #2D6A4F (koyu yeşil — butonlar, başlıklar)
  Secondary: #52B788 (orta yeşil — ikonlar, badge'ler)
  Accent: #95D5B2 (açık yeşil — hover, vurgu)
  Background: #F0FFF4 (çok açık yeşil — kart arka planları, section'lar)
  Surface: #FFFFFF (beyaz — ana zemin)
  Text Primary: #1B4332 (koyu yeşil-siyah — ana metin)
  Text Secondary: #6B7280 (gri — ikincil metin)
  Success: #10B981, Warning: #F59E0B, Error: #EF4444, Info: #3B82F6
- Tipografi: Inter font ailesi. Başlıklar bold (700), gövde regular (400).
- Border Radius: Butonlar 12px, Kartlar 16px, Input'lar 10px.
- Gölgeler: Hafif ve yumuşak (shadow-sm, shadow-md). Asla sert gölge kullanma.
- Geçişler: Tüm hover/focus durumlarında transition-all duration-200.
- Framework: Tailwind CSS.
- Göz yormayan, sade, temiz, bolca beyaz alan (whitespace) kullanan tasarım.
- Gereksiz görsel kalabalık olmasın. Her elemanın bir amacı olsun.
```

---

---

# 🖥️ BÖLÜM 1 — WEB UYGULAMASI EKRANLARI

---

## WEB-01: Giriş / Kayıt Ekranı (Login / Register)

```
Ekran: GıdaKöprüsü Giriş Sayfası (Passwordless OTP Login)

Layout:
- Tam ekran, ikiye bölünmüş (split screen).
- Sol taraf (%50): Beyaz zemin üzerinde giriş formu.
- Sağ taraf (%50): #F0FFF4 açık yeşil arka plan üzerinde platform tanıtımı.

Sol Panel (Form Alanı):
- Üstte: GıdaKöprüsü logosu (yeşil yaprak ikonu + "GıdaKöprüsü" yazısı, font-bold text-2xl text-[#2D6A4F])
- Altında: "Gıda israfına birlikte son verelim" alt başlık (text-gray-500 text-sm)
- Ortada: Giriş formu
  - "E-posta adresiniz veya telefon numaranız" label
  - Büyük, temiz input alanı (w-full, border border-gray-200, focus:border-[#52B788], focus:ring-2 focus:ring-[#95D5B2]/30, rounded-xl, px-4 py-3.5)
  - Sol tarafında mail ikonu (text-gray-400)
  - "Doğrulama Kodu Gönder" butonu (w-full, bg-[#2D6A4F] hover:bg-[#1B4332], text-white, rounded-xl, py-3.5, font-semibold, transition)
- Altta: "Giriş yaparak Kullanım Koşullarını kabul etmiş olursunuz." (text-xs text-gray-400)

Sağ Panel (Tanıtım Alanı):
- Merkezde: Büyük illüstrasyon veya ikon kompozisyonu (gıda kurtarma temalı)
- 3 küçük stat kartı (cam efektli, backdrop-blur):
  - "2.450 kg gıda kurtarıldı" 🌿
  - "6.125 kg CO₂ önlendi" 🌍
  - "8.200 porsiyon dağıtıldı" 🍽️
- Alt kısımda: "Türkiye'de yılda 26 milyon ton gıda israf ediliyor." cümlesi.

Responsive: Mobil görünümde sağ panel gizlenir, sadece form görünür.

OTP Doğrulama (aynı sayfada geçiş):
- Form alanı yumuşak animasyonla (fade) OTP ekranına dönüşür.
- "kod@email.com adresine gönderilen 6 haneli kodu girin" başlık.
- 6 adet ayrı kutucuk (her biri w-12 h-14, text-center text-2xl font-bold, border-2 border-gray-200 focus:border-[#2D6A4F], rounded-xl). Otomatik tab geçişli.
- Geri sayım: "2:47 saniye kaldı" (text-[#52B788])
- "Kodu tekrar gönder" linki (geri sayım bitince aktif)
- "Doğrula" butonu
```

---

## WEB-02: Alıcı Ana Sayfası / Dashboard

```
Ekran: Alıcı Dashboard (Giriş sonrası ana sayfa)

Layout:
- Sol tarafta sabit sidebar (w-64), sağda ana içerik alanı.
- Üstte horizontal navbar (sticky top-0).

Sidebar (Sol Menü):
- Arka plan: Beyaz (#FFFFFF), sağ kenarda ince border (border-r border-gray-100)
- Üstte: Logo + "GıdaKöprüsü" yazısı
- Menü öğeleri (her biri px-4 py-3 rounded-xl, hover:bg-[#F0FFF4], transition):
  - 🗺️ Keşfet (Harita)
  - 🔍 İlanları Ara
  - 📋 Rezervasyonlarım
  - ⭐ Favorilerim
  - 🏆 Rozetlerim
  - 🔔 Bildirimler (kırmızı badge ile sayı)
  - 👤 Profilim
- Aktif menü: bg-[#F0FFF4] text-[#2D6A4F] font-semibold, sol kenarda 3px kalınlığında yeşil çizgi.
- Sidebar alt kısmında: Kullanıcı avatarı + ismi + "Çıkış Yap" linki.

Üst Navbar:
- Beyaz arka plan, shadow-sm
- Solda: Sayfa başlığı ("Merhaba, Ayşe 👋")
- Ortada: Arama çubuğu (w-96, rounded-full, bg-gray-50, border-none, px-5 py-2.5)
- Sağda: Bildirim zili ikonu (badge ile) + Kullanıcı avatar dropdown

Ana İçerik Alanı:
- Üstte 4 istatistik kartı (grid grid-cols-4 gap-4):
  1. "Kurtardığın Gıda" — 12.5 kg (ikon: 🌿, arka plan gradient: beyazdan çok açık yeşile)
  2. "Önlediğin CO₂" — 31.2 kg (ikon: 🌍)
  3. "Aktif Rezervasyonların" — 2 (ikon: 📋)
  4. "Kazandığın Rozetler" — 3 (ikon: 🏆)
  Her kart: bg-white rounded-2xl p-5 shadow-sm border border-gray-50, hover:shadow-md transition

- Altında: "Yakınındaki İlanlar" başlığı + "Tümünü Gör →" linki
  - Yatay kaydırılabilir (overflow-x-auto) ilan kartları (snap-x):
    - Her kart: w-72, bg-white rounded-2xl shadow-sm overflow-hidden
    - Üstte: Gıda fotoğrafı (h-40 object-cover, sağ üstte yeşil badge: "Ücretsiz" veya "₺25")
    - Geri sayım çubuğu: Kartın üst kısmında ince progress bar (bg-[#52B788])
    - İşletme logosu + adı (text-sm text-gray-500)
    - İlan başlığı (font-semibold text-[#1B4332])
    - Konum + mesafe ("📍 1.2 km — Kadıköy") (text-xs text-gray-400)
    - Son teslim: "⏰ 21:00'e kadar" (text-xs text-[#52B788])
    - "Rezerve Et" butonu (w-full bg-[#2D6A4F] text-white rounded-xl py-2.5 text-sm font-medium)

- Altında: "Son Aktivitelerin" timeline listesi:
  - Her satır: flex items-center gap-3, sol tarafta renkli dot (yeşil/sarı/mavi), sağda açıklama ve tarih.
```

---

## WEB-03: Harita & Keşif Ekranı

```
Ekran: Harita Görünümü — Yakındaki Gıda İlanları (Leaflet.js)

Layout:
- Tam genişlik, sidebar hariç kalan alan.
- Sol taraf (%35): İlan listesi paneli (kaydırılabilir)
- Sağ taraf (%65): Tam boy interaktif harita

Sol Panel (İlan Listesi):
- Üstte: Filtre çubuğu
  - Kategori seçici (dropdown veya chip'ler): Tümü, 🍞 Ekmek, 🍲 Hazır Yemek, 🧁 Tatlı, 🥗 Sebze/Meyve
  - Chip'ler: rounded-full px-4 py-2 text-sm, aktif olan bg-[#2D6A4F] text-white, pasif olan bg-gray-100 text-gray-600
  - Mesafe slider: 1km — 25km arası (accent rengi: #52B788)
  - Fiyat filtresi: "Ücretsiz", "₺0-25", "₺25-50" (toggle butonlar)
  - "Şu an müsait" toggle switch (yeşil)
- Altında: İlan kartları listesi (dikey scroll)
  - Her kart: flex gap-3 p-3 rounded-xl hover:bg-[#F0FFF4] cursor-pointer transition border border-transparent hover:border-[#95D5B2]/30
  - Sol: Küçük fotoğraf (w-20 h-20 rounded-xl object-cover)
  - Sağ: Başlık, İşletme adı, Mesafe, Fiyat badge, Geri sayım
  - Aktif (seçili) kart: bg-[#F0FFF4] border-[#52B788]

Sağ Panel (Harita):
- Leaflet.js harita, OpenStreetMap tile
- Harita stili: Açık tonlu (CartoDB Positron veya Jawg Light)
- Pin/Marker renkleri:
  - 🟢 Yeşil pin: Ücretsiz bağış
  - 🟡 Sarı pin: İndirimli sürpriz paket
  - 🔵 Mavi pin: Toplu bağış (STK)
- Cluster: Yakın pinler gruplanır, daire içinde sayı gösterilir
- Pin'e tıklayınca popup:
  - Küçük kart: Fotoğraf + Başlık + İşletme + Fiyat + "Detayı Gör" butonu
  - Popup arka planı: Beyaz, rounded-xl, shadow-lg
- Kullanıcı konumu: Mavi pulsating dot
- Sağ üstte: Harita kontrolleri (zoom in/out, konum butonu)
- Sol altta: "Haritada 24 ilan gösteriliyor" bilgisi

Responsive: Mobil görünümde harita tam ekran, liste alt tarafta sheet olarak açılır.
```

---

## WEB-04: İlan Detay Sayfası

```
Ekran: Gıda İlanı Detay Sayfası

Layout: Tek kolon, max-w-4xl mx-auto, üstten alta akış.

Üst Bölüm (Hero):
- Fotoğraf galerisi: Ana büyük fotoğraf (w-full h-80 rounded-2xl object-cover) + altında küçük thumbnail'ler (4 adet, w-20 h-20 rounded-lg, tıklanınca ana fotoğraf değişir)
- Fotoğraf üzerinde sol üstte: Geri butonu (← İlanlara Dön)
- Fotoğraf üzerinde sağ üstte: Favori kalp ikonu (♡ / ♥)
- Fotoğraf üzerinde sağ altta: Fiyat badge ("Ücretsiz" bg-[#2D6A4F] text-white px-4 py-2 rounded-full font-bold text-lg)

Bilgi Bölümü:
- flex justify-between items-start
- Sol:
  - Kategori chip: "🍞 Ekmek & Unlu Mamüller" (bg-[#F0FFF4] text-[#2D6A4F] text-sm rounded-full px-3 py-1)
  - İlan başlığı (text-2xl font-bold text-[#1B4332])
  - İşletme bilgisi: Logo (w-8 h-8 rounded-full) + "Lezzet Fırını" + ⭐ 4.8 (125 değerlendirme)
  - Konum: "📍 Kadıköy, İstanbul — 1.2 km uzaklıkta"
- Sağ:
  - Geri sayım kartı: bg-[#F0FFF4] rounded-2xl p-4 text-center
    - "Son Teslim Alma" label (text-xs text-gray-500)
    - Büyük geri sayım: "01:24:30" (text-3xl font-bold text-[#2D6A4F] font-mono)
    - Progress bar: Kalan süre oranında doluyor (bg-[#52B788])

Detay Kartları (grid grid-cols-2 gap-4):
  - Porsiyon/Adet: "5 porsiyon" (ikon + değer)
  - Orijinal Fiyat: "₺150" (üstü çizili text-gray-400 line-through)
  - Teslim Saatleri: "19:00 — 21:00"
  - Saklama: "Buzdolabı gerekli"

Açıklama Bölümü:
- "Açıklama" başlığı + paragraf metin
- Alerjen bilgisi: Chip'ler halinde (⚠️ Gluten, ⚠️ Yumurta) — bg-amber-50 text-amber-700 rounded-full
- Diyet bilgisi: Chip'ler (✅ Vejetaryen) — bg-green-50 text-green-700

İşletme Hakkında Kartı:
- bg-white rounded-2xl p-5 border border-gray-100
- İşletme logosu, adı, puanı, güven skoru (progress bar), toplam bağış sayısı
- "İşletme Profilini Gör" linki

Harita (Küçük):
- Teslim alma noktasını gösteren küçük harita (h-48 rounded-2xl)
- Altında adres metni + "Yol Tarifi Al" butonu

Alt Sabit Bar (Sticky Bottom):
- bg-white shadow-[0_-4px_12px_rgba(0,0,0,0.05)] p-4
- Sol: Fiyat bilgisi ("Ücretsiz" veya "₺25" büyük yazı)
- Sağ: "Rezerve Et" butonu (bg-[#2D6A4F] text-white px-8 py-3.5 rounded-xl font-semibold text-lg, hover:bg-[#1B4332])
```

---

## WEB-05: Rezervasyon Onay & QR Kod Ekranı

```
Ekran: Rezervasyon Başarılı — QR Kod ve Teslimat Bilgileri

Layout: Modal (overlay) veya tam sayfa, merkezde kart.

Başarı Animasyonu:
- Üstte: Yeşil check animasyonu (✅ büyüyerek belirir)
- "Rezervasyonun Onaylandı!" (text-2xl font-bold text-[#1B4332])
- "Aşağıdaki kodu işletmeye göster" (text-gray-500)

QR Kod Kartı (bg-white rounded-3xl shadow-lg p-8, max-w-md mx-auto):
- Merkezde: Büyük QR Kod (200x200px, siyah-beyaz, çerçevesi yeşil border-4 border-[#52B788] rounded-2xl p-4)
- Altında: 6 haneli teslimat kodu büyük fontla: "AK7M2X" (text-4xl font-mono font-bold text-[#2D6A4F] tracking-[0.3em] bg-[#F0FFF4] px-6 py-3 rounded-xl)
- Ayraç çizgisi (dashed border)
- Teslim alma bilgileri:
  - 🏪 İşletme: "Lezzet Fırını"
  - 📍 Adres: "Kadıköy, Moda Cad. No:42"
  - ⏰ Teslim Saati: "19:00 — 21:00"
  - 📦 İçerik: "Sürpriz Fırın Paketi (5 porsiyon)"
- "Yol Tarifi Al" butonu (outline: border-2 border-[#2D6A4F] text-[#2D6A4F] rounded-xl px-6 py-3)
- "Rezervasyonlarıma Git" butonu (bg-[#2D6A4F] text-white rounded-xl px-6 py-3)

Not: QR kod sayfası yazdırılabilir olmalı (print:shadow-none).
```

---

## WEB-06: Rezervasyonlarım Listesi

```
Ekran: Kullanıcının Aktif ve Geçmiş Rezervasyonları

Layout: Sidebar + Ana içerik alanı.

Üstte: Tab navigasyonu
- "Aktif" (sayı badge'i: 2), "Tamamlanan", "İptal Edilen"
- Aktif tab: border-b-2 border-[#2D6A4F] text-[#2D6A4F] font-semibold
- Pasif tab: text-gray-400

Aktif Rezervasyonlar:
- Her kart: bg-white rounded-2xl p-5 shadow-sm border border-gray-50 mb-4
  - Üst satır: flex justify-between
    - Sol: Rezervasyon no "RZ-202600042" (text-xs text-gray-400 font-mono)
    - Sağ: Durum badge ("Aktif" — bg-green-50 text-green-700 rounded-full px-3 py-1 text-xs font-medium)
  - Orta: flex gap-4
    - Gıda fotoğrafı (w-24 h-24 rounded-xl object-cover)
    - Bilgiler: Başlık, İşletme, Tarih/Saat
    - Geri sayım: Canlı geri sayım (text-[#2D6A4F] font-mono font-bold)
  - Alt satır: flex justify-between
    - "QR Kodu Göster" butonu (bg-[#2D6A4F] text-white rounded-xl px-5 py-2.5 text-sm)
    - "Yol Tarifi" butonu (outline)
    - "İptal Et" butonu (text-red-500 text-sm hover:text-red-700)

Tamamlanan Rezervasyonlar:
- Benzer kart yapısı ama soluk renkte
- "Değerlendir" butonu (henüz değerlendirme yapılmadıysa, bg-amber-50 text-amber-700)
- Değerlendirme yapıldıysa: ⭐⭐⭐⭐⭐ yıldızlar gösterilir

Boş Durum (Empty State):
- İlgili tab'da kayıt yoksa: Merkezde büyük ikon + "Henüz aktif rezervasyonun yok" + "Keşfet" butonu
```

---

## WEB-07: Profil & Ayarlar Sayfası

```
Ekran: Kullanıcı Profili, Bildirim Tercihleri ve Hesap Ayarları

Layout: Sidebar + Ana içerik, sol tarafta alt menü + sağda içerik.

Sol Alt Menü (Profil Sidebar):
- Kullanıcı avatarı (büyük, w-20 h-20 rounded-full, üzerine hover'da kamera ikonu)
- İsim + E-posta
- Alt menü öğeleri:
  - 👤 Kişisel Bilgiler
  - 🔔 Bildirim Tercihleri
  - 📍 Adres Bilgileri
  - 🏆 Rozetlerim
  - 📊 Etkiim (Kurtardığım Gıdalar)
  - 🔒 Gizlilik
  - 🚪 Hesabımı Sil

Kişisel Bilgiler Formu:
- Ad, Soyad, Telefon, E-posta (salt okunur)
- Her input: bg-gray-50 border-0 focus:bg-white focus:ring-2 focus:ring-[#52B788]/30 rounded-xl px-4 py-3
- "Kaydet" butonu

Bildirim Tercihleri:
- Tablo formatı:
  - Satırlar: Olay türleri (Yakınımda yeni ilan, Rezervasyon durumu, Haftalık özet, Rozet kazanımı)
  - Sütunlar: E-posta (toggle), Push (toggle), SMS (toggle — "Yakında" label)
  - Toggle switch: Yeşil (#2D6A4F) aktif, gri pasif

Rozetlerim:
- Grid görünümde (grid grid-cols-4 gap-4):
  - Kazanılmış rozet: Renkli ikon + isim + tarih
  - Kazanılmamış rozet: Gri tonlu (opacity-40), altında ilerleme çubuğu ("3/10 teslim — %30")
```

---

## WEB-08: İşletme Dashboard'u

```
Ekran: İşletme Sahibi Ana Sayfa (Business Dashboard)

Layout: Sidebar (işletme menüsü) + Ana içerik

Sidebar Menüsü (İşletme):
- 📊 Dashboard
- ➕ Yeni İlan Oluştur
- 📋 İlanlarım
- 📦 Gelen Rezervasyonlar
- ⭐ Değerlendirmeler
- 👥 Personel Yönetimi
- 📈 İstatistiklerim
- ⚙️ İşletme Ayarları

Ana İçerik:
- Üstte karşılama: "Lezzet Fırını'na Hoş Geldin 👋" + işletme güven skoru (circular progress, %87)

- 4 istatistik kartı (grid grid-cols-4 gap-4):
  1. "Bugün Kurtarılan" — 8.5 kg (artış trendi ↑12% yeşil ok)
  2. "Aktif İlanlar" — 3
  3. "Bekleyen Teslimler" — 5
  4. "Bu Ay Toplam" — 124 kg

- Orta bölüm (grid grid-cols-2 gap-6):
  Sol: "Aktif İlanlar" listesi (son 5)
    - Her satır: İlan başlığı + kalan porsiyon + geri sayım + durum badge
    - "Tümünü Gör" linki
  Sağ: "Son Rezervasyonlar" listesi (son 5)
    - Her satır: Alıcı adı + ilan + tarih + durum (Bekliyor/Teslim Edildi)

- Alt bölüm: Haftalık grafik (bar chart)
  - X ekseni: Pazartesi — Pazar
  - Y ekseni: Kurtarılan gıda (kg)
  - Bar rengi: #52B788
  - Arka plan: bg-white rounded-2xl p-6 shadow-sm

- Sağ alt: "Son Değerlendirmeler" (son 3 yorum, yıldız + kısa metin)
```

---

## WEB-09: İlan Oluşturma Formu (İşletme)

```
Ekran: Yeni Gıda İlanı Oluştur (Multi-step Form)

Layout: Merkezde büyük kart (max-w-3xl), adım göstergesi üstte.

Adım Göstergesi (Step Indicator):
- 3 adım: ① Temel Bilgiler → ② Detaylar → ③ Önizleme
- Aktif adım: Yeşil daire (#2D6A4F) + kalın çizgi
- Tamamlanan adım: Yeşil check ✓
- Bekleyen adım: Gri daire + kesik çizgi

Adım 1 — Temel Bilgiler:
- İlan Türü seçici (3 büyük kart, tek seçimli):
  - 🎁 "Ücretsiz Bağış" — bg-white border-2 border-gray-200, seçilince border-[#2D6A4F] bg-[#F0FFF4]
  - 💰 "Sürpriz Paket (İndirimli)"
  - 📦 "Toplu Bağış"
- Başlık input'u (text-lg placeholder: "Örn: Günün Sürpriz Fırın Paketi")
- Kategori seçici (Select veya büyük chip'ler): 🍞 Ekmek, 🍲 Hazır Yemek, 🧁 Tatlı, 🥗 Sebze/Meyve...
- Açıklama textarea (max 500 karakter, karakter sayacı sağ altta)
- Fotoğraf yükleme: Drag & drop alanı (border-2 border-dashed border-gray-300 hover:border-[#52B788] rounded-2xl p-8, merkezde kamera ikonu + "Fotoğraf yükle veya sürükle" yazısı). Maks 5 fotoğraf, her biri önizlemeli (küçük thumbnail + X silme butonu).

Adım 2 — Detaylar:
- Porsiyon / Adet (number input, stepper butonlarıyla: – 5 +)
- Tahmini Ağırlık (kg) (küçük input + "kg" suffix)
- Orijinal Fiyat (₺) (sadece Sürpriz Paket seçiliyse)
- Platform Fiyatı (₺) (sadece Sürpriz Paket seçiliyse, "0" ise ücretsiz)
- Teslim Alma Saatleri: Başlangıç (time picker) — Bitiş (time picker)
- Teslim Alma Noktası: Varsayılan olarak işletme adresi (harita üzerinde pin, değiştirilebilir)
- Alerjen bilgisi (multiselect chip'ler): Gluten, Laktoz, Fıstık, Yumurta, Soya, Balık
- Diyet uygunluğu (multiselect chip'ler): Vegan, Vejetaryen, Glutensiz, Helal
- Saklama koşulu (select): Buzdolabı, Oda Sıcaklığı, Dondurulmuş
- Taşıma notu (opsiyonel input: "Kendi kabınızı getirin")

Adım 3 — Önizleme:
- İlanın alıcının göreceği haliyle tam önizlemesi (WEB-04 benzeri mini kart)
- "Taslak Olarak Kaydet" butonu (outline, sol tarafta)
- "İlanı Yayınla" butonu (bg-[#2D6A4F] text-white, sağ tarafta)
- Yayınla butonuna basınca: Konfeti animasyonu + "İlanınız yayında! 🎉" başarı mesajı
```

---

## WEB-10: İşletme — Gelen Rezervasyonlar & Teslimat Onayı

```
Ekran: Gelen Rezervasyonları Yönet ve QR ile Teslim Onayla

Layout: Sidebar + Ana içerik

Üstte: Tab'lar — "Bekleyen" (badge: 5), "Bugün Teslim Edilenler", "Geçmiş"

Bekleyen Rezervasyonlar Listesi:
- Her kart: bg-white rounded-2xl p-5 shadow-sm
  - Sol: Alıcı avatarı + adı
  - Orta: Hangi ilan, kaç porsiyon, ne zaman rezerve etti
  - Sağ: 
    - Geri sayım (teslim saatine kalan)
    - "Teslimat Kodunu Gir" butonu (bg-[#2D6A4F] text-white rounded-xl)

Teslimat Doğrulama Modalı:
- Modal: bg-white rounded-3xl p-8 shadow-2xl max-w-md
- Başlık: "Teslimat Doğrulama"
- İki sekme:
  1. "Kod Gir" — 6 haneli input kutuları (alıcı kodu söyler)
  2. "QR Tara" — Kamera açılır (web kamera ile QR tarama)
- Kod doğrulanınca: ✅ Yeşil animasyon + "Teslimat Onaylandı!" + confetti
- "Onayla" butonu

Bugün Teslim Edilenler:
- Tamamlanan teslimatların listesi (soluk yeşil arka plan)
- Her satırda: Alıcı, İlan, Saat, Durum (✅ Teslim Edildi)
```

---

## WEB-11: İşletme İstatistikleri & Sosyal Etki Sayfası

```
Ekran: İşletme Bazlı Etki Raporu ve İstatistikler

Layout: Sidebar + Tek kolon ana içerik

Üst Bölüm — Etki Kartları (grid grid-cols-4 gap-4):
- Kurtarılan Gıda: "245.8 kg" (büyük sayı, altında artış trendi)
- Önlenen CO₂: "614.5 kg" (🌍 ikonu)
- Ulaşılan Kişi: "1.240" (👥 ikonu)
- Güven Skoru: "92/100" (circular progress bar, yeşil)

Zaman Aralığı Seçici:
- Chip'ler: "Bu Hafta", "Bu Ay", "Son 3 Ay", "Tüm Zamanlar", "Özel Tarih Aralığı"

Grafikler (grid grid-cols-2 gap-6):
- Sol: Çizgi grafik — Aylık kurtarılan gıda trendi (line chart, gradient fill #52B788 → transparent)
- Sağ: Pasta grafik — Kategori dağılımı (Ekmek %40, Hazır Yemek %30, Tatlı %20, Diğer %10)

Altında:
- "En Çok Kurtarılan Gıda Türleri" — Yatay bar chart
- Rozet vitrin: Kazanılan rozetler büyük ikonlarla

Alt Bölüm:
- "Sosyal Etki Sertifikası İndir (PDF)" butonu (bg-[#2D6A4F] text-white, büyük, ikonu 📄)
- Sertifika örnek önizlemesi (küçük thumbnail)
```

---

## WEB-12: STK Dashboard'u

```
Ekran: STK / Gönüllü Kuruluş Ana Sayfası

Layout: Sidebar (STK menüsü) + Ana içerik

Sidebar Menü:
- 📊 Dashboard
- 📦 Toplu Bağış Talepleri
- 🚚 Lojistik Koordinasyonu
- 📍 Dağıtım Noktaları
- 👥 Gönüllülerim
- 📈 Etki Raporları

Ana İçerik:
- Üstte: 4 stat kartı (Bekleyen Talepler, Bu Ay Toplanan kg, Dağıtılan Porsiyon, Aktif Gönüllü)
- Merkezde: Yeni gelen toplu bağış talepleri kartları
  - Her kart: İşletme adı, Etkinlik türü, Tahmini kg, Teslim zamanı, Konum
  - "Kabul Et" (yeşil) ve "Reddet" (kırmızı outline) butonları
- Altında: Harita üzerinde dağıtım noktaları ve aktif talepler
```

---

## WEB-13: Admin Dashboard

```
Ekran: Platform Yöneticisi Ana Sayfa

Layout: Sidebar (admin menüsü) + Ana içerik

Sidebar (Admin):
- 📊 Dashboard
- 🏪 İşletme Yönetimi
- 👥 Kullanıcı Yönetimi
- 📂 Kategori Yönetimi
- 📋 İlan Moderasyonu
- 🏆 Rozet Yönetimi
- 📧 Bildirim Şablonları
- ⚙️ Sistem Ayarları
- 📈 Raporlar
- 📝 Audit Log
- 📢 Duyuru Yönetimi

Ana İçerik:
- Üst: 6 stat kartı (2 satır × 3 sütun):
  1. Toplam Kullanıcı (artış trendi)
  2. Aktif İşletme
  3. Bugün Kurtarılan Gıda
  4. Toplam CO₂ Tasarrufu
  5. Onay Bekleyen Başvuru (kırmızı badge)
  6. Bugünkü Aktif İlan

- Orta sol: Canlı Harita — Bugünkü aktif ilanları gösteren mini harita (ısı haritası)
- Orta sağ: Son 7 gün çizgi grafik (günlük kurtarılan gıda)

- Alt: Uyarı Widget'ları
  - 🔴 Geciken Teslimatlar (3)
  - 🟡 Onay Bekleyen İşletmeler (7)
  - 🟠 Yüksek No-show Kullanıcılar (2)
  - Her widget: Tıklanabilir, ilgili yönetim sayfasına yönlendirir

- En alt: Son Audit Log kayıtları (tablo, son 10 işlem)
```

---

## WEB-14: Admin — İşletme Yönetimi

```
Ekran: İşletmeleri Listele, Onayla, Askıya Al

Layout: Sidebar + Ana içerik

Üstte: Arama çubuğu + Filtreler (Durum: Tümü/Onay Bekliyor/Aktif/Askıya Alınmış)

Tablo:
- Sütunlar: İşletme Adı, Tür, Onay Durumu (badge), Güven Skoru, Toplam Bağış, Kayıt Tarihi, İşlemler
- İşlemler: "Onayla" (yeşil), "Detay" (mavi), "Askıya Al" (turuncu), "Sil" (kırmızı)
- Her satır: hover:bg-[#F0FFF4]
- Badge renkleri: Onay Bekliyor (sarı), Aktif (yeşil), Askıya Alınmış (kırmızı)
- Sayfalama (pagination) altta

İşletme Detay Modalı:
- Başvuru bilgileri, dökümanlar, onay/red butonları, red sebebi input'u
```

---

## WEB-15: Admin — Raporlar Sayfası

```
Ekran: Platform Geneli Raporlar ve Analitik

Layout: Sidebar + Ana içerik

Üstte: Tarih aralığı seçici (date range picker, 2 tarih input'u + hazır aralıklar: Son 7 gün, Bu Ay, Son 3 Ay)

Rapor Kartları (grid grid-cols-3 gap-6):
Her kart tıklanabilir, detay sayfasına yönlendirir:
1. 📊 Kurtarılan Gıda Raporu (kg/porsiyon/TL)
2. 🌍 Karbon Ayak İzi Raporu
3. 🏪 İşletme Performans Raporu
4. 👥 Kullanıcı Büyüme Raporu
5. 📋 Kategori Bazlı İstatistikler
6. 🗺️ Coğrafi Dağılım (Isı Haritası)
7. 📈 Dönüşüm Oranları (Görüntüleme → Rezervasyon → Teslim)
8. ⚠️ No-show Raporu
9. ⏱️ SLA İhlal Raporu

Her kart: bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition
- Üstte: İkon + Rapor adı
- Ortada: Ana metrik büyük sayı
- Altta: Mini sparkline grafik (trend)
- "Raporu Aç →" linki

Dışa Aktarma: Her rapor sayfasında "PDF İndir" ve "CSV İndir" butonları
```

---

## WEB-16: Admin — Kategori Yönetimi

```
Ekran: Gıda Kategorileri CRUD (Ekle, Düzenle, Sil)

Layout: Sidebar + Ana içerik

Üstte: "Yeni Kategori Ekle" butonu (bg-[#2D6A4F] text-white)

Kategori listesi (grid grid-cols-3 gap-4):
- Her kart: bg-white rounded-2xl p-5 shadow-sm
  - İkon (emoji), Kategori adı, CO₂ katsayısı, Renk (küçük renk dairesi)
  - Aktif/Pasif toggle
  - İlan sayısı badge
  - "Düzenle" ve "Sil" butonları

Ekleme/Düzenleme Modalı:
- Kategori Adı input
- İkon seçici (emoji picker)
- CO₂ Katsayısı input (kg CO₂ / kg gıda)
- Renk seçici (color picker)
- Aktif/Pasif switch
```

---

## WEB-17: Liderlik Tablosu (Leaderboard)

```
Ekran: En Çok Katkı Sağlayan İşletmeler ve Alıcılar

Layout: Sidebar + Ana içerik

Üstte: Tab'lar — "İşletmeler", "Bireyler"
Altında: Zaman filtresi chip'leri — "Bu Hafta", "Bu Ay", "Tüm Zamanlar"

İşletme Sıralaması:
- İlk 3: Büyük podyum kartları (1. altın border, 2. gümüş, 3. bronz)
  - Her biri: İşletme logosu, adı, kurtardığı kg, rozet ikonu
  - 1. sıra kartı daha büyük, ortada
- 4-10: Tablo satırları
  - Sıra no, Logo, İşletme Adı, Kurtarılan Gıda, CO₂ Tasarrufu, Güven Skoru, Rozetler

Birey Sıralaması:
- Benzer yapı, kurtarılan porsiyon ve rozet sayısı ile
```

---

## WEB-18: Bildirimler Sayfası

```
Ekran: Tüm Bildirimler (Okunmuş ve Okunmamış)

Layout: Sidebar + Ana içerik (max-w-2xl)

Üstte: "Tümünü Okundu İşaretle" linki

Bildirim Listesi:
- Her bildirim: flex gap-4 p-4 rounded-xl hover:bg-[#F0FFF4] transition cursor-pointer
  - Sol: Bildirim tipi ikonu (renkli daire içinde: yeşil/mavi/sarı/kırmızı)
  - Orta: Başlık (font-medium) + Açıklama (text-sm text-gray-500) + Zaman ("5 dk önce" text-xs text-gray-400)
  - Sağ: Okunmamış ise küçük yeşil dot
- Okunmamış bildirimler: bg-[#F0FFF4]/50 sol kenarda yeşil border
- Gruplandırma: "Bugün", "Dün", "Bu Hafta" başlıkları ile
```

---

## WEB-19: Değerlendirme Yazma Modalı

```
Ekran: Teslimat Sonrası İşletme Değerlendirmesi

Modal (overlay, max-w-lg):
- Başlık: "Lezzet Fırını'nı Değerlendir"
- İşletme logosu + adı + ilan başlığı (küçük referans)

- 4 değerlendirme kriteri (her biri alt alta):
  1. "Genel Deneyim" — 5 yıldız (tıklanabilir, hover'da büyür, seçili: sarı ⭐, boş: gri ☆)
  2. "Gıda Kalitesi" — 5 yıldız
  3. "Porsiyon Doğruluğu" — 5 yıldız
  4. "İletişim & Samimiyet" — 5 yıldız

- Yorum textarea (placeholder: "Deneyimini paylaş... (opsiyonel)", max 300 karakter)
- Fotoğraf ekle butonu (opsiyonel, maks 2)
- "Gönder" butonu (bg-[#2D6A4F] text-white)
```

---

## WEB-20: 404 / Boş Durum Sayfası

```
Ekran: Sayfa Bulunamadı veya İçerik Yok durumları

Tam ekran, merkezde:
- Büyük illüstrasyon (üzgün sebze/meyve karakteri)
- "Aradığın sayfayı bulamadık" veya "Henüz burada bir şey yok" başlık
- Açıklama metni (text-gray-500)
- "Ana Sayfaya Dön" butonu (bg-[#2D6A4F] text-white rounded-xl)
```

---

---

# 📱 BÖLÜM 2 — MOBİL UYGULAMA EKRANLARI

---

## MOB-01: Splash Screen

```
Ekran: Uygulama Açılış Ekranı

Layout: Tam ekran, merkezde logo.

- Arka plan: Beyaz (#FFFFFF)
- Merkezde: GıdaKöprüsü logosu (yeşil yaprak ikonu, animasyonlu — fade in + slight scale)
- Altında: "GıdaKöprüsü" yazısı (font-bold text-[#2D6A4F])
- En altta: Minimal loading indicator (3 dot pulse animasyonu, yeşil)

Süre: 2 saniye, ardından Onboarding veya Giriş ekranına geçiş (fade transition).
```

---

## MOB-02: Onboarding (3 Sayfa)

```
Ekran: İlk Kurulumda Tanıtım Slaytları (3 sayfa, swipe ile geçiş)

Layout: Tam ekran, swipe kaydırmalı. Alt kısımda dot indicator + butonlar.

Sayfa 1:
- Büyük illüstrasyon: Gıda kurtarma temalı (sebze/meyve + kalp)
- Başlık: "Gıda İsrafına Son!" (text-2xl font-bold text-[#1B4332])
- Açıklama: "Yakınındaki işletmelerin fazla gıdalarını keşfet" (text-gray-500)

Sayfa 2:
- İllüstrasyon: Harita üzerinde pinler
- Başlık: "Keşfet & Kurtar"
- Açıklama: "Harita üzerinde yakınındaki fırsatları bul, tek tıkla rezerve et"

Sayfa 3:
- İllüstrasyon: Dünya + yaprak
- Başlık: "Gezegene Katkı Sağla"
- Açıklama: "Her kurtardığın porsiyon karbon ayak izini azaltır"

Alt Kısım:
- Dot indicator (3 dot, aktif: bg-[#2D6A4F] w-8, pasif: bg-gray-300 w-2)
- "Atla" linki (sol alt, text-gray-400)
- "İleri" / "Başla" butonu (sağ alt, bg-[#2D6A4F] text-white rounded-full px-8 py-3)
```

---

## MOB-03: Giriş Ekranı (Login)

```
Ekran: E-posta / Telefon ile Giriş

Layout: Tam ekran, üstte logo, ortada form, altta sosyal giriş.

- Üstte (SafeArea): Logo + "GıdaKöprüsü" yazısı (merkezde)
- Altında: "Hoş Geldin 👋" (text-2xl font-bold)
- "Gıda israfına birlikte son verelim" (text-gray-500 text-sm)

- Form:
  - Segment kontrol: "E-posta" | "Telefon" (iki seçenek, toggle style)
  - Input alanı: Büyük, rounded-2xl, bg-gray-50, px-5 py-4
    - E-posta seçiliyse: Mail ikonu + placeholder "ornek@email.com"
    - Telefon seçiliyse: +90 prefix + placeholder "5XX XXX XX XX"
  - "Doğrulama Kodu Gönder" butonu (w-full bg-[#2D6A4F] text-white rounded-2xl py-4 font-semibold text-lg)

- Altta (opsiyonel — Faz 2):
  - "veya" ayracı
  - Google ile Giriş butonu (outline, Google logosu)
  - Apple ile Giriş butonu (siyah, Apple logosu)

- En altta: "Devam ederek Kullanım Koşullarını kabul edersiniz" (text-xs text-gray-400)
```

---

## MOB-04: OTP Doğrulama Ekranı

```
Ekran: 6 Haneli Doğrulama Kodu Girişi

Layout: Tam ekran, merkezde.

- Üstte: Geri butonu (← ok)
- Başlık: "Doğrulama Kodu" (text-xl font-bold)
- Alt başlık: "kod@email.com adresine gönderilen 6 haneli kodu girin" (text-gray-500 text-sm)

- 6 adet OTP kutusu (flex gap-3, merkezde):
  - Her kutu: w-12 h-14 rounded-2xl border-2 border-gray-200 text-center text-2xl font-bold
  - Focus durumu: border-[#2D6A4F] bg-[#F0FFF4]
  - Dolduğunda: bg-[#F0FFF4] border-[#52B788]
  - Otomatik tab geçişli, yapıştırma (paste) destekli

- Geri sayım: "2:47" (text-[#52B788] font-mono text-lg)
- "Kodu tekrar gönder" linki (geri sayım bitince aktifleşir, text-[#2D6A4F] font-medium)

- "Doğrula" butonu (w-full bg-[#2D6A4F] text-white rounded-2xl py-4 font-semibold)
  - Tüm kutular doldurulunca otomatik submit
  - Loading durumunda: Spinner animasyonu

- Klavye: Sayısal klavye otomatik açılır (keyboardType="number-pad")
```

---

## MOB-05: Ana Sayfa — Harita & Keşif (Tab 1)

```
Ekran: Ana Keşif Ekranı (Harita + Alt Liste)

Layout: Tam ekran harita + Alt tarafta kaydırılabilir liste sheet.

Üst Kısım (Harita — %60 ekran):
- react-native-maps ile native harita
- Kullanıcı konumu: Mavi pulsating dot
- Yakındaki ilan pin'leri:
  - 🟢 Yeşil: Ücretsiz
  - 🟡 Sarı: İndirimli
  - 🔵 Mavi: Toplu Bağış
- Pin'e dokunma: Küçük popup (callout) — ilan özeti + "Detay" butonu
- Sağ üstte: "Konumuma Dön" butonu (beyaz daire, konum ikonu)
- Sol üstte: Filtre butonu (beyaz daire, filtre ikonu, aktif filtre varsa yeşil dot)

Üst Arama Çubuğu (Harita üzerinde floating):
- rounded-full bg-white shadow-lg px-5 py-3
- Arama ikonu + "Konum veya yemek ara..." placeholder
- Sağ tarafta: Filtre ikonu

Alt Sheet (Bottom Sheet — sürüklenebilir):
- Varsayılan: Ekranın %40'ı, yukarı sürükleyince tam ekran
- Handle bar: w-10 h-1 bg-gray-300 rounded-full (üstte, merkezde)
- İçerik: Yatay kategori chip'leri (scroll) + Dikey ilan kartları listesi

Kategori Chip'leri (Yatay scroll):
- "Tümü", "🍞 Ekmek", "🍲 Yemek", "🧁 Tatlı", "🥗 Meyve", "🧀 Süt"
- Aktif: bg-[#2D6A4F] text-white, Pasif: bg-gray-100 text-gray-600

İlan Kartları (Dikey liste):
- Her kart: bg-white rounded-2xl shadow-sm p-3 mb-3 flex flex-row gap-3
  - Sol: Fotoğraf (w-24 h-24 rounded-xl)
  - Sağ üst: Başlık (font-semibold text-[#1B4332]) + İşletme adı (text-xs text-gray-400)
  - Sağ alt: "📍 1.2 km" + "⏰ 45 dk" geri sayım + Fiyat badge
  - Sağ en alt: Mini progress bar (kalan süre oranı)
```

---

## MOB-06: İlan Detay Ekranı

```
Ekran: Gıda İlanı Detay (Tam Ekran, Scroll)

Layout: ScrollView, üstte büyük fotoğraf, altta bilgiler, en altta sabit buton.

Üst Fotoğraf:
- Tam genişlik fotoğraf (h-72), parallax scroll efekti
- Sol üstte: Geri butonu (beyaz daire, blur arka plan)
- Sağ üstte: Favori kalp butonu (beyaz daire)
- Sağ altta: Fiyat badge ("Ücretsiz" veya "₺25" — bg-[#2D6A4F]/90 text-white rounded-full px-4 py-2 backdrop-blur)
- Fotoğraf sayısı: Sol altta "1/4" göstergesi (birden fazla fotoğraf varsa swipe)

İçerik:
- Kategori chip + Başlık + İşletme bilgisi (logo + ad + puan)
- Geri sayım kartı: bg-[#F0FFF4] rounded-2xl p-4
  - "Son Teslim Alma" + Büyük geri sayım "01:24:30" + ince progress bar
- Bilgi grid'i (2×2): Porsiyon, Ağırlık, Teslim Saatleri, Saklama
- Açıklama metni
- Alerjen/Diyet chip'leri
- İşletme kartı (dokunulabilir, işletme profiline git)
- Mini harita (teslim noktası) + "Yol Tarifi" butonu
- Değerlendirmeler özet (⭐ 4.8 — 125 yorum, "Tümünü Gör")

Sabit Alt Bar (Sticky Bottom):
- bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.05)] px-5 py-3 (SafeArea)
- Sol: Fiyat bilgisi
- Sağ: "Rezerve Et" butonu (bg-[#2D6A4F] text-white rounded-2xl px-8 py-4 font-semibold)
- Buton dokunulduğunda: Hafif haptic feedback (impact) + onay bottom sheet açılır
```

---

## MOB-07: Rezervasyon Onay Bottom Sheet

```
Ekran: Rezerve Et onayı (Bottom Sheet Modal)

Layout: Alt taraftan yukarı kayan bottom sheet (rounded-t-3xl bg-white shadow-2xl)

İçerik:
- Handle bar (üstte)
- İlan özet kartı: Küçük fotoğraf + Başlık + İşletme + Fiyat (readonly özet)
- Ayraç
- Teslim bilgileri:
  - 📍 Teslim Adresi
  - ⏰ Teslim Saatleri: "19:00 — 21:00"
- Uyarı notu: bg-amber-50 rounded-xl p-3 — "⚠️ Teslim almamanız durumunda no-show kaydı oluşur" (text-xs)
- "Rezerve Et" butonu (w-full bg-[#2D6A4F] text-white rounded-2xl py-4 font-bold text-lg)
- "İptal" linki (text-gray-400)

Onay sonrası: Sheet kapanır, başarı animasyonu + QR Kod ekranına (MOB-08) geçiş.
```

---

## MOB-08: QR Kod & Teslimat Kodu Ekranı

```
Ekran: Rezervasyon QR Kodu Gösterme

Layout: Tam ekran, merkezde QR.
Ekran parlaklığı otomatik %100'e çıkar.

- Üstte: Geri butonu + "Teslimat Kodu" başlık
- Yeşil başarı banner: "Rezervasyonun hazır! 🎉" (bg-[#F0FFF4] rounded-2xl p-4)

- Merkezde QR Kod kartı (bg-white rounded-3xl shadow-lg p-6):
  - QR Kod (180x180, siyah-beyaz, yeşil çerçeve)
  - Altında: Teslimat Kodu "AK7M2X" (text-4xl font-mono font-bold text-[#2D6A4F] tracking-widest)
  - "Kodu işletmeye gösterin" (text-sm text-gray-500)

- Teslim bilgileri kartı:
  - 🏪 İşletme adı
  - 📍 Adres (dokunulunca harita uygulaması açılır)
  - ⏰ Teslim saatleri + geri sayım

- İki buton (yan yana):
  - "Yol Tarifi" (outline, sol — Maps uygulamasını açar)
  - "Paylaş" (outline, sağ — Screenshot paylaşımı)

- En altta: "İptal Et" linki (text-red-400 text-sm)
```

---

## MOB-09: Rezervasyonlarım Ekranı (Tab 3)

```
Ekran: Kullanıcının Rezervasyonları (Segment Control ile filtreleme)

Layout: Tam ekran, üstte segment control + altında liste.

Segment Control:
- "Aktif" (badge: 2) | "Tamamlanan" | "İptal"
- Aktif segment: bg-[#2D6A4F] text-white rounded-xl
- Container: bg-gray-100 rounded-xl p-1

Aktif Kartlar:
- Her kart: bg-white rounded-2xl p-4 shadow-sm mb-3
  - Üst satır: Rezervasyon no + Durum badge (yeşil "Aktif")
  - Fotoğraf (küçük, rounded) + Başlık + İşletme + Tarih
  - Geri sayım: Canlı (text-[#2D6A4F] font-mono font-bold)
  - "QR Göster" butonu (tam genişlik, bg-[#2D6A4F] text-white rounded-xl py-3)

Tamamlanan Kartlar:
  - Değerlendir butonu (eğer değerlendirme yapılmadıysa)

Boş Durum: Sevimli illüstrasyon + "Henüz rezervasyonun yok" + "Keşfet" butonu
```

---

## MOB-10: Bildirimler Ekranı (Tab 4)

```
Ekran: Bildirim Listesi

Layout: SafeArea, üstte başlık, altında scroll liste.

- Üstte: "Bildirimler" başlık + "Tümünü Oku" linki (sağ üst)

- Bildirim öğeleri:
  - flex flex-row gap-3 px-4 py-3.5
  - Sol: Renkli ikon dairesi (w-10 h-10 rounded-full, içinde ikon)
    - Yeşil: Yeni ilan, Teslim onay
    - Mavi: Rezervasyon bilgisi
    - Sarı: Uyarı, Geri sayım
    - Mor: Rozet kazanımı
  - Orta: Başlık (font-medium text-[#1B4332]) + Açıklama (text-sm text-gray-500) + Zaman (text-xs text-gray-400)
  - Okunmamış: bg-[#F0FFF4] + sağda küçük yeşil dot

- Swipe aksiyonları:
  - Sola kaydır: "Sil" (kırmızı arka plan)
  - Sağa kaydır: "Okundu" (yeşil arka plan)
```

---

## MOB-11: Profil Ekranı (Tab 5)

```
Ekran: Kullanıcı Profili ve Ayarlar

Layout: ScrollView

Üst Kısım (Profil Header):
- bg-[#F0FFF4] rounded-b-3xl pb-6 pt-2
- Merkezde: Büyük avatar (w-24 h-24 rounded-full, border-4 border-white shadow-md)
- Üzerinde kamera ikonu (düzenle)
- Ad Soyad (text-xl font-bold text-[#1B4332])
- E-posta (text-sm text-gray-500)
- Mini stat satırı (flex gap-8): "12.5 kg kurtarıldı" | "3 rozet" | "⭐ 4.9"

Menü Grupları:
- Grup 1 — "Hesabım":
  - 👤 Kişisel Bilgiler (→)
  - 📍 Adres Bilgileri (→)
  - 🏆 Rozetlerim (→)
  - 📊 Etkiim (→)

- Grup 2 — "Tercihler":
  - 🔔 Bildirim Ayarları (→)
  - 🌙 Karanlık Mod (toggle switch)
  - 🌐 Dil: Türkçe (→)

- Grup 3 — "Destek":
  - ❓ Yardım & SSS (→)
  - 💬 Geri Bildirim Gönder (→)
  - ⭐ Uygulamayı Değerlendir (→)
  - 📜 Gizlilik Politikası (→)

- En altta: "Çıkış Yap" butonu (text-red-500 font-medium)
- Versiyon: "v1.0.0" (text-xs text-gray-300, merkezde)

Her menü öğesi:
- flex justify-between items-center py-4 px-4 border-b border-gray-50
- Sol: İkon + Label
- Sağ: Chevron ikonu (›) veya toggle
- Dokunma: bg-gray-50 active efekti
```

---

## MOB-12: Rozetlerim Ekranı

```
Ekran: Kazanılan ve Kazanılabilecek Rozetler

Layout: ScrollView, grid görünüm.

Üstte: "Rozetlerim" başlık + "3 / 8 rozet kazanıldı"

Kazanılan Rozetler (parlak, renkli):
- Grid (3 sütun)
- Her rozet: Merkezde büyük emoji ikon (text-4xl) + rozet adı (text-xs font-medium) + kazanım tarihi (text-xs text-gray-400)
- Hafif glow efekti (shadow-[#52B788]/30)

Kazanılabilecek Rozetler (gri tonlu, opacity-50):
- Aynı grid yapı ama soluk
- Altında: İlerleme çubuğu (progress bar) + "3/10 teslim" yazısı
- Dokunulunca bottom sheet: Rozet detayı + koşulları + ilerleme
```

---

## MOB-13: İşletme — Mobil Dashboard

```
Ekran: İşletme Sahibi/Personeli Mobil Ana Sayfası

Layout: ScrollView

Üst Kısım:
- "Lezzet Fırını" + Güven skoru (küçük circular progress)
- "Merhaba, Mehmet 👋"

Hızlı Aksiyonlar (2×2 grid):
- ➕ Yeni İlan (büyük, bg-[#2D6A4F] text-white)
- 📋 Aktif İlanlar (3)
- 📦 Bekleyen Teslimler (5)
- 📊 İstatistikler

Bugünün Özeti Kartı:
- bg-[#F0FFF4] rounded-2xl p-4
- "Bugün: 8.5 kg kurtarıldı | 12 porsiyon teslim edildi"

Son Gelen Rezervasyonlar:
- Mini liste (son 5), her biri dokunulabilir
- Durum badge + Alıcı adı + İlan + Geri sayım
```

---

## MOB-14: İşletme — QR Tarama Ekranı

```
Ekran: İşletme Personeli — Teslimat QR Kod Tarama

Layout: Tam ekran kamera.

- Kamera: Tam ekran, ortada tarama çerçevesi (köşelerde yeşil L çizgileri)
- Üstte: "Alıcının QR kodunu tarayın" başlık (beyaz, gölgeli text)
- Altında: "veya kodu manuel gir" linki (tıklayınca 6 haneli input açılır)

QR tarama başarılı olduğunda:
- Kamera üzerinde yeşil overlay + ✅ animasyonu
- Haptic feedback (success)
- Bottom sheet açılır: Alıcı bilgileri + İlan + "Teslimi Onayla" butonu

Manuel Kod Girişi (Bottom Sheet):
- 6 haneli input kutuları + "Doğrula" butonu
```

---

## MOB-15: İşletme — Hızlı İlan Oluşturma

```
Ekran: Mobilde Hızlı İlan Oluşturma (Kısaltılmış Form)

Layout: Tam ekran form (ScrollView), alt sabit buton.

- Üstte: "Yeni İlan Oluştur" + Kapatma (X) butonu

- Fotoğraf: Büyük kamera alanı (h-48 rounded-2xl bg-gray-100)
  - Dokunulunca: "Fotoğraf Çek" veya "Galeriden Seç" aksion sheet
  - Çekilen fotoğraflar: Yatay scroll thumbnail listesi

- Hızlı Form:
  - İlan Türü: 3 segment ("Ücretsiz" | "İndirimli" | "Toplu")
  - Başlık input
  - Kategori seçici (bottom sheet picker)
  - Porsiyon sayısı (stepper: - 5 +)
  - Teslim saatleri (time picker)
  - Açıklama (kısa textarea)
  - Alerjen seçimi (chip'ler, dokunarak toggle)

- Sabit Alt Bar:
  - "Taslak Kaydet" (outline, sol)
  - "Yayınla" (bg-[#2D6A4F] text-white, sağ)
```

---

## MOB-16: Etki (Impact) Ekranı

```
Ekran: Kişisel Sosyal Etki Özeti

Layout: ScrollView, görsel ağırlıklı.

Üstte: Animasyonlu başlık: "Senin Etkin 🌍"

Ana Metrik Kartları (dikey, tam genişlik):
- 🌿 "12.5 kg gıda kurtardın" (büyük sayı + animasyonlu artış)
- 🌍 "31.2 kg CO₂ önledin" (eşdeğer: "1.4 ağaç")
- 💧 "12.500 L su tasarrufu"
- 🍽️ "42 porsiyon dağıtıldı"

Her kart: bg-gradient (beyazdan çok açık yeşile) + büyük emoji + metrik + alt açıklama

Mini İnfografik:
- "Senin etkin bir haftada..." — illüstrasyon ile gösterim
- Eşdeğerlikleri göster: "3 ağaç dikmiş kadar", "500 km araba kullanmamış kadar"

Altta: "Paylaş" butonu (sosyal medyada paylaşılabilir etki kartı oluşturur)
```

---

---

# 🔄 BÖLÜM 3 — WEB ↔ MOBİL EKRAN EŞLEŞTİRME MATRİSİ

| # | Ekran | Web Kodu | Mobil Kodu | Notlar |
|---|-------|----------|------------|--------|
| 1 | Giriş / Login | WEB-01 | MOB-03 | Mobilde sosyal giriş opsiyonel |
| 2 | OTP Doğrulama | WEB-01 (aynı sayfa) | MOB-04 | Mobilde ayrı ekran |
| 3 | Onboarding | — | MOB-02 | Sadece mobilde |
| 4 | Alıcı Dashboard | WEB-02 | MOB-05 (Harita tab) | Web'de sidebar, mobilde tab |
| 5 | Harita & Keşif | WEB-03 | MOB-05 | Mobilde tam ekran harita |
| 6 | İlan Detay | WEB-04 | MOB-06 | Benzer yapı |
| 7 | Rezervasyon Onay | WEB-05 | MOB-07 + MOB-08 | Mobilde bottom sheet + QR ekranı |
| 8 | Rezervasyonlarım | WEB-06 | MOB-09 | Benzer |
| 9 | Bildirimler | WEB-18 | MOB-10 | Mobilde swipe aksiyonlar |
| 10 | Profil & Ayarlar | WEB-07 | MOB-11 | Mobilde native liste stili |
| 11 | Rozetler | WEB-07 (sekme) | MOB-12 | Mobilde ayrı ekran |
| 12 | Değerlendirme | WEB-19 | MOB-06 (modal) | Mobilde bottom sheet |
| 13 | Liderlik Tablosu | WEB-17 | MOB-16 alt | Web'de tam sayfa |
| 14 | Etki Dashboard | WEB-11 | MOB-16 | Mobilde görsel ağırlıklı |
| 15 | İşletme Dashboard | WEB-08 | MOB-13 | Mobilde basitleştirilmiş |
| 16 | İlan Oluşturma | WEB-09 | MOB-15 | Mobilde kısa form + kamera |
| 17 | Teslimat Onayı | WEB-10 | MOB-14 | Mobilde QR kamera tarama |
| 18 | İşletme İstatistik | WEB-11 | MOB-13 (sekme) | Mobilde özet |
| 19 | STK Dashboard | WEB-12 | — | Sadece web (mobil Faz 2) |
| 20 | Admin Dashboard | WEB-13 | — | Sadece web |
| 21 | Admin İşletme Yön. | WEB-14 | — | Sadece web |
| 22 | Admin Raporlar | WEB-15 | — | Sadece web |
| 23 | Admin Kategoriler | WEB-16 | — | Sadece web |
| 24 | 404 / Empty State | WEB-20 | — | Her ekranda inline |
| 25 | Splash | — | MOB-01 | Sadece mobil |

---

> **Bu doküman, GıdaKöprüsü'nün Web (20 ekran) ve Mobil (16 ekran) uygulamaları için tüm ekran tasarım promptlarını içermektedir.**  
> Her promptu AI tasarım aracına (v0, Bolt, Lovable, ChatGPT, Figma AI vb.) verebilirsin.  
> Promptların başına mutlaka "Genel Tasarım Sistemi Promptu"nu eklemeyi unutma.
