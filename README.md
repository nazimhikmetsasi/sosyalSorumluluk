# 🌿 GıdaKöprüsü — Sıfır İsraf & Gıda Kurtarma Sosyal Platformu

<div align="center">

![GıdaKöprüsü Banner](https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1200&auto=format&fit=crop&q=80)

[![React 19](https://img.shields.io/badge/React-19.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4.3-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Leaflet](https://img.shields.io/badge/Leaflet-1.9-199900?style=for-the-badge&logo=leaflet&logoColor=white)](https://leafletjs.com/)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-0F5238?style=for-the-badge&logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)

**Türkiye'nin ilk bütünleşik, sıfır israf odaklı gıda kurtarma ve dayanışma ekosistemi.**

[Canlı Özellikler](#-temel-özellikler) • [4 Farklı Rol](#-4-farklı-kullanıcı-rolü) • [Teknoloji Yığını](#-teknoloji-yığını) • [Kurulum & Çalıştırma](#-kurulum--çalıştırma)

</div>

---

## 📌 Projenin Amacı ve Vizyonu

Türkiye'de her yıl yaklaşık **26 milyon ton taze gıda** israf edilmektedir. **GıdaKöprüsü**, gün sonunda fırın, restoran, manav ve otellerde satılmamış fakat tamamen taze ve hijyenik gıdaları:
1. **İhtiyaç sahiplerine %100 Ücretsiz** ulaştırır,
2. **Vatandaşlara %50-%70 indirimli sürpriz kurtarma paketleri** olarak sunar,
3. **Toplu fazla yemekleri STK ve Aşevlerine soğuk zincir lojistiği ile** yönlendirir.

---

## ✨ Temel Özellikler

### 🗺️ 1. İnteraktif Harita & Canlı Rota Simülasyonu (Leaflet / OSM)
- İstanbul genelindeki (Kadıköy, Moda, Caferağa, Beşiktaş, Karaköy, Üsküdar) fırın ve restoranların gerçek GPS konumları.
- Kullanıcının anlık konumundan işletmeye giden **interaktif yürüyüş rotası çizgisi (Polyline)** ve tahmini dakika/mesafe göstergesi.

### 📱 2. Mobil-Öncelikli Tasarım (390px Çift Frame & 2'li Grid)
- iOS ve Android simülatörü moduyla mobil cihaz deneyimi.
- Tüm ürün ve rapor kartlarında mobil ekrana tam oturan modern **2'li grid** mimarisi.

### 📲 3. PWA (Progressive Web App) Desteği
- `manifest.json` ve `sw.js` (Service Worker) ile tarayıcı üzerinden telefona **"Ana Ekrana Ekle"** butonuyla yüklenebilir.
- Çevrimdışı (offline) önbellekleme desteği.

### 🎟️ 4. 4 Haneli Kod & Canlı Kamera QR Kod Teslimatı
- Müşteriye özel üretilen dinamik 4 haneli PIN (`GK-7482`) ve SVG QR kod.
- İşletme personelinin akıllı telefon kamerasıyla canlı QR tarayıp teslimatı anında onaylayabilmesi.

### 🏆 5. Gamification & 9:16 Instagram Story Kartı
- Kurtarılan kg gıda ve engellenen CO₂ metrikleriyle seviye atlama ve rozetler.
- Tek tıkla sosyal medyada paylaşmaya hazır **9:16 Instagram Story Kartı** ve resmi **Sıfır İsraf Sertifikası**.

### 🌐 6. Çoklu Dil (TR / EN) & 🌙 Karanlık Mod (Dark Mode)
- Tek tıkla Türkçe ve İngilizce arayüz geçişi.
- Göz yormayan koyu yeşil / antrasit gece teması.

---

## 👥 4 Farklı Kullanıcı Rolü

| Rol | Yetkiler & Özellikler |
| :--- | :--- |
| **🌱 Alıcı / Gönüllü** | İndirimli veya ücretsiz paketleri keşfetme, haritada bulma, anlık rezervasyon, QR kod ve rozetler. |
| **🏪 İşletme / Fırın** | Hızlı ilan oluşturma, canlı porsiyon artırma/azaltma (+ / -), bekleyen siparişleri QR ile onaylama. |
| **🤝 STK & Aşevi** | Otel ve restoranlardan gelen 50+ porsiyonluk toplu bağışları kabul etme, soğuk zincir araç filosu atama. |
| **🛡️ Yönetici (Admin)** | İşletme ruhsat & hijyen denetimi, canlı güven skoru düzenleyici, gerçek CSV veri raporları indirme. |

---

## 🛠️ Teknoloji Yığını

- **Frontend:** React 19, Vite, Tailwind CSS v4
- **Harita:** Leaflet, React-Leaflet, OpenStreetMap
- **Görsel & Efektler:** Canvas Confetti, Web Audio API Sound Effects, Lucide React Icons
- **QR & Doğrulama:** `qrcode.react`
- **PWA:** Web App Manifest, Service Worker Cache API

---

## 🚀 Kurulum & Çalıştırma

Projeyi yerel bilgisayarınızda çalıştırmak için:

```bash
# 1. Depoyu klonlayın
git clone https://github.com/nazimhikmetsasi/sosyalSorumluluk.git

# 2. Proje dizinine geçin
cd sosyalSorumluluk

# 3. Bağımlılıkları yükleyin
npm install

# 4. Geliştirme sunucusunu başlatın
npm run dev
```

Tarayıcınızda `http://localhost:5173` adresine giderek uygulamayı deneyimleyebilirsiniz.

---

## 📄 Lisans

Bu proje **MIT Lisansı** ile lisanslanmıştır. Sosyal fayda ve sıfır israf amacıyla geliştirilmiştir.
