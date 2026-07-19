import { useState } from "react";
import {
  Bell,
  X,
  TrendingDown,
  ShoppingBag,
  LogIn,
  ChevronRight,
} from "lucide-react";
import { PRODUCTS, STORE_COLORS, Product } from "../data";
import { User } from "@supabase/supabase-js";

const SIDEBAR_COLOR = "#1B4332";

interface FavoritesPageProps {
  products?: Product[];
  favoriteIds: Set<string>;
  onToggleFavorite: (id: string) => void;
  onAddToCart: (product: Product) => void;
  cartItemIds: Set<string>;
  user: User | null;
  onOpenLogin: () => void;
  onOpenChart: (product: Product) => void;
}

function MiniPriceChart({
  history,
}: {
  history: { date: string; price: number }[];
}) {
  if (!history || history.length === 0) return null;

  const prices = history.map((h) => h.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1; // 0'a bölünme hatasını önler
  const w = 120,
    h = 36;

  const pts = prices.map((p, i) => {
    const x =
      prices.length > 1 ? (i / (prices.length - 1)) * w : w / 2;
    const y = h - ((p - min) / range) * (h - 8) - 4;
    return `${x},${y}`;
  });

  const isDown = prices[prices.length - 1] < prices[0];
  const color = isDown ? "#52B788" : "#E63946";

  return (
    <svg width={w} height={h} className="overflow-visible">
      {prices.length > 1 && (
        <polyline
          points={pts.join(" ")}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      {prices.map((p, i) => {
        const [x, y] = pts[i].split(",").map(Number);
        return <circle key={i} cx={x} cy={y} r={2} fill={color} />;
      })}
    </svg>
  );
}

export function FavoritesPage({
  products,
  favoriteIds,
  onToggleFavorite,
  onAddToCart,
  cartItemIds,
  user,
  onOpenLogin,
  onOpenChart,
}: FavoritesPageProps) {
  const [notifications, setNotifications] = useState<Set<string>>(
    new Set(),
  );
  const source =
    products && products.length > 0 ? products : PRODUCTS;
  const favorites = source.filter((p) => favoriteIds.has(p.id));

  const toggleNotification = (id: string) => {
    setNotifications((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // KULLANICI GİRİŞ YAPMAMIŞSA
  if (!user) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex flex-col items-center justify-center p-6 font-sans">
        <div className="bg-white p-10 rounded-2xl shadow-sm border border-[#E8E8E2] max-w-md w-full text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-[#F0F7F4] rounded-full flex items-center justify-center mb-6 text-[#2D6A4F]">
            <Bell size={28} />
          </div>
          <h2 className="text-xl font-bold text-[#1A1A1A] mb-2">
            Favorileriniz İçin Giriş Yapın
          </h2>
          <p className="text-sm text-gray-500 mb-8 leading-relaxed">
            Beğendiğiniz kozmetik ürünlerinin fiyat
            düşüşlerinden anında haberdar olmak ve kişisel
            listenize erişmek için oturum açmalısınız.
          </p>
          <button
            onClick={onOpenLogin}
            className="w-full py-3.5 px-4 bg-[#1B4332] hover:bg-[#153427] text-white font-semibold rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-2"
          >
            <LogIn size={18} />
            Giriş Yap / Kayıt Ol
          </button>
        </div>
      </div>
    );
  }

  // KULLANICI GİRİŞ YAPMIŞSA
  return (
    <div className="min-h-screen bg-[#F5F5F0] font-sans pb-10">
      <div className="bg-white border-b border-[#E8E8E2] py-4 px-8 sticky top-0 z-10">
        <h1 className="text-xl font-bold text-[#1A1A1A]">
          Favorilerim
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          {favorites.length} ürün kaydedildi · Fiyat
          değişimlerini takip ediyorsun
        </p>
      </div>

      <div className="p-8">
        {favorites.length === 0 ? (
          <div className="text-center py-20 px-5">
            <div className="text-5xl text-gray-300 mb-4">♡</div>
            <div className="text-lg font-semibold text-[#1A1A1A] mb-2">
              Henüz favori ürün yok
            </div>
            <div className="text-sm text-gray-500">
              Ürün kartlarındaki kalp ikonuna tıklayarak
              fiyatları takip et
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(340px,1fr))] gap-5">
            {favorites.map((product) => {
              const validStores = (product.stores || []).filter(
                (s) => s.price > 0,
              );
              const cheapest =
                validStores.length > 0
                  ? validStores.reduce(
                      (min, s) =>
                        s.price < min.price ? s : min,
                      validStores[0],
                    )
                  : null;

              const storeColor = cheapest
                ? STORE_COLORS[cheapest.name]
                : STORE_COLORS.Mion;

              const history = (product.history || []).slice(-7);
              const hasNotif = notifications.has(product.id);
              const inCart = cartItemIds.has(product.id);

              const priceAtAdded =
                history.length > 0
                  ? history[0].price
                  : (cheapest?.price ?? 0);
              const priceDiff = cheapest
                ? priceAtAdded - cheapest.price
                : 0;

              return (
                <div
                  key={product.id}
                  className="relative bg-white rounded-xl border-[1.5px] border-[#E8E8E2] shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col"
                >
                  {/* Sağ üst: Favorilerden kaldır (çarpı) */}
                  <button
                    onClick={() => onToggleFavorite(product.id)}
                    title="Favorilerden kaldır"
                    className="absolute top-2.5 right-2.5 z-10 w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm border border-[#E8E8E2] flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-200 shadow-sm transition-colors"
                  >
                    <X size={15} />
                  </button>

                  <div className="flex">
                    <img
                      src={product.image}
                      alt={product.title}
                      className="w-[110px] h-[110px] object-cover shrink-0"
                    />
                    <div className="flex-1 p-3.5 pr-9 flex flex-col justify-between">
                      <div>
                        <div className="text-[10px] font-semibold text-[#2D6A4F] uppercase tracking-wide mb-1">
                          {product.brand}
                        </div>
                        <div className="text-[13px] font-bold text-[#1A1A1A] leading-tight mb-2 line-clamp-2">
                          {product.title}
                        </div>

                        <div className="flex items-center gap-2">
                          {cheapest ? (
                            <>
                              <div
                                className="text-lg font-bold"
                                style={{
                                  color: storeColor.color,
                                }}
                              >
                                {cheapest.price} ₺
                              </div>
                              {priceDiff > 0 && (
                                <div className="text-xs text-[#52B788] font-semibold flex items-center gap-1">
                                  <TrendingDown size={11} />₺
                                  {priceDiff.toFixed(2)} düştü
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="text-sm font-medium text-gray-400">
                              Şu an stokta/fiyat yok
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-2">
                        {cheapest && (
                          <div
                            className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                            style={{
                              background: storeColor.light,
                              color: storeColor.color,
                            }}
                          >
                            {cheapest.name} · En Ucuz
                          </div>
                        )}
                        <div className="text-[10px] text-gray-400">
                          {product.category}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Fiyat Değişim Alanı */}
                  {history.length > 0 && (
                    <div className="px-4 py-3 border-t border-[#F0F0EC] bg-gray-50/50">
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-md font-semibold text-gray-600">
                          Fiyat Değişimi
                        </div>
                        <button
                          onClick={() => onOpenChart(product)}
                          className="flex items-center gap-0.5 text-[11px] font-semibold hover:opacity-80 transition-opacity"
                          style={{ color: SIDEBAR_COLOR }}
                        >
                          Fiyat analizini detaylı gör
                          <ChevronRight size={13} />
                        </button>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <MiniPriceChart history={history} />
                        <div className="text-right">
                          <div className="text-[10px] text-gray-400">
                            Eklendiğinde
                          </div>
                          <div className="text-[13px] font-bold text-[#1A1A1A]">
                            ₺{priceAtAdded.toFixed(2)}
                          </div>
                          <div
                            className="text-[10px] font-semibold"
                            style={{
                              color:
                                priceDiff > 0
                                  ? "#52B788"
                                  : priceDiff < 0
                                    ? "#E63946"
                                    : "#999",
                            }}
                          >
                            {priceDiff > 0
                              ? `₺${priceDiff.toFixed(2)} düştü`
                              : priceDiff < 0
                                ? `₺${Math.abs(priceDiff).toFixed(2)} arttı`
                                : "Fiyat sabit"}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Aksiyon butonları */}
                  <div className="p-3 border-t border-[#F0F0EC] flex gap-2 mt-auto">
                    <button
                      onClick={() => onAddToCart(product)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium transition-colors ${
                        inCart
                          ? "bg-[#EBF5F0] text-[#2D6A4F]"
                          : "bg-[#2D6A4F] text-white hover:bg-[#1B4332]"
                      }`}
                    >
                      <ShoppingBag size={13} />
                      {inCart ? "Sepette" : "Sepete Ekle"}
                    </button>
                    <button
                      onClick={() => toggleNotification(product.id)}
                      title={
                        hasNotif
                          ? "Alarm kurulu"
                          : "Fiyat alarmı kur"
                      }
                      className={`flex items-center justify-center gap-1.5 py-2 px-3.5 rounded-lg border-[1.5px] text-xs font-medium transition-colors ${
                        hasNotif
                          ? "border-[#2D6A4F] bg-[#EBF5F0] text-[#2D6A4F]"
                          : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <Bell
                        size={14}
                        className={hasNotif ? "fill-[#2D6A4F]" : ""}
                      />
                      {hasNotif ? "Alarm Kurulu" : "Alarm Kur"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
