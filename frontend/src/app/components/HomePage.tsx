import { useState } from 'react';
import { Search, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { PRODUCTS, Product } from '../data';
import { User } from '@supabase/supabase-js';
import { ProductCard } from './ProductCard';
import { HeroCarousel } from './HeroCarousel';
import { MegaMenu } from './MegaMenu';
import { getLeafDescendantNames, normalizeText, CategoryRow } from '../Categorydata';

interface HomePageProps {
  products?: Product[];
  cartItemIds: Set<string>;
  favoriteIds: Set<string>;
  onAddToCart: (product: Product) => void;
  onToggleFavorite: (id: string) => void;
  user: User | null;
  userSkinTypeName?: string | null;
  onOpenLogin: () => void;
  onOpenChart: (product: Product) => void;
}

type SortKey = 'price-desc' | 'price-asc' | 'name-asc' | 'name-desc';

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'price-asc', label: 'Artan Fiyat' },
  { key: 'price-desc', label: 'Azalan Fiyat' },
  { key: 'name-asc', label: 'Marka Adına Göre (A-Z)' },
  { key: 'name-desc', label: 'Marka Adına Göre (Z-A)' },
];

export function HomePage({
  products,
  cartItemIds,
  favoriteIds,
  onAddToCart,
  onToggleFavorite,
  user,
  userSkinTypeName,
  onOpenLogin,
  onOpenChart,
}: HomePageProps) {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('price-asc');
  const [sortOpen, setSortOpen] = useState(false);

  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedCategoryName, setSelectedCategoryName] = useState<string | null>(null);
  const [selectedBrandId, setSelectedBrandId] = useState<number | null>(null);
  const [selectedBrandName, setSelectedBrandName] = useState<string | null>(null);

  const handleSelectCategory = (cat: CategoryRow) => {
    if (selectedCategoryId === cat.category_id) {
      setSelectedCategoryId(null);
      setSelectedCategoryName(null);
    } else {
      setSelectedCategoryId(cat.category_id);
      setSelectedCategoryName(cat.name);
      setSelectedBrandId(null);
      setSelectedBrandName(null);
    }
  };

  const handleSelectBrand = (brandId: number, name: string) => {
    if (selectedBrandId === brandId) {
      setSelectedBrandId(null);
      setSelectedBrandName(null);
    } else {
      setSelectedBrandId(brandId);
      setSelectedBrandName(name);
      setSelectedCategoryId(null);
      setSelectedCategoryName(null);
    }
  };

  const clearFilters = () => {
    setSelectedCategoryId(null);
    setSelectedCategoryName(null);
    setSelectedBrandId(null);
    setSelectedBrandName(null);
  };

  const source = products && products.length > 0 ? products : PRODUCTS;
  const searchTerm = search.trim();

  const allowedCategoryNames =
    selectedCategoryId !== null ? new Set(getLeafDescendantNames(selectedCategoryId)) : null;

  const normalizedSelectedBrand = selectedBrandName ? normalizeText(selectedBrandName) : null;

  const filteredAndSorted = source
    .filter((p) => {
      const q = searchTerm.toLowerCase();

      const matchSearch =
        !q || p.title.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q);

      const matchCategory =
        allowedCategoryNames === null || allowedCategoryNames.has(normalizeText(p.category));

      const normalizedProductBrand = normalizeText(p.brand);
      const matchBrand =
        normalizedSelectedBrand === null ||
        normalizedProductBrand.includes(normalizedSelectedBrand) ||
        normalizedSelectedBrand.includes(normalizedProductBrand);

      return matchSearch && matchCategory && matchBrand;
    })
    .slice()
    .sort((a, b) => {
      const pa = a.stores?.filter((s) => s.price > 0).map((s) => s.price) || [];
      const pb = b.stores?.filter((s) => s.price > 0).map((s) => s.price) || [];

      switch (sortBy) {
        case 'price-asc': {
          const minA = pa.length ? Math.min(...pa) : 9999;
          const minB = pb.length ? Math.min(...pb) : 9999;
          return minA - minB;
        }
        case 'price-desc': {
          const maxA = pa.length ? Math.max(...pa) : 0;
          const maxB = pb.length ? Math.max(...pb) : 0;
          return maxB - maxA;
        }
        case 'name-asc':
          return a.brand.localeCompare(b.brand, 'tr');
        case 'name-desc':
          return b.brand.localeCompare(a.brand, 'tr');
        default:
          return 0;
      }
    });

  return (
    <div className="min-h-screen bg-[#F5F5F0] font-sans">
      <div className="sticky top-0 z-10 bg-[#F5F5F0]/95 backdrop-blur-md border-b border-[#E8E8E2] px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[160px]">
          <h1 className="text-xl font-bold text-[#1A1A1A]">Tüm Ürünler</h1>
          <p className="text-xs text-[#666] mt-0.5">4 Markette Karşılaştır</p>
        </div>

        <div className="relative order-3 sm:order-none w-full sm:w-auto">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999] pointer-events-none"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ürün veya marka ara..."
            className="w-full sm:w-[220px] lg:w-[260px] pl-9 pr-3.5 py-2.5 rounded-lg border-[1.5px] border-[#E0E0DA] bg-white text-[13px] text-[#1A1A1A] outline-none focus:border-[#2D6A4F] transition-colors"
          />
        </div>
      </div>

      <MegaMenu
        selectedCategoryId={selectedCategoryId}
        selectedBrandId={selectedBrandId}
        onSelectCategory={handleSelectCategory}
        onSelectBrand={handleSelectBrand}
      />

      <div className="px-4 sm:px-6 lg:px-8 py-7 flex flex-col gap-8">
        <HeroCarousel products={source} user={user} userSkinTypeName={userSkinTypeName} />

        <div>
          <div className="flex items-center justify-between mb-[18px] flex-wrap gap-2.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-[#999]">
                {filteredAndSorted.length} ürün gösteriliyor
                {selectedCategoryName ? ` · ${selectedCategoryName}` : ''}
                {selectedBrandName ? ` · ${selectedBrandName}` : ''}
              </span>

              {(selectedCategoryId !== null || selectedBrandName !== null) && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-[#1B4332] underline hover:no-underline"
                >
                  Filtreyi temizle
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <button
                  onClick={() => setSortOpen((o) => !o)}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg border-[1.5px] border-[#E0E0DA] bg-white text-[#666] text-[13px] hover:bg-gray-50 transition-colors"
                >
                  <SlidersHorizontal size={14} />
                  Sırala
                  <ChevronDown
                    size={13}
                    className={`transition-transform ${sortOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {sortOpen && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setSortOpen(false)} />
                    <div className="absolute right-0 top-[46px] z-30 w-[220px] bg-white rounded-xl border border-[#E8E8E2] shadow-[0_8px_32px_rgba(0,0,0,0.12)] overflow-hidden py-1">
                      {SORT_OPTIONS.map((opt) => (
                        <button
                          key={opt.key}
                          onClick={() => {
                            setSortBy(opt.key);
                            setSortOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 text-[13px] transition-colors hover:bg-gray-50 ${
                            sortBy === opt.key
                              ? 'text-[#1B4332] font-semibold bg-[#EBF5F0]'
                              : 'text-[#555]'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {filteredAndSorted.length === 0 ? (
            <div className="text-center py-[60px] flex flex-col items-center gap-3">
              <Search size={36} className="text-[#999]" />

              <div className="text-[#1A1A1A] font-semibold text-base">
                {selectedBrandName
                  ? `${selectedBrandName} markasına ait ürün bulunmuyor`
                  : selectedCategoryName
                  ? `${selectedCategoryName} kategorisinde henüz ürün bulunmuyor`
                  : searchTerm
                  ? `"${searchTerm}" aramanızla eşleşen ürün bulunamadı`
                  : 'Henüz gösterilecek ürün bulunmuyor'}
              </div>

              <div className="text-[#999] text-sm max-w-xs">
                {selectedBrandName
                  ? 'Bu markaya ait ürünler eklendiğinde burada görüntülenecektir. Dilerseniz tüm ürünleri inceleyebilirsiniz.'
                  : selectedCategoryName
                  ? 'Bu kategoriye yeni ürünler eklendiğinde burada görüntülenecektir. Şimdilik diğer kategorilere göz atabilirsiniz.'
                  : searchTerm
                  ? 'Arama kelimesini değiştirerek tekrar deneyebilir veya farklı bir marka/kategori arayabilirsiniz.'
                  : 'Ürünler eklendiğinde burada listelenecektir. Şimdilik tüm kategorileri inceleyebilirsiniz.'}
              </div>

              {(selectedBrandName || selectedCategoryName || searchTerm) && (
                <button
                  onClick={() => {
                    clearFilters();
                    setSearch('');
                  }}
                  className="mt-1 px-4 py-2 rounded-lg bg-[#1B4332] text-white text-sm font-semibold hover:bg-[#153427] transition-colors"
                >
                  Tüm ürünlere dön
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
              {filteredAndSorted.map((product) => (
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