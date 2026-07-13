import {
  Heart,
  ShoppingBag,
  Check,
  ArrowRight,
} from "lucide-react";
import {
  Product,
  getCheapestStore,
  STORE_COLORS,
  STORE_ORDER,
} from "../data";
import { User } from "@supabase/supabase-js"; // Kullanıcı tipini ekliyoruz

interface ProductCardProps {
  product: Product;
  isFavorited: boolean;
  isInCart: boolean;
  onAddToCart: (product: Product) => void;
  onToggleFavorite: (id: string) => void;
  compact?: boolean;
  user?: User | null; // <-- YENİ: Kullanıcı oturum bilgisi
  onOpenLogin?: () => void; // <-- YENİ: Giriş yap modalını tetikleme fonksiyonu
}

export function ProductCard({
  product,
  isFavorited,
  isInCart,
  onAddToCart,
  onToggleFavorite,
  compact,
  user,
  onOpenLogin,
}: ProductCardProps) {
  const validStores = (product.stores || []).filter(
    (s) => s.price > 0,
  );
  if (validStores.length === 0) {
    return null;
  }
  const cheapest = validStores.reduce(
    (min, s) => (s.price < min.price ? s : min),
    validStores[0],
  );
  const maxPrice = Math.max(...validStores.map((s) => s.price));
  const minPrice = cheapest?.price ?? 0;

  // Kalp ikonuna tıklama kontrolü
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Tıklamanın karta (detaya) gitmesini engeller

    if (!user && onOpenLogin) {
      // Kullanıcı yoksa modalı aç
      onOpenLogin();
    } else {
      // Kullanıcı varsa favoriye ekle/çıkar
      onToggleFavorite(product.id);
    }
  };

  return (
    <div className="group bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.12)] overflow-hidden flex flex-col transition-all duration-300 hover:scale-[1.02] cursor-pointer font-sans relative">
      {/* --- IMAGE SECTION --- */}
      <div className="relative aspect-square overflow-hidden bg-[#F8F8F5]">
        <img
          src={product.image}
          alt={product.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Gradient overlay bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-[60px] bg-gradient-to-t from-white/50 to-transparent" />

        {/* Featured badge */}
        {product.featuredLabel && (
          <div className="absolute top-2.5 left-2.5 bg-[#1B4332]/85 text-[#FFB7B2] rounded-full px-2.5 py-1 text-[10px] font-medium tracking-[0.3px] backdrop-blur-sm">
            {product.featuredLabel}
          </div>
        )}

        {/* Heart button */}
        <button
          onClick={handleFavoriteClick}
          className="absolute top-2.5 right-2.5 w-[34px] h-[34px] rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center cursor-pointer shadow-sm hover:scale-110 transition-all z-10"
        >
          <Heart
            size={16}
            className={`transition-colors duration-300 ${
              isFavorited
                ? "fill-[#FFB7B2] text-[#E06070]"
                : "fill-transparent text-gray-400 hover:text-gray-600"
            }`}
          />
        </button>

        {/* Hover detail link (Sadece üzerine gelindiğinde görünür) */}
        <div className="absolute bottom-2 right-2 bg-white/95 rounded-md px-2.5 py-1 text-[11px] font-semibold text-[#1B4332] flex items-center gap-1 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-1 group-hover:translate-y-0">
          Detay <ArrowRight size={12} />
        </div>
      </div>

      {/* --- CONTENT SECTION --- */}
      <div
        className={`flex flex-col gap-2.5 ${compact ? "p-3" : "p-4"}`}
      >
        {/* Brand & title */}
        <div>
          <div className="text-[10px] font-semibold text-[#2D6A4F] tracking-[0.6px] uppercase mb-0.5">
            {product.brand}
          </div>
          <div className="text-[13.5px] font-bold text-[#1A1A1A] leading-snug line-clamp-2 min-h-10">
            {product.title}
          </div>
        </div>

        {/* Category */}
        <div className="flex flex-wrap gap-1">
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1B4332] text-white font-medium">
            {product.category}
          </span>
        </div>

        {/* --- Fiyat Listesi (Sola ve Sağa Yaslı) --- */}
        <div className="flex flex-col gap-1 mt-1 min-h-24">
          {validStores.map((store, index) => {
            const isCheapestStore =
              cheapest && store.name === cheapest.name;
            const storeColor = STORE_COLORS[store.name];

            return (
              <div
                key={`${store.name}-${index}`}
                className="flex items-center justify-between px-1.5 rounded-lg transition-colors hover:bg-gray-50/80"
              >
                {/* SOL TARAF: Mağaza İsmi Bilgisi */}
                <div className="flex items-center gap-2">
                  <div
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ background: storeColor.color }}
                  />
                  <div className="text-[12.5px] font-semibold text-gray-700 tracking-tight">
                    {store.name}
                  </div>
                </div>

                {/* SAĞ TARAF: Rozet ve Fiyat Grubu */}
                <div className="flex items-center gap-2">
                  {/* EN UCUZ rozeti tam olarak fiyatın SOL tarafında yer alır */}
                  {isCheapestStore && (
                    <div className="text-[9px] font-extrabold rounded-md px-1.5 py-0.5 shrink-0 whitespace-nowrap tracking-wide animate-pulse bg-[#EBF5F0] text-[#2D6A4F]">
                      EN UCUZ
                    </div>
                  )}

                  {/* Fiyat Bilgisi */}
                  <div
                    className={`text-[13.5px] text-right shrink-0 tracking-tight ${
                      isCheapestStore
                        ? "font-bold text-[#2D6A4F]"
                        : "font-medium text-gray-500"
                    }`}
                  >
                    {store.price} ₺
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add to cart button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddToCart(product);
          }}
          className={`flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl w-full text-[13px] font-semibold transition-colors duration-200 ${
            isInCart
              ? "bg-[#EBF5F0] text-[#2D6A4F] hover:bg-[#DDF0E6]"
              : "bg-[#1B4332] text-white hover:bg-[#153427] shadow-md shadow-[#1B4332]/20"
          }`}
        >
          {isInCart ? (
            <>
              <Check size={14} className="stroke-[3px]" />{" "}
              Sepette
            </>
          ) : (
            <>
              <ShoppingBag size={14} /> Sepete Ekle
            </>
          )}
        </button>
      </div>
    </div>
  );
}