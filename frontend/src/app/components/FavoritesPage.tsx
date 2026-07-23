import { useState } from "react";
import {
  Bell,
  X,
  TrendingDown,
  TrendingUp,
  ShoppingBag,
  LogIn,
  ArrowRight,
} from "lucide-react";
import { PRODUCTS, STORE_COLORS, Product } from "../data";
import { User } from "@supabase/supabase-js";

interface FavoritesPageProps {
  products?: Product[];
  favoriteIds: Set<string>;
  onToggleFavorite: (id: string) => void;
  onAddToCart: (product: Product) => void;
  onOpenChart: (product: Product) => void;
  cartItemIds: Set<string>;
  user: User | null;
  onOpenLogin: () => void;
}

// ESKİ VERSİYONDAKİ GİBİ: Sadece grafiği ve metinleri çizer, buton burada yok!
function MiniPriceChart({
  history,
}: {
  history: { date: string; price: number }[];
}) {
  const validHistory = (history || []).filter(
    (item) =>
      Number.isFinite(Number(item.price)) && Number(item.price) > 0,
  );

  if (validHistory.length === 0) {
    return (
      <div className="text-xs text-gray-400">
        Geçerli fiyat geçmişi bulunmuyor.
      </div>
    );
  }

  const prices = validHistory.map((item) => Number(item.price));

  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice;
  const chartRange = priceRange || 1;

  const chartWidth = 145;
  const chartHeight = 50;

  const points = prices.map((price, index) => {
    const x =
      prices.length > 1
        ? (index / (prices.length - 1)) * chartWidth
        : chartWidth / 2;

    const y =
      chartHeight -
      ((price - minPrice) / chartRange) * (chartHeight - 12) -
      6;

    return `${x},${y}`;
  });

  const firstPrice = prices[0];
  const currentPrice = prices[prices.length - 1];
  const netDifference = currentPrice - firstPrice;

  const isDown = netDifference < -0.01;
  const isUp = netDifference > 0.01;
  const hasFluctuated = priceRange > 0.01;

  const chartColor = isDown
    ? "#2D6A4F"
    : isUp
      ? "#E63946"
      : hasFluctuated
        ? "#B8860B"
        : "#8A8A84";

  const statusText = isDown
    ? `${Math.abs(netDifference).toFixed(2)} ₺ düştü`
    : isUp
      ? `${netDifference.toFixed(2)} ₺ arttı`
      : hasFluctuated
        ? `${priceRange.toFixed(2)} ₺ fiyat aralığı`
        : "Fiyat sabit";

  return (
    <div className="flex min-w-0 items-center gap-5">
      <svg
        width={chartWidth}
        height={chartHeight}
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        className="shrink-0 overflow-visible"
      >
        <line
          x1="0"
          y1={chartHeight - 4}
          x2={chartWidth}
          y2={chartHeight - 4}
          stroke="#E8E8E2"
          strokeWidth="1"
        />

        {prices.length > 1 && (
          <polyline
            points={points.join(" ")}
            fill="none"
            stroke={chartColor}
            strokeWidth={2.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {prices.map((price, index) => {
          const [x, y] = points[index].split(",").map(Number);

          return (
            <circle
              key={`${price}-${index}`}
              cx={x}
              cy={y}
              r={3}
              fill={chartColor}
            />
          );
        })}
      </svg>

      <div className="min-w-0">
        <div
          className="flex items-center gap-1.5 text-sm font-semibold"
          style={{ color: chartColor }}
        >
          {isDown && <TrendingDown size={14} />}
          {isUp && <TrendingUp size={14} />}
          {/* <span>{statusText}</span> */}
        </div>

       

        
      </div>
    </div>
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

  const favorites = source.filter((product) =>
    favoriteIds.has(product.id),
  );

  const toggleNotification = (id: string) => {
    setNotifications((previousNotifications) => {
      const updatedNotifications = new Set(previousNotifications);

      if (updatedNotifications.has(id)) {
        updatedNotifications.delete(id);
      } else {
        updatedNotifications.add(id);
      }

      return updatedNotifications;
    });
  };

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F5F0] p-6 font-sans">
        <div className="flex w-full max-w-md flex-col items-center rounded-2xl border border-[#E8E8E2] bg-white p-10 text-center shadow-sm">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#F0F7F4] text-[#2D6A4F]">
            <Bell size={28} />
          </div>

          <h2 className="mb-2 text-xl font-bold text-[#1A1A1A]">
            Favorileriniz İçin Giriş Yapın
          </h2>

          <p className="mb-8 text-sm leading-relaxed text-gray-500">
            Beğendiğiniz kozmetik ürünlerinin fiyat düşüşlerinden
            haberdar olmak ve kişisel favori listenize erişmek için
            oturum açmalısınız.
          </p>

          <button
            type="button"
            onClick={onOpenLogin}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1B4332] px-4 py-3.5 text-sm font-semibold text-white shadow-md transition-colors hover:bg-[#153427]"
          >
            <LogIn size={18} />
            Giriş Yap / Kayıt Ol
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F0] pb-12 font-sans">
      <header className="sticky top-0 z-10 border-b border-[#E8E8E2] bg-white px-10 py-6">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">
          Favorilerim
        </h1>

        <p className="mt-1.5 text-sm text-gray-500">
          {favorites.length} ürün kaydedildi · Beğendiğin ürünleri ve
          fiyat değişimlerini buradan takip edebilirsin.
        </p>
      </header>

      <main className="p-10">
        {favorites.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#DADAD3] bg-white px-5 py-24 text-center">
            <div className="mb-4 text-5xl text-gray-300">♡</div>

            <div className="mb-2 text-xl font-semibold text-[#1A1A1A]">
              Henüz favori ürün yok
            </div>

            <div className="text-sm text-gray-500">
              Ürün kartlarındaki kalp ikonuna tıklayarak ürünleri
              favorilerine ekleyebilirsin.
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(380px,1fr))] gap-8">
            {favorites.map((product) => {
              const validStores = (product.stores || []).filter(
                (store) =>
                  Number.isFinite(Number(store.price)) &&
                  Number(store.price) > 0,
              );

              const cheapestStore =
                validStores.length > 0
                  ? validStores.reduce(
                      (cheapest, currentStore) =>
                        Number(currentStore.price) <
                        Number(cheapest.price)
                          ? currentStore
                          : cheapest,
                      validStores[0],
                    )
                  : null;

              const storeColor = cheapestStore
                ? STORE_COLORS[cheapestStore.name]
                : STORE_COLORS.Mion;

              const history = (product.history || []).slice(-7);

              const validHistory = history.filter(
                (item) =>
                  Number.isFinite(Number(item.price)) &&
                  Number(item.price) > 0,
              );

              const hasNotification = notifications.has(product.id);
              const isInCart = cartItemIds.has(product.id);

              const firstHistoryPrice =
                validHistory.length > 0
                  ? Number(validHistory[0].price)
                  : Number(cheapestStore?.price ?? 0);

              const currentStorePrice = Number(
                cheapestStore?.price ?? 0,
              );

              const priceDifference =
                cheapestStore && firstHistoryPrice > currentStorePrice
                  ? firstHistoryPrice - currentStorePrice
                  : 0;

              return (
                <article
                  key={product.id}
                  className="relative flex min-h-[400px] flex-col overflow-hidden rounded-2xl border border-[#E4E4DE] bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
                >
                  <button
                    onClick={() => onToggleFavorite(product.id)}
                    title="Favorilerden kaldır"
                    className="absolute top-2.5 right-2.5 z-10 w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm border border-[#E8E8E2] flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-200 shadow-sm transition-colors"
                  >
                    <X size={15} />
                  </button>
                  
                  <div className="flex p-5">
                    <div className="flex h-[150px] w-[150px] shrink-0 items-center justify-center overflow-hidden rounded-xl">
                      <img
                        src={product.image}
                        alt={product.title}
                        className="h-full w-full object-contain p-2"
                      />
                    </div>

                    <div className="ml-5 flex min-w-0 flex-1 flex-col">
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-[#2D6A4F]">
                        {product.brand}
                      </div>

                      <h2 className="mt-2 line-clamp-2 text-[18px] font-bold leading-6 text-[#1A1A1A]">
                        {product.title}
                      </h2>

                      <p className="mt-2 text-xs text-gray-400">
                        {product.category}
                      </p>

                      <div className="mt-auto pt-4">
                        {cheapestStore ? (
                          <>
                            <div className="flex items-end gap-3">
                              <span
                                className="text-[34px] font-bold leading-none"
                                style={{
                                  color: storeColor.color,
                                }}
                              >
                                {Number(
                                  cheapestStore.price,
                                ).toFixed(2)}{" "}
                                ₺
                              </span>

                              {priceDifference > 0.01 && (
                                <span className="mb-1 flex items-center gap-1 text-xs font-semibold text-[#2D6A4F]">
                                  <TrendingDown size={13} />
                                  {priceDifference.toFixed(2)} ₺
                                </span>
                              )}
                            </div>

                            <div className="mt-3 flex items-center gap-2">
                              <span className="text-xs text-gray-400">
                                En uygun fiyat
                              </span>

                              <span
                                className="rounded-full px-2.5 py-1 text-xs font-semibold"
                                style={{
                                  backgroundColor: storeColor.light,
                                  color: storeColor.color,
                                }}
                              >
                                {cheapestStore.name}
                              </span>
                            </div>
                          </>
                        ) : (
                          <div className="text-sm font-medium text-gray-400">
                            Şu anda fiyat bilgisi bulunmuyor
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {validHistory.length > 0 && (
                    <div className="border-t border-[#EFEFEA] bg-[#FAFAF7] flex items-center justify-between px-6 py-5">

                      <div className="flex flex-col gap-5">
                        <span className="text-xs font-semibold text-gray-500">
                          Fiyat Geçmişi
                        </span>
                        <MiniPriceChart history={validHistory} />
                      </div>

                      <div className="flex items-center justify-between">
                        
                        <button
                          onClick={() => onOpenChart(product)}
                          type="button"
                          className="flex shrink-0 items-center gap-1.5 text-sm font-semibold text-[#2D6A4F] transition-colors hover:text-[#1B4332]"
                        >
                          Analizi Gör
                          <ArrowRight size={13} />
                        </button>
                      </div>                    
                    </div>
                  )}

                  <div className=" flex gap-3 border-t border-[#EFEFEA] p-4">
                    <button
                      type="button"
                      onClick={() => onAddToCart(product)}
                      className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                        isInCart
                          ? "bg-[#EBF5F0] text-[#2D6A4F]"
                          : "bg-[#2D6A4F] text-white hover:bg-[#1B4332]"
                      }`}
                    >
                      <ShoppingBag size={16} />
                      {isInCart ? "Sepette" : "Sepete Ekle"}
                    </button>

                    <button
                      onClick={() => toggleNotification?.(product.id)}
                      title={
                        hasNotification
                          ? "Alarm kurulu"
                          : "Fiyat alarmı kur"
                      }
                      className={`flex items-center justify-center gap-1.5 py-2 px-3.5 rounded-lg border-[1.5px] text-xs font-medium transition-colors ${
                        hasNotification
                          ? "border-[#2D6A4F] bg-[#EBF5F0] text-[#2D6A4F]"
                          : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <Bell
                        size={14}
                        className={hasNotification ? "fill-[#2D6A4F]" : ""}
                      />
                      {hasNotification ? "Alarm Kurulu" : "Alarm Kur"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}