MARKA & ESTETİK
Marka adı: beautrics (küçük b harfi, "beautr" siyah + "ics" turkuaz #30D5C8)
İlham kaynağı: Beautrics.com.tr (eczane reçetesi estetiği + kozmetik fiyat karşılaştırma)
Hissiyat: Güvenilir, bilimsel, temiz, profesyonel ama sıcak
"Reçete" metaforu: Ürünler numaralı adımlarla listelenir (01, 02, 03...)
RENK PALETİ
Table
Token	Hex	Kullanım
Primary	#30D5C8	Butonlar, etiketler, EN UCUZ badge, slider accent, linkler
Primary Light	#E8FAF9	Hover arka planları, turkuaz vurgu alanları, summary kart arka planı
Primary Dark	#1FA89E	Hover durumları, aktif durumlar
Background	#FAFAF5	Sayfa arka planı (hafif krem tonlu)
Card BG	#FFFFFF	Kart arka planları, modal arka planları
Border	#E8E4DC	Tüm kart borderları, divider'lar, input borderları
Text Primary	#2D2D2D	Başlıklar, ana metinler
Text Secondary	#6B6B6B	Açıklamalar, alt metinler
Text Muted	#9E9E9E	Placeholder, metadata, tarihler
Accent Pink	#E85A71	Favori ikonu, fiyat düşüşü bildirimleri, hassas cilt etiketi
Accent Pink Light	#FDE8EC	Hassas cilt etiketi arka planı
Accent Green	#4CAF50	Tasarruf metni, uygunluk etiketi (yeşil), online durum
Accent Green Light	#E8F5E9	Uygunluk etiketi arka planı
Accent Yellow	#F5A623	Zamanlama önerisi, uyarı kartları
Accent Yellow Light	#FFF8E1	Zamanlama önerisi arka planı
TİPOGRAFİ
Font ailesi: Inter (Google Fonts)
Logo: 20px, weight 800, letter-spacing -0.8px
Sayfa başlıkları: 18px, weight 700
Kart başlıkları: 14px, weight 700
Body metin: 13px, weight 400, line-height 1.6
Metadata: 11px, weight 500, uppercase, letter-spacing 0.5px
Fiyat: 14-15px, weight 800
Badge: 9-10px, weight 700, uppercase
LAYOUT YAPISI
plain
┌──────────────────────────────────────────────────────────────┐
│  beautrics        [🔍 Arama]              🤖  🔔  👤 AY     │  Header (56px)
├──────────┬───────────────────────────────────────────────────┤
│          │  ✨ Sana Uygun Ürünler  ← Yatay Slider           │
│  🏠 Ana  │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                │
│     Sayfa│  │Ürün │ │Ürün │ │Ürün │ │Ürün │                │
│          │  │  1  │ │  2  │ │  3  │ │  4  │                │
│  🤖 AI   │  └─────┘ └─────┘ └─────┘ └─────┘                │
│  Chatbot │                                                   │
│          │  🔥 Tüm Ürünler                                    │
│  🛒 Sepet│  ┌─────────────┐ ┌─────────────┐                │
│  Opt. (3)│  │ [GÖRSEL]   │ │ [GÖRSEL]   │                │
│          │  │ The Ordinary│ │ Maybelline │                │
│  ⭐ Fav. │  │ hassas cilt│ │            │                │
│   (2)    │  │             │ │            │                │
│          │  │ Watsons ₺249│ │Watsons ₺189│                │
│  ────────│  │ Gratis ₺239⭐│ │Gratis ₺195 │                │
│          │  │ Rossmann ₺245│ │Ross.₺179⭐│                │
│  👤 Prof.│  │ Migros ₺255 │ │Migros ₺185 │                │
│  🚪 Çıkış│  │ [🛒 Sepete] │ │ [🛒 Sepete]│                │
│          │  └─────────────┘ └─────────────┘                │
└──────────┴───────────────────────────────────────────────────┘
Sidebar: 220px genişlik, beyaz arka plan, sağ border #E8E4DC
Header: 56px yükseklik, beyaz arka plan, alt border #E8E4DC
Content: padding 28px, krem arka plan #FAFAF5
Chat Panel: Fixed sağ alt, 380px genişlik, 540px yükseklik, 18px border-radius, beyaz arka plan
BİLEŞENLER
1. SIDEBAR NAV ITEM
Padding: 10px 12px, border-radius: 10px
Aktif: arka plan #E8FAF9, yazı #1FA89E, weight 600
Hover: arka plan #E8FAF9, yazı #1FA89E
Pasif: yazı #6B6B6B, weight 500
Badge: arka plan #30D5C8, beyaz yazı, 10px radius, 11px font
2. ÜRÜN KARTI (Ana Sayfa)
Arka plan: #FFFFFF
Border: 1px solid #E8E4DC
Border-radius: 14px
Görsel alanı: 100% x 190px, #F0EDE5 placeholder arka plan
Favori butonu: sağ üst, 34px daire, beyaz arka plan, border #E8E4DC
Marka adı: 10px, uppercase, #1FA89E, weight 700, letter-spacing 1px
Ürün adı: 14px, #2D2D2D, weight 700, 2 satır max
Cilt tipi etiketi: 9px, border-radius 6px
Yeşil (hassas cilt için uygun): arka plan #E8F5E9, yazı #4CAF50
Pembe (yağlı cilt için uygun): arka plan #FDE8EC, yazı #E85A71
Fiyat grid'i: 2x2, her hücre border-radius 10px, arka plan #FAFAF5
Normal hücre: border #E8E4DC
En ucuz hücre: border #30D5C8, arka plan #E8FAF9
"EN UCUZ" badge: 9px, #30D5C8 arka plan, beyaz yazı, 4px radius
Butonlar: [🛒 Sepete Ekle] turkuaz dolgu + [🔗] border only
3. SLIDER KARTI
Min-width: 190px, border-radius 14px, padding 16px
Görsel: 130px yükseklik, #F0EDE5 arka plan, 10px radius
"ÖNERİLEN" badge: 9px, #30D5C8 arka plan, beyaz yazı, uppercase
Ürün adı: 13px bold
Marka: 11px #9E9E9E
Fiyat: 15px bold #1FA89E
Hover: translateY(-2px), box-shadow 0 4px 16px rgba(0,0,0,0.06)
4. SEPET OPTİMİZASYONU SAYFASI
Summary kart: border 2px #30D5C8, arka plan #E8FAF9, border-radius 14px
"En Uygun Toplam": 26px bold #1FA89E
"₺120 tasarruf": 14px bold #4CAF50
"En Pahalı": 18px üstü çizili #9E9E9E
Maksimum Tasarruf kartı: border 1px #4CAF50, arka plan #E8F5E9
Label: 12px bold #4CAF50
Açıklama: 13px #6B6B6B
Değer: 18px bold #4CAF50
Zamanlama Önerisi kartı: border 1px #F5A623, arka plan #FFF8E1
Metin: 12px #6B6B6B
Vurgu: #F5A623 bold
Market blokları: border 1px #E8E4DC, arka plan #FAFAF5, border-radius 12px
Header: market adı bold + ürün sayısı gri + toplam fiyat bold #1FA89E
Ürün satırları: border-bottom dashed #E8E4DC, 13px #6B6B6B
Alt link butonları: turkuaz dolgu, tam genişlik, 14px radius
Footer notlar: 12px #9E9E9E, flex-wrap
5. AI CHATBOT PANELİ
Header: border-bottom #E8E4DC, "AI Kozmetik Uzmanı" + yeşil online nokta
Bot mesajı: sol, arka plan #FAFAF5, border #E8E4DC, border-radius 14px
Kullanıcı mesajı: sağ, arka plan #30D5C8, beyaz yazı, border-radius 14px
Inline Onboarding Kart: border #E8E4DC, border-radius 14px
Başlık: 13px bold
Chip'ler: border-radius 20px, border #E8E4DC, 12px font
Seçili chip: arka plan #30D5C8, beyaz yazı
[Kaydet ve Devam Et]: turkuaz dolgu, tam genişlik
Inline Ürün Kartı (chat içinde): border #E8E4DC, border-radius 12px
44px görsel + isim + fiyat #1FA89E + butonlar
Input: arka plan #FAFAF5, border #E8E4DC, border-radius 12px
Gönder butonu: #30D5C8, beyaz yazı, border-radius 12px
FAB butonu: 56px daire, #30D5C8, box-shadow 0 6px 20px rgba(48,213,200,0.35)
6. ONBOARDING MODAL
Overlay: rgba(0,0,0,0.4)
Modal: 460px, arka plan #FFFFFF, border-radius 20px, border 1px #E8E4DC
Başlık: 20px bold #2D2D2D
Açıklama: 13px #9E9E9E
Adım göstergesi: 3 yatay çizgi, aktif #30D5C8, pasif #E8E4DC
Seçenekler: border-radius 12px, border 1px #E8E4DC, padding 11px 20px
Seçili: arka plan #30D5C8, beyaz yazı
[Daha Sonra]: 13px #9E9E9E, border yok
[Devam Et / Tamamla]: #30D5C8, beyaz yazı, border-radius 12px, padding 12px 28px
7. FAVORİLER SAYFASI
Liste item: border 1px #E8E4DC, border-radius 14px, padding 18px
Görsel: 68px x 68px, #F0EDE5 arka plan, border-radius 12px
Ürün adı: 14px bold #2D2D2D
Fiyat: 13px #6B6B6B
Hedef fiyat bildirimi: 12px bold #E85A71
Butonlar: turkuaz dolgu + border only
8. PROFİL SAYFASI
Kart: border 1px #E8E4DC, border-radius 14px, padding 24px
Başlık: 15px bold #2D2D2D
Satır: label #9E9E9E + değer #2D2D2D bold, border-bottom #E8E4DC
Tag'ler: border-radius 8px, arka plan #E8FAF9, yazı #1FA89E, 12px bold
[Düzenle]: turkuaz dolgu, tam genişlik
ETKİLEŞİM AKIŞLARI (Figma Prototype için)
Ana Sayfa → Sepet Optimizasyonu
Ürün kartındaki "🛒 Sepete Ekle" → Sidebar badge +1 animasyonu
Sidebar "Sepet Optimizasyonu" tıklama → Sepet sayfasına geçiş
Chatbot Açma
Header 🤖 veya Sidebar "AI Chatbot" → Chat paneli slide-up animasyonu
FAB butonu gizlenir, panel açılır
Onboarding Flow
İlk giriş → Modal fade-in
Adım 1 (Cilt tipi) → Adım 2 (Saç tipi) → Adım 3 (Sorunlar)
Her adımda chip seçimi → [Devam Et] aktifleşir
"Daha Sonra" → Modal kapanır, onboarding_skipped flag
Chat içinde Onboarding
"Bana rutin öner" → Bot inline onboarding kartı gönderir
Chip seçimi → [Kaydet ve Devam Et] → AI öneri ürün kartları
Favorilere Ekle
♡ → ♥ dönüşümü + kırmızı pulse animasyonu
Sidebar badge +1
RESPONSIVE KIRILMA NOKTALARI
Desktop (>1024px): 4 sütun grid, sidebar açık, chat panel fixed
Tablet (768-1024px): 3 sütun grid, sidebar collapse (icon only)
Mobile (<768px): 1 sütun grid, sidebar hamburger menü, chat full-screen
ÖNEMLİ NOTLAR
❌ Sahte indirim alanı YOK
❌ "%XX indirim", "eski fiyat üstü çizili" manipülasyonu YOK
✅ Sadece gerçek fiyat karşılaştırması
✅ "EN UCUZ" badge sadece en düşük fiyatlı markette
✅ Cilt tipi uygunluk etiketleri ürün kartında görünür
✅ "hassas cilt için uygun" yeşil, "yağlı cilt için uygun" pembe