import { useState } from 'react';
import { Search, SlidersHorizontal, Bell } from 'lucide-react';
import { PRODUCTS, Product } from '../data';
import { User } from '@supabase/supabase-js';
// (products prop varsa Supabase verisi kullanılır, yoksa PRODUCTS fallback)
import { ProductCard } from './ProductCard';
import { HeroCarousel } from './HeroCarousel';

interface HomePageProps {
  products?: Product[];
  cartItemIds: Set<string>;
  favoriteIds: Set<string>;
  onAddToCart: (product: Product) => void;
  onToggleFavorite: (id: string) => void;
  user: User | null;
  onOpenLogin: () => void;
  onOpenChart: (product: Product) => void;
}

const CATEGORIES = ['Cilt Bakımı', 'Makyaj', 'Saç Bakımı', 'Parfüm'];
const PRODUCT_CATS = ['Tümü', 'Temizleyici', 'Nemlendirici', 'Serum', 'Güneş Kremi', 'Bakım Kremi'];

export function HomePage({ products, cartItemIds, favoriteIds, onAddToCart, onToggleFavorite, user, onOpenLogin, onOpenChart }: HomePageProps) {
  const [search, setSearch] = useState('');
  const [activeMainCat, setActiveMainCat] = useState('Cilt Bakımı');
  const [activeProductCat, setActiveProductCat] = useState('Tümü');

  const source = products && products.length > 0 ? products : PRODUCTS;
  const filtered = source.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.title.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q);
    const matchCat = activeProductCat === 'Tümü' || p.category === activeProductCat;
    return matchSearch && matchCat;
  });

  return (
    <div className="min-h-screen bg-[#F5F5F0] font-sans">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-[#F5F5F0]/95 backdrop-blur-md border-b border-[#E8E8E2] px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[160px]">
          <h1 className="text-xl font-bold text-[#1A1A1A]">Tüm Ürünler</h1>
          <p className="text-xs text-[#666] mt-0.5">4 Markette Karşılaştır</p>
        </div>

        <div className="relative order-3 sm:order-none w-full sm:w-auto">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999] pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ürün veya marka ara..."
            className="w-full sm:w-[220px] lg:w-[260px] pl-9 pr-3.5 py-2.5 rounded-lg border-[1.5px] border-[#E0E0DA] bg-white text-[13px] text-[#1A1A1A] outline-none focus:border-[#2D6A4F] transition-colors"
          />
        </div>

        <button className="hidden sm:flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg border-[1.5px] border-[#E0E0DA] bg-white text-[#666] text-[13px] hover:bg-gray-50 transition-colors">
          <SlidersHorizontal size={14} />
          Filtrele
        </button>

        <button className="w-[38px] h-[38px] rounded-lg border-[1.5px] border-[#E0E0DA] bg-white flex items-center justify-center text-[#666] relative hover:bg-gray-50 transition-colors">
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 w-[7px] h-[7px] rounded-full bg-[#FFB7B2] border-[1.5px] border-[#F5F5F0]" />
        </button>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-7 flex flex-col gap-8">
        {/* Main category pills */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {CATEGORIES.map((cat) => {
            const isActive = activeMainCat === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveMainCat(cat)}
                className={`px-[18px] py-2 rounded-full border-[1.5px] text-[13px] whitespace-nowrap transition-all ${
                  isActive
                    ? 'border-[#1B4332] bg-[#1B4332] text-white font-semibold'
                    : 'border-[#D5D5CF] bg-white text-[#666]'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Hero carousel */}
        <HeroCarousel />

        {/* Products section */}
        <div>
          {/* Sub-category filter + product count */}
          <div className="flex items-center justify-between mb-[18px] flex-wrap gap-2.5">
            <div className="flex gap-1.5 flex-wrap">
              {PRODUCT_CATS.map((cat) => {
                const isActive = activeProductCat === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveProductCat(cat)}
                    className={`px-3.5 py-1.5 rounded-full border-[1.5px] text-[12.5px] transition-all ${
                      isActive
                        ? 'border-[#2D6A4F] bg-[#EBF5F0] text-[#2D6A4F] font-semibold'
                        : 'border-[#D5D5CF] bg-white text-[#666]'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
            <span className="text-xs text-[#999]">{filtered.length} ürün bulundu</span>
          </div>

          {/* Responsive product grid: 1 / 2 / 3 / 4 columns */}
          {filtered.length === 0 ? (
            <div className="text-center py-[60px] text-[#999] text-sm">
              Arama kriterlerine uygun ürün bulunamadı.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
              {filtered.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  isFavorited={favoriteIds.has(product.id)}
                  isInCart={cartItemIds.has(product.id)}
                  onAddToCart={onAddToCart}
                  onToggleFavorite={onToggleFavorite}
                  user={user}
                  onOpenLogin={onOpenLogin}
                  onOpenChart={onOpenChart}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
