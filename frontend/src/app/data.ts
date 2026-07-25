export type StoreName = 'Watsons' | 'Gratis' | 'Rossmann' | 'Mion';

export interface StorePrice {
  name: StoreName;
  price: number;
}

export interface Product {
  id: string;
  image: string;
  brand: string;
  title: string;
  category: string;
  attributes?: string[];
  skinTypeNames?: string[];
  tagNames?: string[];
  stores: StorePrice[];
  featured?: boolean;
  featuredLabel?: string;
  history?: { date: string; price: number }[];
}

export const STORE_COLORS: Record<StoreName, { color: string; bg: string; light: string }> = {
  Watsons: { color: '#009AA9', bg: '#009AA9', light: '#E8F2FA' },
  Gratis: { color: '#490E70', bg: '#490E70', light: '#E8F9FD' },
  Mion: { color: '#BDD9DC', bg: '#BDD9DC', light: '#F0F1F2' },
  Rossmann: { color: '#C3002E', bg: '#C3002E', light: '#FDECEC' },
};

export function getCheapestStore(stores: StorePrice[]): StorePrice {
  return stores.reduce((min, s) => (s.price < min.price ? s : min));
}

export function getStoreTotals(items: Product[]): Record<StoreName, number> {
  const totals: Record<StoreName, number> = { Watsons: 0, Gratis: 0, Rossmann: 0, Mion: 0 };
  for (const item of items) {
    for (const s of item.stores) {
      totals[s.name] += s.price;
    }
  }
  return totals;
}

export function getCheapestTotal(items: Product[]): { total: number; breakdown: { product: Product; store: StorePrice }[] } {
  const breakdown = items.map((p) => ({ product: p, store: getCheapestStore(p.stores) }));
  const total = breakdown.reduce((sum, b) => sum + b.store.price, 0);
  return { total, breakdown };
}

// AI Chat sayfası için sabit demo rutin ürünleri (Supabase'e bağımlı değil).
export const ROUTINE_PRODUCTS: Product[] = [
  {
    id: 'demo-p1',
    image: 'https://images.unsplash.com/photo-1746227638992-50b1e1e0d96b?auto=format&fit=crop&w=600&q=80',
    brand: 'CeraVe',
    title: 'Köpüren Temizleyici 236ml',
    category: 'Temizleyici',
    attributes: ['Kuru Ciltler İçin', 'Hyalüronik Asit', 'Seramid'],
    stores: [
      { name: 'Watsons', price: 148 },
      { name: 'Gratis', price: 139 },
      { name: 'Rossmann', price: 152 },
      { name: 'Mion', price: 149 },
    ],
  },
  {
    id: 'demo-p2',
    image: 'https://images.unsplash.com/photo-1748543668676-ea8241cb3886?auto=format&fit=crop&w=600&q=80',
    brand: 'La Roche-Posay',
    title: 'Toleriane Sensitive Nemlendirici 40ml',
    category: 'Nemlendirici',
    attributes: ['Hassas Ciltler İçin', 'Niasinamid', 'Termal Su'],
    stores: [
      { name: 'Watsons', price: 265 },
      { name: 'Gratis', price: 249 },
      { name: 'Rossmann', price: 259 },
      { name: 'Mion', price: 258 },
    ],
  },
  {
    id: 'demo-p3',
    image: 'https://images.unsplash.com/photo-1748543668751-902d6461890d?auto=format&fit=crop&w=600&q=80',
    brand: 'Bioderma',
    title: 'Photoderm MAX SPF50+ 40ml',
    category: 'Güneş Kremi',
    attributes: ['Hassas Ciltler İçin', 'SPF 50+', 'Su Geçirmez'],
    stores: [
      { name: 'Watsons', price: 108 },
      { name: 'Gratis', price: 99 },
      { name: 'Rossmann', price: 87 },
      { name: 'Mion', price: 102 },
    ],
  },
];

// Katalog ürünleri Supabase'den geliyor. Boş dizi = henüz yüklenmedi.
export const PRODUCTS: Product[] = [];

// Hero carousel demo için ROUTINE_PRODUCTS kullanıyoruz (Supabase boş olsa bile çalışır).
export const HERO_SLIDES = [
  {
    id: 'hero1',
    label: 'Kuru & Hassas Cilt',
    tagline: 'Dermatoloji Önerili Rutin',
    product: ROUTINE_PRODUCTS[1],
    bg: 'linear-gradient(135deg, #F0F7F4 0%, #E8F5F0 100%)',
    accentColor: '#2D6A4F',
  },
  {
    id: 'hero2',
    label: 'En Çok Tercih Edilen',
    tagline: 'Serum & Bakım Koleksiyonu',
    product: ROUTINE_PRODUCTS[0],
    bg: 'linear-gradient(135deg, #EFF6FB 0%, #E8F2FA 100%)',
    accentColor: '#0077B6',
  },
 {
    id: 'hero3',
    label: 'Yaz Koruması',
    tagline: 'SPF Filtreli Ürünler',
    product: ROUTINE_PRODUCTS[2],
    bg: 'linear-gradient(135deg, #FDF5F5 0%, #FAF0F0 100%)',
    accentColor: '#E63946',
  },
  {
    id: 'hero4',
    label: 'Leke Karşıtı Bakım',
    tagline: 'Aydınlatıcı Serum Seçkisi',
    product: ROUTINE_PRODUCTS[0],
    bg: 'linear-gradient(135deg, #F6F3FF 0%, #EFEAFB 100%)',
    accentColor: '#6D597A',
  },
  {
    id: 'hero5',
    label: 'Saç Bakımı',
    tagline: 'Onarıcı Bakım Rutini',
    product: ROUTINE_PRODUCTS[1],
    bg: 'linear-gradient(135deg, #FFF7E8 0%, #FFF1D6 100%)',
    accentColor: '#B7791F',
  },
  {
    id: 'hero6',
    label: 'Makyaj Bazı',
    tagline: 'Günlük Işıltı Etkisi',
    product: ROUTINE_PRODUCTS[2],
    bg: 'linear-gradient(135deg, #FFF2F6 0%, #FBE7EE 100%)',
    accentColor: '#B83280',
  },
];

export const STORE_ORDER: StoreName[] = ['Watsons', 'Gratis', 'Rossmann', 'Mion'];