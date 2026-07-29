import React, { useEffect, useMemo, useState } from "react";
import {
  Trash2,
  ShoppingBag,
  TrendingDown,
  ExternalLink,
  Info,
  Share2,
  Heart,
  Truck,
  Store,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Product, getCheapestStore, STORE_COLORS, STORE_ORDER, StoreName } from "../data";

interface CartOptimizerProps {
  items: Product[];
  onRemoveItem: (id: string) => void;
  // Supabase bağlantısı için miktar güncellemelerini dışarıya bildiren opsiyonel proplar ekledik:
  onUpdateQuantity?: (id: string, newQuantity: number) => void;
}

interface BreakdownItem {
  product: Product;
  store: Product["stores"][number];
  quantity: number;
  total: number;
}

// Marketlerin kargo ücretleri ve ücretsiz kargo eşik değerleri
const MARKET_SHIPPING_INFO: Record<StoreName, { fee: number; threshold: number | null }> = {
  Watsons: { fee: 74.90, threshold: null },
  Gratis: { fee: 69.50, threshold: 150 }, // Örn: 150 TL üzeri kargo bedava
  Mion: { fee: 54.90, threshold: null },
  Rossmann: { fee: 69.90, threshold: null },
};

const formatPrice = (price: number) => {
  return price.toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export function CartOptimizer({
  items,
  onRemoveItem,
  onUpdateQuantity,
}: CartOptimizerProps) {
  // Alışveriş Modu: 'online' (Kargo hesaplanır) veya 'physical' (Kargolar 0 TL kabul edilir)
  const [shoppingMode, setShoppingMode] = useState<"online" | "physical">("online");
  const [activeOption, setActiveOption] = useState<"single" | "split">("split");

  // Ürün miktarları (Supabase'den gelen initial quantity değerini de destekler)
  const [quantities, setQuantities] = useState<Record<string, number>>(() =>
    Object.fromEntries(items.map((product) => [product.id, product.quantity || 1]))
  );

  useEffect(() => {
    setQuantities((prev) => {
      const updated = { ...prev };
      items.forEach((product) => {
        if (!updated[product.id]) {
          updated[product.id] = product.quantity || 1;
        }
      });
      Object.keys(updated).forEach((id) => {
        if (!items.some((p) => p.id === id)) delete updated[id];
      });
      return updated;
    });
  }, [items]);

  const increaseQuantity = (productId: string) => {
    const newQty = (quantities[productId] || 1) + 1;
    setQuantities((prev) => ({ ...prev, [productId]: newQty }));
    onUpdateQuantity?.(productId, newQty);
  };

  const decreaseQuantity = (productId: string) => {
    const current = quantities[productId] || 1;
    if (current > 1) {
      const newQty = current - 1;
      setQuantities((prev) => ({ ...prev, [productId]: newQty }));
      onUpdateQuantity?.(productId, newQty);
    }
  };

  // Mağazaların genel analizi (Kargo hesapları, eksik ürün sayısı ve toplam maliyetler)
  const storeAnalyses = useMemo(() => {
    const analysis = {} as Record<
      StoreName,
      {
        productTotal: number;
        availableCount: number;
        missingCount: number;
        shippingCost: number;
        finalTotal: number;
        isAllAvailable: boolean;
      }
    >;

    STORE_ORDER.forEach((storeName) => {
      let productTotal = 0;
      let availableCount = 0;

      items.forEach((product) => {
        const store = product.stores?.find((s) => s.name === storeName);
        const price = Number(store?.price);
        const qty = quantities[product.id] || 1;

        if (store && Number.isFinite(price) && price > 0) {
          productTotal += price * qty;
          availableCount += 1;
        }
      });

      const missingCount = items.length - availableCount;
      const shipInfo = MARKET_SHIPPING_INFO[storeName];

      // Kargo Ücreti Hesabı
      let shippingCost = 0;
      if (shoppingMode === "online" && productTotal > 0) {
        if (shipInfo.threshold === null || productTotal < shipInfo.threshold) {
          shippingCost = shipInfo.fee;
        }
      }

      analysis[storeName] = {
        productTotal,
        availableCount,
        missingCount,
        shippingCost,
        finalTotal: productTotal > 0 ? productTotal + shippingCost : 0,
        isAllAvailable: missingCount === 0 && availableCount > 0,
      };
    });

    return analysis;
  }, [items, quantities, shoppingMode]);

  // Akıllı Bölme Dağılımı (Her ürünü en ucuz satan marketle eşleştirir)
  const breakdown = useMemo<BreakdownItem[]>(() => {
    return items.map((product) => {
      const validStores = (product.stores || []).filter(
        (s) => Number.isFinite(Number(s.price)) && Number(s.price) > 0
      );
      const cheapestStore = validStores.reduce(
        (min, curr) => (Number(curr.price) < Number(min.price) ? curr : min),
        validStores[0] || { name: "Watsons", price: 0, url: "" }
      );

      const qty = quantities[product.id] || 1;
      const unitPrice = Number(cheapestStore?.price || 0);

      return {
        product,
        store: cheapestStore,
        quantity: qty,
        total: unitPrice * qty,
      };
    });
  }, [items, quantities]);

  const groupedBreakdown = useMemo(() => {
    return breakdown.reduce<Partial<Record<StoreName, BreakdownItem[]>>>((groups, item) => {
      const name = item.store.name as StoreName;
      if (!groups[name]) groups[name] = [];
      groups[name]?.push(item);
      return groups;
    }, {});
  }, [breakdown]);

  // Akıllı Bölme Toplam Maliyeti (Ürünler + Kullanılan mağazaların kargo ücretleri)
  const splitAnalysis = useMemo(() => {
    let productsTotal = 0;
    let totalShipping = 0;

    STORE_ORDER.forEach((storeName) => {
      const storeItems = groupedBreakdown[storeName] || [];
      if (storeItems.length > 0) {
        const subTotal = storeItems.reduce((acc, i) => acc + i.total, 0);
        productsTotal += subTotal;

        if (shoppingMode === "online") {
          const shipInfo = MARKET_SHIPPING_INFO[storeName];
          if (shipInfo.threshold === null || subTotal < shipInfo.threshold) {
            totalShipping += shipInfo.fee;
          }
        }
      }
    });

    return {
      productsTotal,
      totalShipping,
      finalTotal: productsTotal + totalShipping,
    };
  }, [groupedBreakdown, shoppingMode]);

  // Sepetteki TÜM ürünlerin bulunduğu en ucuz tek market
  const bestSingleStore = useMemo(() => {
    const eligible = STORE_ORDER.filter((name) => storeAnalyses[name].isAllAvailable);
    if (eligible.length === 0) return null;

    return eligible.reduce((best, curr) => {
      return storeAnalyses[curr].finalTotal < storeAnalyses[best].finalTotal ? curr : best;
    }, eligible[0]);
  }, [storeAnalyses]);

  const savings = useMemo(() => {
    if (bestSingleStore) {
      const diff = storeAnalyses[bestSingleStore].finalTotal - splitAnalysis.finalTotal;
      return Math.max(0, diff);
    }
    return 0;
  }, [bestSingleStore, storeAnalyses, splitAnalysis]);

  const totalProductQuantity = useMemo(() => {
    return items.reduce((total, product) => total + (quantities[product.id] || 1), 0);
  }, [items, quantities]);

  const maxBarValue = useMemo(() => {
    const allTotals = STORE_ORDER.map((s) => storeAnalyses[s].finalTotal).concat(splitAnalysis.finalTotal);
    return Math.max(...allTotals, 1);
  }, [storeAnalyses, splitAnalysis]);

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center font-sans p-4">
        <div className="text-center bg-white p-10 rounded-2xl shadow-sm border border-stone-200 max-w-md w-full">
          <div className="text-6xl mb-4">🛒</div>
          <div className="text-lg font-bold text-stone-800 mb-2">Sepetin boş</div>
          <div className="text-sm text-stone-500">
            Ürün kataloğundan veya AI asistanından sepetine ürün ekleyerek kargo dahil en ucuz kombinasyonları görebilirsin.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F0] font-sans pb-16 text-stone-800">
      {/* Üst başlık & Alışveriş Modu Seçimi */}
      <div className="bg-white border-b border-stone-200 px-6 py-4 sticky top-0 z-20 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-stone-900 m-0">Sepet Optimizasyonu</h1>
            <p className="text-xs text-stone-500 mt-1">
              {items.length} farklı ürün · {totalProductQuantity} adet · 4 mağazada anlık kargo ve fiyat karşılaştırması
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Online / Mağaza Seçim Butonları */}
            <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200">
              <button
                type="button"
                onClick={() => setShoppingMode("online")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  shoppingMode === "online"
                    ? "bg-white text-[#2D6A4F] shadow-xs"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                <Truck size={14} />
                Online (Kargolu)
              </button>
              <button
                type="button"
                onClick={() => setShoppingMode("physical")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  shoppingMode === "physical"
                    ? "bg-white text-[#2D6A4F] shadow-xs"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                <Store size={14} />
                Mağazadan Alacağım
              </button>
            </div>

            
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 mt-6">
        {/* Mağaza Özetleri (4'lü Kart Alanı) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
          {STORE_ORDER.map((storeName) => {
            const analysis = storeAnalyses[storeName];
            const isBest = bestSingleStore === storeName;
            const storeColor = STORE_COLORS[storeName] || { color: "#9CA3AF", light: "#F3F4F6" };
            const barPercentage = analysis.finalTotal > 0 ? (analysis.finalTotal / maxBarValue) * 100 : 0;

            return (
              <div
                key={storeName}
                className={`p-4 rounded-2xl border transition-all bg-white relative overflow-hidden ${
                  isBest ? "border-2 shadow-md" : "border-stone-200 shadow-xs"
                }`}
                style={{ borderColor: isBest ? storeColor.color : undefined }}
              >
                {isBest && (
                  <div className="absolute top-0 right-0 bg-emerald-700 text-white text-[9px] font-bold px-2.5 py-0.5 rounded-bl uppercase tracking-wider">
                    En İyi Tek Mağaza
                  </div>
                )}

                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: storeColor.color }}>
                    {storeName}
                  </span>
                </div>

                <div className="text-xl md:text-2xl font-bold text-stone-900">
                  {analysis.availableCount > 0 ? `₺${formatPrice(analysis.finalTotal)}` : "Stok Yok"}
                </div>

                {/* Eksik Ürün veya Mevcut Durum Bilgisi */}
                <div className="text-[11px] mt-1 font-medium min-h-[18px] flex items-center">
                  {analysis.missingCount > 0 ? (
                    <span className="text-amber-600 flex items-center gap-1">
                      <AlertCircle size={12} /> {analysis.missingCount} ürün eksik
                    </span>
                  ) : analysis.availableCount > 0 ? (
                    <span className="text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 size={12} /> Tüm ürünler var
                    </span>
                  ) : null}
                </div>

                {/* Kargo Ücreti Göstergesi */}
                {shoppingMode === "online" && analysis.availableCount > 0 && (
                  <div className="text-[11px] text-stone-500 mt-1 border-t border-stone-100 pt-1.5 flex justify-between">
                    <span>Kargo:</span>
                    <span className="font-semibold text-stone-700">
                      {analysis.shippingCost === 0 ? "Bedava 🎉" : `+₺${formatPrice(analysis.shippingCost)}`}
                    </span>
                  </div>
                )}

                {/* Yüzdesel Karşılaştırma Barı */}
                <div className="h-1.5 bg-stone-100 rounded-full mt-3 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.max(8, barPercentage)}%`,
                      backgroundColor: isBest ? storeColor.color : "#D6D6D2",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Ana İçerik Alanı: Sol (Ürünler) - Sağ (Stratejiler) */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* SOL TARAF: Sepetteki Ürünler */}
          <div className="w-full lg:w-[400px] flex-shrink-0 flex flex-col gap-3">
            <div className="text-xs font-bold text-stone-700 uppercase tracking-wider px-1">
              Sepetteki Ürünler ({items.length})
            </div>

            {items.map((product) => {
              const cheapestStore = getCheapestStore(product.stores);
              const quantity = quantities[product.id] || 1;
              const unitPrice = Number(cheapestStore.price);
              const productTotal = unitPrice * quantity;
              const storeColor = STORE_COLORS[cheapestStore.name as StoreName] || STORE_COLORS.Watsons;

              return (
                <div
                  key={product.id}
                  className="bg-white p-3.5 rounded-xl border border-stone-200 shadow-xs flex items-center gap-3.5"
                >
                  <img
                    src={product.image}
                    alt={product.title}
                    className="w-13 h-13 object-contain rounded-lg border border-stone-100 p-1 bg-stone-50 flex-shrink-0"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-bold uppercase text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded w-max">
                      {product.brand}
                    </div>
                    <div className="text-xs font-semibold text-stone-900 truncate mt-1">
                      {product.title}
                    </div>

                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: storeColor.light, color: storeColor.color }}
                      >
                        En ucuz: {cheapestStore.name}
                      </span>
                      <span className="text-xs font-bold text-stone-900">
                        ₺{formatPrice(productTotal)}
                      </span>
                      {quantity > 1 && (
                        <span className="text-[10px] text-stone-400">
                          (₺{formatPrice(unitPrice)} × {quantity})
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <button
                      type="button"
                      onClick={() => onRemoveItem(product.id)}
                      title="Sepetten kaldır"
                      className="text-stone-300 hover:text-rose-600 transition-colors p-1"
                    >
                      <Trash2 size={15} />
                    </button>

                    <div className="flex items-center border border-stone-200 rounded-lg bg-stone-50 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => decreaseQuantity(product.id)}
                        disabled={quantity <= 1}
                        className="w-6 h-6 flex items-center justify-center text-stone-600 hover:bg-stone-200 disabled:opacity-30 disabled:hover:bg-transparent font-bold text-xs"
                      >
                        −
                      </button>
                      <span className="w-5 text-center text-xs font-bold text-stone-800">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => increaseQuantity(product.id)}
                        className="w-6 h-6 flex items-center justify-center text-stone-600 hover:bg-stone-200 font-bold text-xs"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* SAĞ TARAF: En Uygun Alışveriş Kombinasyonu */}
          <div className="flex-1 w-full flex flex-col gap-4">
            <div className="text-xs font-bold text-stone-700 uppercase tracking-wider px-1">
              En Uygun Sepet Stratejisi
            </div>

            {/* Seçenek 1: AKILLI BÖLME */}
            <div
              onClick={() => setActiveOption("split")}
              className={`bg-white rounded-2xl border-2 transition-all cursor-pointer overflow-hidden shadow-xs ${
                activeOption === "split" ? "border-[#2D6A4F] ring-4 ring-[#2D6A4F]/10" : "border-stone-200"
              }`}
            >
              <div className="p-4 md:p-5 border-b border-stone-100 flex items-center justify-between gap-4 bg-stone-50/60">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-[#2D6A4F] flex items-center justify-center flex-shrink-0">
                    <TrendingDown size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-bold text-stone-900">Akıllı Bölme (Önerilen)</div>
                      <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                        Maksimum Tasarruf
                      </span>
                    </div>
                    <div className="text-xs text-stone-500 mt-0.5">
                      Her ürünü en ucuz olduğu mağazadan ayrı ayrı al
                    </div>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <div className="text-xl font-bold text-[#1B4332]">
                    ₺{formatPrice(splitAnalysis.finalTotal)}
                  </div>
                  {savings > 0 && (
                    <div className="text-xs font-bold text-emerald-600">
                      Tek kargoya göre ₺{formatPrice(savings)} tasarruf!
                    </div>
                  )}
                </div>
              </div>

              {/* Akıllı Bölme Kırılımları ve Satın Alma Linkleri */}
              <div className="p-4 md:p-5 grid grid-cols-1 md:grid-cols-2 gap-3">
                {STORE_ORDER.map((storeName) => {
                  const storeItems = groupedBreakdown[storeName];
                  if (!storeItems?.length) return null;
                  const storeColor = STORE_COLORS[storeName];
                  const productsSubTotal = storeItems.reduce((acc, i) => acc + i.total, 0);

                  let shipCost = 0;
                  if (shoppingMode === "online") {
                    const info = MARKET_SHIPPING_INFO[storeName];
                    if (info.threshold === null || productsSubTotal < info.threshold) {
                      shipCost = info.fee;
                    }
                  }

                  return (
                    <div
                      key={storeName}
                      className="p-3.5 rounded-xl border flex flex-col justify-between"
                      style={{ background: storeColor.light, borderColor: `${storeColor.color}33` }}
                    >
                      <div>
                        <div className="flex justify-between items-center mb-2 border-b border-black/5 pb-1.5">
                          <span className="font-bold text-xs uppercase" style={{ color: storeColor.color }}>
                            {storeName} ({storeItems.length} ürün)
                          </span>
                          <span className="font-bold text-xs text-stone-900">
                            ₺{formatPrice(productsSubTotal + shipCost)}
                          </span>
                        </div>
                        <ul className="space-y-1.5 mb-3">
                          {storeItems.map(({ product, quantity, total }) => (
                            <li key={product.id} className="text-[11px] text-stone-600 flex justify-between items-center">
                              <span className="truncate pr-2">
                                • {product.brand} {product.title.split(" ").slice(0, 2).join(" ")} {quantity > 1 ? `(x${quantity})` : ""}
                              </span>
                              <span className="font-semibold text-stone-800 flex-shrink-0">₺{formatPrice(total)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="pt-2 border-t border-black/5 flex items-center justify-between mt-auto">
                        <span className="text-[10px] text-stone-500 font-medium">
                          {shoppingMode === "online" ? (shipCost === 0 ? "🎉 Kargo Bedava" : `+₺${formatPrice(shipCost)} Kargo`) : "Mağazadan Alınacak"}
                        </span>

                        {/* Mağazanın Web Sitesine Yönlendiren Buton */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const targetStore = storeItems[0]?.product.stores?.find(
                            (s) => s.name === storeName
                                );
                                   if (targetStore?.url) window.open(targetStore.url, "_blank")
                          }}
                          className="flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-lg text-white shadow-xs hover:opacity-90 transition-opacity"
                          style={{ background: storeColor.color }}
                        >
                          <span>Siteden Al</span>
                          <ExternalLink size={11} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Seçenek 2: TEK MARKET (TEK KARGO) */}
            {bestSingleStore ? (
              <div
                onClick={() => setActiveOption("single")}
                className={`bg-white rounded-2xl border-2 transition-all cursor-pointer overflow-hidden shadow-xs ${
                  activeOption === "single" ? "border-[#2D6A4F] ring-4 ring-[#2D6A4F]/10" : "border-stone-200"
                }`}
              >
                <div className="p-4 md:p-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-stone-100 text-stone-600 flex items-center justify-center flex-shrink-0">
                      <ShoppingBag size={18} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-stone-900">
                        Tek Kargo / Mağaza ({bestSingleStore})
                      </div>
                      <div className="text-xs text-stone-500 mt-0.5">
                        Tüm ürünleri tek bir mağazadan eksiksiz sipariş et
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div className="text-xl font-bold text-stone-800">
                      ₺{formatPrice(storeAnalyses[bestSingleStore].finalTotal)}
                    </div>
                    {shoppingMode === "online" && (
                      <div className="text-[11px] text-stone-400">
                        {storeAnalyses[bestSingleStore].shippingCost === 0 ? "Kargo Bedava" : `+₺${formatPrice(storeAnalyses[bestSingleStore].shippingCost)} Kargo`}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-xs text-amber-800 flex items-center gap-2">
                <AlertCircle size={18} className="text-amber-600 flex-shrink-0" />
                <span>
                  Sepetinizdeki tüm ürünleri aynı anda stoklarında bulunduran tek bir mağaza yok. En mantıklı seçenek <strong>Akıllı Bölme</strong> ile alışveriş yapmaktır.
                </span>
              </div>
            )}

            {/* Bilgilendirme Notu */}
            <div className="flex items-start gap-2.5 p-3.5 bg-amber-50/60 rounded-xl border border-amber-200/60 text-xs text-amber-900">
              <Info size={15} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="m-0 leading-relaxed">
                Tüm fiyat karşılaştırmaları Supabase üzerinden gerçek zamanlı verilerle yapılmaktadır. Gratis için 150 TL üzeri ücretsiz kargo, diğer marketler için sabit kargo tarifeleri (Watsons: 74.90 TL, Rossmann: 69.90 TL, Mion: 54.90 TL) uygulanmıştır. Fiziksel mağazadan alacaksanız yukarıdaki moddan kargoyu kapatabilirsiniz.
              </p>
            </div>

            {/* Alt Toplam Özeti Banner'ı */}
            <div className="bg-gradient-to-br from-[#1B4332] to-[#2D6A4F] rounded-2xl p-5 text-white flex items-center justify-between shadow-md mt-2">
              <div>
                <div className="text-xs text-white/70 mb-1">Akıllı bölme ile tasarruf</div>
                <div className="text-2xl md:text-3xl font-bold">₺{formatPrice(savings)}</div>
              </div>

              <div className="text-right">
                <div className="text-xs text-white/70 mb-1">Toplam ({totalProductQuantity} adet)</div>
                <div className="text-xl md:text-2xl font-bold text-[#FFB7B2]">
                   ₺{formatPrice(splitAnalysis.finalTotal)}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}