**OVERALL DESIGN SYSTEM:**
- Use a clean, modern aesthetic inspired by the first reference image (light beige/cream background #F5F5F0, dark green sidebar #1B4332, soft pink accents #FFB7B2 for CTAs and highlights).
- Typography: Inter or similar sans-serif. Headlines bold, body text regular.
- Rounded corners: 12px for cards, 8px for buttons, 16px for modals.
- Shadows: Soft drop shadows for cards (0 4px 20px rgba(0,0,0,0.08)).

**LAYOUT STRUCTURE - DESKTOP (1440px):**
- Left Sidebar: Fixed width 280px. Dark green background (#1B4332).
  - Top: Logo "beautrics" in white, elegant font.
  - Navigation items with icons: "Anasayfa" (Home), "AI Asistan" (Sparkle icon), "Sepet Optimizasyonu" (Shopping bag icon), "Favorilerim" (Heart icon).
  - Bottom section: "Profil" (User icon), "Çıkış Yap" (Log out icon).
  - Active state: Light green background pill (#2D6A4F) with white text. Inactive: white/gray text.
  
- Main Content Area: Flexible width, light beige background (#F5F5F0).
  - Top bar: Search input (rounded, white), notification bell, user avatar.

**PAGE 1: HOMEPAGE - PRODUCT GRID (Default View):**
- Header: "Tüm Ürünler" title with "4 Markette Karşılaştır" subtitle.
- Filter bar: Category pills (Cilt Bakımı, Makyaj, Saç Bakımı, Parfüm) - horizontal scrollable.
- Product Grid: 4 columns, 24px gap.
- Product Cards (CRITICAL - Mix both reference images):
  - Card background: White with subtle gradient overlay at bottom (purple to blue gradient like second image, but softer).
  - Top: Product image (centered, 200px height), discount badge top-right (-%75 in pink pill).
  - Middle: Brand name (small, gray), Product name (bold, dark, 2 lines max).
  - Bottom: Price comparison section - horizontal stacked bars/divs for each store:
    - Store name on left (Gratis, Rossmann, Watsons, Mion), price on right.
    - Color coding: Gratis (teal), Rossmann (red), Watsons (blue), Mion (gray).
    - Highlight the cheapest price with a "EN UCUZ" badge.
  - Hover state: Card lifts with shadow, "Detay →" link appears bottom-right.
  - Action buttons: Heart icon (top-left, add to favorites), "Sepete Ekle" button (bottom, green).

**PAGE 2: AI CHAT INTERFACE:**
- Overlay/Slide-out panel from sidebar click.
- Chat header: "AI Cilt Bakım Asistanı" with green dot status indicator.
- Message bubbles: 
  - User: White background, right-aligned, rounded.
  - AI: Light green tint (#E8F5E9), left-aligned, rounded.
- Initial greeting: "Merhaba! Sana özel bir cilt bakım rutini oluşturmamı ister misin?"
- When user asks for routine: AI responds with a structured routine card containing:
  - 3-step routine (Temizleyici, Nemlendirici, Güneş Kremi).
  - Each step: Product image thumbnail, name, price, "Sepete Ekle" checkbox.
  - Budget tracker: Horizontal progress bar (pink to green) showing "₺487 / ₺500 bütçe".
- Below routine: "SEPET OPTİMİZASYONU" section showing:
  - Store comparison table: 4 columns (Watsons, Gratis, Rossmann, Mion).
  - Each row: Store logo, total price, shipping info.
  - "Maksimum Tasarruf" row highlighted in light pink with savings amount.
  - "Zamanlama Önerisi" row showing "4 gün içinde %15 düşüş bekleniyor".

**PAGE 3: ONBOARDING MODAL (Pop-up):**
- Centered modal, 600px width, white background, rounded-2xl.
- Title: "Profilini Oluştur" with subtitle "Sana özel öneriler için cilt tipini öğrenmem gerek".
- Step 1: Cilt Tipi - Multi-select chips (Kuru, Yağlı, Karma, Hassas, Normal). Multiple selection allowed.
- Step 2: Saç Tipi - Multi-select chips (Kuru, Yağlı, Normal, Boyalı, Yıpranmış).
- Step 3: Cilt Sorunları - Multi-select chips (Akne, Kırışıklık, Lekeler, Siyah Nokta, Kızarıklık, Gözenek).
- Step 4: Bütçe - Slider input (100₺ - 2000₺).
- Bottom: "Daha Sonra" (skip, ghost button) + "Kaydet ve Devam Et" (primary green).
- If triggered from chat: Modal appears inline within chat as an interactive message card.

**PAGE 4: SEPET OPTİMİZASYONU (Cart Optimization):**
- Full page view.
- Left side: Selected products list (draggable cards with product image, name, quantity selector, delete icon).
- Right side: Optimization results panel.
  - "En Uygun Sepet" header.
  - Store breakdown cards: Each store shows which products to buy from there, subtotal, shipping cost.
  - Total savings calculator with green highlight.
  - "Favorilere Ekle" and "Paylaş" buttons.
  - Commission disclosure: "Bu öneriler iş birlikleri içerebilir" small text.

**PAGE 5: FAVORILER:**
- Grid of favorited products.
- Each card shows: Product image, name, current price vs. added price.
- "Fiyat Düşünce Haber Ver" toggle switch.
- Price drop history mini-chart.

**PAGE 6: PERSONALIZED SLIDER (For Logged-in Users):**
- On homepage, below hero: "Sana Uygun Ürünler" horizontal carousel.
- Large product cards (400px width) with gradient backgrounds.
- "Komisyonlu İçerik" badge for sponsored products (small, subtle).
- Navigation arrows and dot indicators.

**COMPONENTS TO CREATE:**
- ProductCard (with store price bars)
- ChatMessage (user and AI variants)
- OnboardingStep (modal content)
- PriceBar (store comparison mini-component)
- SidebarNav (with active states)
- BudgetProgressBar
- OptimizationTable

**INTERACTIONS & STATES:**
- Sidebar hover: Light green background transition.
- Product card hover: Scale 1.02, shadow increase.
- Add to cart: Green toast notification "Sepete eklendi".
- Favorite toggle: Heart fills with pink animation.
- Chat typing indicator: Three bouncing dots.
- Onboarding chip selection: Green background when selected, gray when unselected.

**RESPONSIVE NOTES:**
- Mobile: Sidebar becomes bottom tab bar.
- Product grid: 2 columns on tablet, 1 on mobile.
- Chat becomes full-screen overlay on mobile.

**COLOR PALETTE:**
- Primary Green: #1B4332 (sidebar), #2D6A4F (buttons)
- Accent Pink: #FFB7B2 (badges, highlights, savings)
- Background: #F5F5F0 (main), #FFFFFF (cards)
- Text: #1A1A1A (headings), #666666 (body)
- Store Colors: Gratis #00B4D8, Rossmann #E63946, Watsons #0077B6, Mion #6C757D
- Success: #52B788, Warning: #F4A261

**SPECIAL NOTES:**
- Turkish language throughout all UI text.
- Currency: ₺ (Turkish Lira).
- All prices should show two decimal places.
- "Sahte İndirim" section should NOT exist anywhere in the design.
- Commission-based products should have subtle "Öne Çıkan" badge, not intrusive