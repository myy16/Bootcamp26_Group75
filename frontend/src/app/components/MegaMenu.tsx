import { useRef, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import {
  getTopCategories,
  getMenuColumns,
  BRANDS,
  CategoryRow,
} from '../Categorydata'; // <-- yol projenizde farklıysa (data.ts nerede ise) güncelleyin

interface MegaMenuProps {
  selectedCategoryId: number | null;
  selectedBrandId: number | null;
  onSelectCategory: (category: CategoryRow) => void;
  onSelectBrand: (brandId: number, name: string) => void;
}

type OpenPanel = number | 'brands' | null;

export function MegaMenu({
  selectedCategoryId,
  selectedBrandId,
  onSelectCategory,
  onSelectBrand,
}: MegaMenuProps) {
  const [openPanel, setOpenPanel] = useState<OpenPanel>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const topCategories = getTopCategories();

  const cancelClose = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpenPanel(null), 150);
  };

  return (
    <div className="relative">
      <div className="bg-[#1B4332] flex gap-2 overflow-x-auto p-2 sticky top-[69px] z-20">
        {/* Markalar sekmesi - Tümü'nün yerinde */}
        <div
          className="relative"
          onMouseEnter={() => {
            cancelClose();
            setOpenPanel('brands');
          }}
          onMouseLeave={scheduleClose}
        >
          <button
            onClick={() => setOpenPanel((p) => (p === 'brands' ? null : 'brands'))}
            className={`px-[18px] py-2 rounded-[10px]  text-[13px] whitespace-nowrap transition-colors ${
              selectedBrandId !== null
                ? "bg-[#2D6A4F] text-white" 
                : "bg-transparent text-white/60 hover:bg-white/5"
            }`}
          >
            Markalar
          </button>
        </div>

        {topCategories.map((cat) => {
          const isActive = selectedCategoryId === cat.category_id;
          return (
            <div
              key={cat.category_id}
              className="relative"
              onMouseEnter={() => {
                cancelClose();
                setOpenPanel(cat.category_id);
              }}
              onMouseLeave={scheduleClose}
            >
              <button
                onClick={() => {
                  onSelectCategory(cat);
                  setOpenPanel(null);
                }}
                className={`px-[18px] py-2 rounded-[10px] text-[13px] whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-[#2D6A4F] text-white" 
                    : "bg-transparent text-white/60 hover:bg-white/5"
                }`}
              >
                {cat.name}
              </button>
            </div>
          );
        })}
      </div>

      {/* Markalar paneli */}
      {openPanel === 'brands' && (
        <div
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
          className="absolute left-0 right-0 top-full z-30 bg-white border-b border-[#E8E8E2] shadow-[0_12px_32px_rgba(0,0,0,0.12)]"
        >
          <div className="px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center gap-1 text-[15px] font-bold text-[#1A1A1A] mb-4">
              Markalar <ChevronRight size={15} className="text-[#999]" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-8 gap-y-2.5">
              {BRANDS.map((brand) => (
                <button
                  key={brand.brand_id}
                  onClick={() => {
                    onSelectBrand(brand.brand_id, brand.name);
                    setOpenPanel(null);
                  }}
                  className={`text-left text-[13px] py-1 transition-colors ${
                    selectedBrandId === brand.brand_id
                      ? 'text-[#1B4332] font-semibold'
                      : 'text-[#555] hover:text-[#1B4332]'
                  }`}
                >
                  {brand.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Kategori panelleri */}
      {topCategories.map((cat) => {
        if (openPanel !== cat.category_id) return null;
        const columns = getMenuColumns(cat.category_id);
        if (columns.length === 0) return null;

        // Ara kategorisi olmayan üst kategoriler (Cilt Bakımı, Saç Bakımı,
        // Kişisel Bakım): tek sütun döner ve başlık üst kategorinin kendisidir.
        // Bu durumda başlığı tekrar yazmayıp öğeleri direkt grid'e basıyoruz.
        const isFlatList = columns.length === 1 && columns[0].header.category_id === cat.category_id;

        return (
          <div
            key={cat.category_id}
            onMouseEnter={cancelClose}
            onMouseLeave={scheduleClose}
            className="absolute left-0 right-0 top-full z-30 bg-white border-b border-[#E8E8E2] shadow-[0_12px_32px_rgba(0,0,0,0.12)]"
          >
            <div className="px-4 sm:px-6 lg:px-8 py-6">
              <button
                onClick={() => {
                  onSelectCategory(cat);
                  setOpenPanel(null);
                }}
                className="flex items-center gap-1 text-[15px] font-bold text-[#1A1A1A] mb-5 hover:text-[#1B4332] transition-colors"
              >
                {cat.name} <ChevronRight size={15} className="text-[#999]" />
              </button>

              {isFlatList ? (
                <div
                  className={`grid gap-2 ${
                    columns[0].items.length > 6 ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-1'
                  }`}
                >
                  {columns[0].items.map((item) => (
                    <button
                      key={item.category_id}
                      onClick={() => {
                        onSelectCategory(item);
                        setOpenPanel(null);
                      }}
                      className={`text-left text-[13px] py-1 transition-colors ${
                        selectedCategoryId === item.category_id
                          ? 'text-[#1B4332] font-semibold'
                          : 'text-[#666] hover:text-[#1B4332]'
                      }`}
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-10 gap-y-6">
                  {columns.map((col) => (
                    <div key={col.header.category_id}>
                      <div className="text-[13px] font-semibold text-[#1A1A1A] mb-2.5">
                        {col.header.name}
                      </div>
                      <div className="flex flex-col gap-1.5">
                        {col.items.map((item) => (
                          <button
                            key={item.category_id}
                            onClick={() => {
                              onSelectCategory(item);
                              setOpenPanel(null);
                            }}
                            className={`text-left text-[13px] transition-colors ${
                              selectedCategoryId === item.category_id
                                ? 'text-[#1B4332] font-semibold'
                                : 'text-[#666] hover:text-[#1B4332]'
                            }`}
                          >
                            {item.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}