import { useState } from 'react';
import { Search, SlidersHorizontal, Bell, ChevronDown } from 'lucide-react';
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
  onOpenLogin: () => void;
  onOpenChart: (product: Product) => void;
}

type SortKey = 'price-desc' | 'price-asc' | 'name-asc' | 'name-desc';

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'price-desc', label: 'Artan Fiyat' },
  { key: 'price-asc', label: 'Azalan Fiyat' },
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
  onOpenLogin,
  onOpenChart,
}: HomePageProps) {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('price-asc');
  const [sortOpen, setSortOpen] = useState(false);

  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedCategoryName, setSelectedCategoryName] = useState<string | null>(null);
  // brand_id sadece MegaMenu'de "seçili marka" görünümü (bold/renk) için tutuluyor.
  // Product'ta brand_id olmadığından, gerçek filtreleme selectedBrandName ile yapılıyor.
  const [selectedBrandId, setSelectedBrandId] = useState<number | null>(null);
  const [selectedBrandName, setSelectedBrandName] = useState<string | null>(null);

const handleSelectCategory = (cat: CategoryRow) => {
    if (selectedCategoryId === cat.category_id) {
      // Aynı kategoriye tekrar tıklanırsa filtreyi temizle
      setSelectedCategoryId(null);
      setSelectedCategoryName(null);
    } else {
      setSelectedCategoryId(cat.category_id);
      setSelectedCategoryName(cat.name);
      // Kategori seçilince marka filtresini temizle (ikisi aynı anda aktif olamaz)
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
      // Marka seçilince kategori filtresini temizle (ikisi aynı anda aktif olamaz)
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

  // Seçili kategorinin altındaki tüm leaf (en alt seviye) kategori isimleri
  // (normalize edilmiş). Hiçbir kategori seçili değilse null -> filtre yok.
  const allowedCategoryNames =
    selectedCategoryId !== null ? new Set(getLeafDescendantNames(selectedCategoryId)) : null;

  const normalizedSelectedBrand = selectedBrandName ? normalizeText(selectedBrandName) : null;

  // Hem filtreleme hem de veri tabanı yapınıza tam uyumlu sıralama
  const filteredAndSorted = source
    .filter((p) => {
      const q = search.toLowerCase();

      const matchSearch =
        !q || p.title.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q);

      const matchCategory =
        allowedCategoryNames === null || allowedCategoryNames.has(normalizeText(p.category));

      const matchBrand =
        normalizedSelectedBrand === null || normalizeText(p.brand) === normalizedSelectedBrand;

      return matchSearch && matchCategory && matchBrand;
    })
    .slice() 
    .sort((a, b) => {
      // data.ts'teki Product tipinde fiyatlar `stores: {name, price}[]` içinde.
      const pa = a.stores?.filter((s) => s.price > 0).map((s) => s.price) || [];
      const pb = b.stores?.filter((s) => s.price > 0).map((s) => s.price) || [];

      switch (sortBy) {
        case 'price-asc': {
          // Artan fiyat: Ürünün marketler içindeki EN UCUZ fiyatını bul, hiç fiyat yoksa en sona at (9999)
          const minA = pa.length ? Math.min(...pa) : 9999;
          const minB = pb.length ? Math.min(...pb) : 9999;
          return minA - minB;
        }
        case 'price-desc': {
          // Azalan fiyat: Ürünün marketler içindeki EN PAHALI fiyatını bul, hiç fiyat yoksa en sona at (0)
          const maxA = pa.length ? Math.max(...pa) : 0;
          const maxB = pb.length ? Math.max(...pb) : 0;
          return maxB - maxA;
        }
        case 'name-asc':
          return a.title.localeCompare(b.title, 'tr');
        case 'name-desc':
          return b.title.localeCompare(a.title, 'tr');
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

        {/* <button className="w-[38px] h-[38px] rounded-lg border-[1.5px] border-[#E0E0DA] bg-white flex items-center justify-center text-[#666] relative hover:bg-gray-50 transition-colors">
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 w-[7px] h-[7px] rounded-full bg-[#FFB7B2] border-[1.5px] border-[#F5F5F0]" />
        </button> */}
      </div>

      {/* Kategori / Marka mega menü */}
      <MegaMenu
        selectedCategoryId={selectedCategoryId}
        selectedBrandId={selectedBrandId}
        onSelectCategory={handleSelectCategory}
        onSelectBrand={handleSelectBrand}
      />

      <div className="px-4 sm:px-6 lg:px-8 py-7 flex flex-col gap-8">
        {/* Hero carousel */}
        <HeroCarousel />

        {/* Products section */}
        <div>
          {/* Sub-category filter + product count */}
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
                  Filtrele
                  <ChevronDown
                    size={13}
                    className={`transition-transform ${
                      sortOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {sortOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-20"
                      onClick={() => setSortOpen(false)}
                    />
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

          {/* Responsive product grid */}
          {filteredAndSorted.length === 0 ? (
            <div className="text-center py-[60px] text-[#999] text-sm">
              Arama kriterlerine uygun ürün bulunamadı.
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