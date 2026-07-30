import React, { useEffect, useMemo, useState } from "react";
import {
  Trash2,
  ShoppingBag,
  TrendingDown,
  ExternalLink,
  Info,
  Truck,
  Store,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Package,
  ChevronDown,
  ChevronUp,
  Minus,
  Plus,
  HelpCircle,
  ArrowRight,
  CircleDot,
} from "lucide-react";
import { Product, getCheapestStore, STORE_COLORS, STORE_ORDER, StoreName } from "../data";

interface CartOptimizerProps {
  items: Product[];
  onRemoveItem: (id: string) => void;
  onUpdateQuantity?: (id: string, newQuantity: number) => void;
}

interface BreakdownItem {
  product: Product;
  store: Product["stores"][number];
  quantity: number;
  total: number;
}

const MARKET_SHIPPING_INFO: Record<StoreName, { fee: number; threshold: number | null; label: string }> = {
  Watsons: { fee: 74.90, threshold: null, label: "74,90 TL" },
  Gratis: { fee: 69.50, threshold: 150, label: "150 TL üzeri bedava" },
  Mion: { fee: 54.90, threshold: null, label: "54,90 TL" },
  Rossmann: { fee: 69.90, threshold: null, label: "69,90 TL" },
};

const formatPrice = (price: number) => {
  return price.toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// Bir ürünün belirli bir marketteki fiyatını bul
const getStorePrice = (product: Product, storeName: StoreName): number | null => {
  const store = product.stores?.find((s) => s.name === storeName);
  const price = Number(store?.price);
  return store && Number.isFinite(price) && price > 0 ? price : null;
};

// Bir ürünün en ucuz alternatif marketini bul (belirli bir market hariç)
const getBestAlternative = (product: Product, excludeStore: StoreName): { name: StoreName; price: number } | null => {
  const alternatives = (product.stores || [])
    .filter((s) => s.name !== excludeStore && Number.isFinite(Number(s.price)) && Number(s.price) > 0)
    .sort((a, b) => a.price - b.price);
  return alternatives.length > 0 ? { name: alternatives[0].name, price: alternatives[0].price } : null;
};

export function CartOptimizer({
  items,
  onRemoveItem,
  onUpdateQuantity,
}: CartOptimizerProps) {
  const [shoppingMode, setShoppingMode] = useState<"online" | "physical">("online");
  const [activeOption, setActiveOption] = useState<"single" | "split">("split");
  const [expandedStore, setExpandedStore] = useState<StoreName | null>(null);
  const [showMatrix, setShowMatrix] = useState(true);
  const [tooltipStore, setTooltipStore] = useState<StoreName | null>(null);

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

  // Bir markette hangi ürünler eksik?
  const getMissingProducts = (storeName: StoreName): Product[] => {
    return items.filter((product) => getStorePrice(product, storeName) === null);
  };

  // Bir markette hangi ürünler mevcut?
  const getAvailableProducts = (storeName: StoreName): Product[] => {
    return items.filter((product) => getStorePrice(product, storeName) !== null);
  };

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
        missingProducts: Product[];
        availableProducts: Product[];
      }
    >;

    STORE_ORDER.forEach((storeName) => {
      let productTotal = 0;
      let availableCount = 0;
      const missingProducts: Product[] = [];

      items.forEach((product) => {
        const price = getStorePrice(product, storeName);
        const qty = quantities[product.id] || 1;

        if (price !== null) {
          productTotal += price * qty;
          availableCount += 1;
        } else {
          missingProducts.push(product);
        }
      });

      const missingCount = items.length - availableCount;
      const shipInfo = MARKET_SHIPPING_INFO[storeName];

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
        missingProducts,
        availableProducts: getAvailableProducts(storeName),
      };
    });

    return analysis;
  }, [items, quantities, shoppingMode]);

  const breakdown = useMemo<BreakdownItem[]>(() => {
    return items.map((product) => {
      const validStores = (product.stores || []).filter(
        (s) => Number.isFinite(Number(s.price)) && Number(s.price) > 0
      );
      const cheapestStore = validStores.reduce(
        (min, curr) => (Number(curr.price) < Number(min.price) ? curr : min),
        validStores[0] || { name: "Watsons", price: 0 }
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

    return { productsTotal, totalShipping, finalTotal: productsTotal + totalShipping };
  }, [groupedBreakdown, shoppingMode]);

  const bestSingleStore = useMemo(() => {
    const eligible = STORE_ORDER.filter((name) => storeAnalyses[name].isAllAvailable);
    if (eligible.length === 0) return null;
    return eligible.reduce((best, curr) => {
      return storeAnalyses[curr].finalTotal < storeAnalyses[best].finalTotal ? curr : best;
    }, eligible[0]);
  }, [storeAnalyses]);

  // En İyi Tek Mağaza'nın neden kazandığını açıklayan tooltip metni
  const getBestStoreTooltip = (storeName: StoreName): string => {
    const analysis = storeAnalyses[storeName];
    if (!analysis.isAllAvailable) {
      return `${storeName}: ${analysis.missingCount} ürün eksik olduğu için karşılaştırmaya dahil edilemedi.`;
    }
    const diff = analysis.finalTotal - (bestSingleStore ? storeAnalyses[bestSingleStore].finalTotal : 0);
    if (diff === 0) {
      return `${storeName}: Tüm ürünleri tek seferde en ucuz fiyata sunan mağaza.`;
    }
    return `${storeName}: Tüm ürünleri stoklarında bulunduruyor ancak toplam ${formatPrice(diff)} TL daha pahalı.`;
  };

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

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center font-sans p-4">
        <div className="text-center bg-white p-12 rounded-3xl shadow-sm border border-stone-200 max-w-md w-full">
          <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">🛒</div>
          <h2 className="text-xl font-bold text-stone-800 mb-2">Sepetin boş</h2>
          <p className="text-sm text-stone-500 leading-relaxed">
            Ürün kataloğundan veya asistandan sepetine ürün ekleyerek kargo dahil en ucuz kombinasyonları görebilirsin.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F0] font-sans pb-20 text-stone-800">
      {/* === HEADER === */}
      <div className="bg-white border-b border-stone-200 px-6 py-5 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-stone-900 m-0 tracking-tight">Sepet Optimizasyonu</h1>
            <p className="text-sm text-stone-500 mt-1">
              <span className="font-semibold text-stone-700">{items.length}</span> ürün ·{" "}
              <span className="font-semibold text-stone-700">{totalProductQuantity}</span> adet · 4 market karşılaştırması
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200">
              <button
                type="button"
                onClick={() => setShoppingMode("online")}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  shoppingMode === "online"
                    ? "bg-white text-[#2D6A4F] shadow-sm"
                    : "text-stone-500 hover:text-stone-900"
                }`}
              >
                <Truck size={14} />
                Kargolu
              </button>
              <button
                type="button"
                onClick={() => setShoppingMode("physical")}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  shoppingMode === "physical"
                    ? "bg-white text-[#2D6A4F] shadow-sm"
                    : "text-stone-500 hover:text-stone-900"
                }`}
              >
                <Store size={14} />
                Mağazadan
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 mt-8 space-y-8">
 {/* === MARKET DETAY KARTLARI === */}
        <div>
          <h2 className="text-sm font-bold text-stone-700 uppercase tracking-wider mb-4 px-1">Market Detayları & Eksik Ürünler</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {STORE_ORDER.map((storeName) => {
              const analysis = storeAnalyses[storeName];
              const isBest = bestSingleStore === storeName;
              const isExpanded = expandedStore === storeName;
              const storeColor = STORE_COLORS[storeName] || { color: "#9CA3AF", light: "#F3F4F6" };
              const missingProducts = analysis.missingProducts;
              const shipInfo = MARKET_SHIPPING_INFO[storeName];

              // Kargo eşiği hesaplaması
              const remainingForFreeShipping = shipInfo.threshold !== null && analysis.productTotal > 0
                ? Math.max(0, shipInfo.threshold - analysis.productTotal)
                : null;

              return (
                <div
                  key={storeName}
                  className={`bg-white rounded-2xl border-2 transition-all overflow-hidden relative ${
                    isBest ? "border-[#2D6A4F] shadow-md" : "border-stone-200 shadow-sm"
                  }`}
                >
                  {/* En İyi Tek Mağaza rozeti + Tooltip */}
                  {isBest && (
                    <div className="absolute top-0 right-0 bg-[#2D6A4F] text-white text-[9px] font-bold px-2.5 py-1 rounded-bl-xl uppercase tracking-wider z-10 flex items-center gap-1">
                      En İyi Tek Mağaza
                      <div
                        className="relative"
                        onMouseEnter={() => setTooltipStore(storeName)}
                        onMouseLeave={() => setTooltipStore(null)}
                      >
                        <HelpCircle size={11} className="cursor-help opacity-80 hover:opacity-100" />
                        {tooltipStore === storeName && (
                          <div className="absolute top-full right-0 mt-2 w-56 bg-stone-900 text-white text-[11px] p-3 rounded-xl shadow-xl z-50 leading-relaxed">
                            {getBestStoreTooltip(storeName)}
                            <div className="absolute -top-1 right-2 w-2 h-2 bg-stone-900 rotate-45"></div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="p-4 relative" style={{ background: isBest ? `${storeColor.light}40` : "white" }}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-3 h-3 rounded-full" style={{ background: storeColor.color }} />
                      <span className="text-sm font-bold" style={{ color: storeColor.color }}>{storeName}</span>
                    </div>

                    <div className="text-2xl font-bold text-stone-900">
                      {analysis.availableCount > 0 ? `₺${formatPrice(analysis.finalTotal)}` : "Stok Yok"}
                    </div>

                    {/* Mevcut / Eksik oranı */}
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-2 bg-stone-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${(analysis.availableCount / items.length) * 100}%`,
                            backgroundColor: analysis.isAllAvailable ? "#2D6A4F" : "#D97706",
                          }}
                        />
                      </div>
                      <span className={`text-[11px] font-bold ${analysis.isAllAvailable ? "text-emerald-700" : "text-amber-700"}`}>
                        {analysis.availableCount}/{items.length}
                      </span>
                    </div>
                    <div className="text-[10px] text-stone-500 mt-1">
                      {analysis.availableCount} ürün mevcut · {analysis.missingCount} eksik
                    </div>

                    {/* Kargo eşiği ilerlemesi */}
                    {shoppingMode === "online" && shipInfo.threshold !== null && analysis.productTotal > 0 && (
                      <div className="mt-3 p-2.5 rounded-xl bg-stone-50 border border-stone-100">
                        <div className="flex justify-between items-center text-[11px] mb-1">
                          <span className="text-stone-600">Kargo eşiği</span>
                          <span className="font-bold text-stone-800">
                            {remainingForFreeShipping === 0 ? "Bedava! 🎉" : `₺${formatPrice(shipInfo.threshold)}`}
                          </span>
                        </div>
                        {remainingForFreeShipping !== null && remainingForFreeShipping > 0 ? (
                          <>
                            <div className="h-1.5 bg-stone-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 rounded-full transition-all"
                                style={{ width: `${Math.min(100, (analysis.productTotal / shipInfo.threshold) * 100)}%` }}
                              />
                            </div>
                            <p className="text-[10px] text-emerald-700 font-semibold mt-1.5">
                              ₺{formatPrice(remainingForFreeShipping)} daha ekleyin, kargo bedava olsun
                            </p>
                          </>
                        ) : remainingForFreeShipping === 0 ? (
                          <p className="text-[10px] text-emerald-700 font-semibold mt-1">Kargo ücreti ödemiyorsunuz!</p>
                        ) : null}
                      </div>
                    )}

                    {/* Kargo bilgisi (eşik yoksa) */}
                    {shoppingMode === "online" && shipInfo.threshold === null && analysis.availableCount > 0 && (
                      <div className="mt-2 text-[11px] text-stone-500">
                        Kargo: <span className="font-semibold text-stone-700">₺{formatPrice(analysis.shippingCost)}</span>
                      </div>
                    )}
                  </div>

                  {/* Eksik Ürünler — Tıklanabilir Accordion */}
                  {missingProducts.length > 0 && (
                    <div className="border-t border-stone-100">
                      <button
                        onClick={() => setExpandedStore(isExpanded ? null : storeName)}
                        className="w-full flex items-center justify-between p-3 bg-amber-50/40 hover:bg-amber-50/60 transition-colors"
                      >
                        <span className="text-[11px] font-bold text-amber-800 flex items-center gap-1.5">
                          <AlertCircle size={12} />
                          {missingProducts.length} ürün eksik
                        </span>
                        {isExpanded ? <ChevronUp size={14} className="text-amber-600" /> : <ChevronDown size={14} className="text-amber-600" />}
                      </button>

                      {isExpanded && (
                        <div className="p-3 bg-amber-50/20 space-y-2">
                          {missingProducts.map((product) => {
                            const alternative = getBestAlternative(product, storeName);
                            return (
                              <div key={product.id} className="flex items-start gap-2 p-2 rounded-lg bg-white border border-amber-100">
                                <img src={product.image} alt="" className="w-8 h-8 object-contain rounded bg-stone-50 p-0.5 border border-stone-100 shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <div className="text-[11px] font-semibold text-stone-800 truncate">{product.title}</div>
                                  {alternative ? (
                                    <div className="text-[10px] text-stone-500 mt-0.5">
                                      En ucuz: <span className="font-bold" style={{ color: STORE_COLORS[alternative.name]?.color || "#9CA3AF" }}>
                                        {alternative.name} ₺{formatPrice(alternative.price)}
                                      </span>
                                    </div>
                                  ) : (
                                    <div className="text-[10px] text-stone-400 mt-0.5">Hiçbir markette stokta yok</div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Mevcut Ürünler Özeti */}
                  {analysis.availableCount > 0 && (
                    <div className="border-t border-stone-100 p-3">
                      <div className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1 mb-2">
                        <CheckCircle2 size={12} /> Bu marketteki ürünler ({analysis.availableCount})
                      </div>
                      <ul className="space-y-1">
                        {analysis.availableProducts.slice(0, 3).map((product) => {
                          const price = getStorePrice(product, storeName)!;
                          const qty = quantities[product.id] || 1;
                          return (
                            <li key={product.id} className="flex items-center justify-between text-[11px]">
                              <span className="text-stone-600 truncate pr-2">{product.title}</span>
                              <span className="font-semibold text-stone-900 shrink-0">₺{formatPrice(price * qty)}</span>
                            </li>
                          );
                        })}
                        {analysis.availableProducts.length > 3 && (
                          <li className="text-[10px] text-stone-400 pl-1">+{analysis.availableProducts.length - 3} ürün daha...</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        {/* === TASARRUF HERO BANNER === */}
        <div className="bg-gradient-to-r from-[#1B4332] to-[#2D6A4F] rounded-3xl p-6 md:p-8 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <TrendingDown size={28} className="text-[#FFB7B2]" />
            </div>
            <div>
              <div className="text-sm text-white/80 font-medium">Akıllı bölme ile ödeyeceğiniz tutar</div>
              <div className="text-3xl md:text-4xl font-bold mt-0.5">₺{formatPrice(splitAnalysis.finalTotal)}</div>
            </div>
          </div>

          <div className="flex items-center gap-6 md:gap-10">
            {bestSingleStore && (
              <div className="text-center md:text-right">
                <div className="text-xs text-white/70">Tek mağazada en ucuz</div>
                <div className="text-lg font-bold mt-0.5">₺{formatPrice(storeAnalyses[bestSingleStore].finalTotal)}</div>
                <div className="text-xs text-white/60">{bestSingleStore}</div>
              </div>
            )}
            {savings > 0 && (
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-6 py-4 text-center">
                <div className="text-xs text-[#FFB7B2] font-semibold uppercase tracking-wider">Tasarruf</div>
                <div className="text-2xl md:text-3xl font-bold text-[#FFB7B2]">₺{formatPrice(savings)}</div>
              </div>
            )}
          </div>
        </div>

        {/* === FİYAT MATRİSİ === */}
        <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
          <button
            onClick={() => setShowMatrix(!showMatrix)}
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-stone-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Package size={18} className="text-stone-500" />
              <div className="text-left">
                <h2 className="text-sm font-bold text-stone-900">Fiyat Karşılaştırma Matrisi</h2>
                <p className="text-xs text-stone-500">Her ürünün tüm marketlerdeki fiyatını tek tabloda gör</p>
              </div>
            </div>
            {showMatrix ? <ChevronUp size={18} className="text-stone-400" /> : <ChevronDown size={18} className="text-stone-400" />}
          </button>

          {showMatrix && (
            <div className="overflow-x-auto border-t border-stone-100">
              <table className="w-full text-sm">
  <thead>
    <tr className="bg-stone-50/80">
      {/* 1. ÇÖP İKONU BAŞLIĞI: Genişlik w-12 (yaklaşık 48px) yapılarak ideal boşluk sağlandı */}
      <th className="w-12 px-2 py-3 text-center"></th>

      <th className="text-left px-6 py-3 text-xs font-bold text-stone-500 uppercase tracking-wider w-[280px]">Ürün</th>
      {STORE_ORDER.map((storeName) => {
        const color = (STORE_COLORS[storeName] || { color: "#9CA3AF" }).color;
        return (
          <th key={storeName} className="text-center px-4 py-3 min-w-[120px]">
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color }}>{storeName}</span>
          </th>
        );
      })}
      
      {/* ADET BAŞLIĞI */}
      <th className="text-center px-6 py-3 text-xs font-bold text-stone-500 uppercase tracking-wider">Adet</th>
    </tr>
  </thead>
  <tbody className="divide-y divide-stone-100">
    {items.map((product) => {
      const qty = quantities[product.id] || 1;
      const prices = STORE_ORDER.map((s) => getStorePrice(product, s));
      const validPrices = prices.filter((p): p is number => p !== null);
      const minPrice = validPrices.length > 0 ? Math.min(...validPrices) : 0;

      return (
        <tr key={product.id} className="hover:bg-stone-50/50 transition-colors">
          
          {/* 2. ÇÖP İKONU HÜCRESİ: align-middle hücreyi Y ekseninde, flex ve justify-center butonu X ekseninde ortalar */}
          <td className="w-12 px-2 py-4 align-middle">
            <button
              onClick={() => onRemoveItem(product.id)}
              className="flex items-center justify-center mx-auto text-stone-400 hover:text-rose-500 transition-colors p-1.5 rounded-md hover:bg-rose-50"
              title="Kaldır"
            >
              <Trash2 size={16} />
            </button>
          </td>

          <td className="px-6 py-4">
            <div className="flex items-center gap-3">
              <img src={product.image} alt="" className="w-10 h-10 object-contain rounded-lg bg-stone-100 p-1" />
              <div className="min-w-0">
                <div className="text-xs font-semibold text-stone-900 truncate">{product.title}</div>
                <div className="text-[11px] text-stone-500">{product.brand}</div>
              </div>
            </div>
          </td>
          
          {/* ... Fiyat Sütunları (Değişiklik yok) ... */}
          {STORE_ORDER.map((storeName, idx) => {
            const price = prices[idx];
            const isCheapest = price !== null && price === minPrice && validPrices.length > 1;
            const isOnlyOption = price !== null && validPrices.length === 1;

            return (
              <td key={storeName} className="px-4 py-4 text-center align-middle">
                {/* Mevcut fiyat render mantığınız */}
                {price !== null ? (
                  <div className="inline-flex flex-col items-center">
                    <span className={`font-bold ${isCheapest ? "text-[#2D6A4F]" : "text-stone-700"}`}>
                      ₺{formatPrice(price)}
                    </span>
                    {isCheapest && (
                      <span className="text-[9px] font-bold bg-[#EBF5F0] text-[#2D6A4F] px-1.5 py-0.5 rounded mt-1">
                        EN UCUZ
                      </span>
                    )}
                    {isOnlyOption && (
                      <span className="text-[9px] font-bold bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded mt-1">
                        TEK SEÇENEK
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="inline-flex flex-col items-center text-stone-300">
                    <XCircle size={16} className="text-stone-300" />
                    <span className="text-[10px] mt-0.5">Stok Yok</span>
                  </div>
                )}
              </td>
            );
          })}

          {/* 3. ADET HÜCRESİ: text-right silindi, justify-end yerine justify-center eklendi, ml-auto yerine mx-auto eklendi */}
          <td className="px-6 py-4 align-middle">
            <div className="flex items-center justify-center mx-auto border border-stone-200 rounded-lg bg-stone-50 overflow-hidden w-max">
              <button onClick={() => decreaseQuantity(product.id)} disabled={qty <= 1} className="w-7 h-7 flex items-center justify-center text-stone-600 hover:bg-stone-200 disabled:opacity-30 text-xs font-bold">
                <Minus size={12} />
              </button>
              <span className="w-6 text-center text-xs font-bold text-stone-800">{qty}</span>
              <button onClick={() => increaseQuantity(product.id)} className="w-7 h-7 flex items-center justify-center text-stone-600 hover:bg-stone-200 text-xs font-bold">
                <Plus size={12} />
              </button>
            </div>
          </td>

        </tr>
      );
    })}
  </tbody>
  {/* ... TFOOT Kısmı (Değişiklik yok) ... */}
</table>
            </div>
          )}
        </div>

       

        {/* === ALIŞVERİŞ STRATEJİLERİ === */}
       

          {/* Sağ: Strateji Seçenekleri */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-sm font-bold text-stone-700 uppercase tracking-wider px-1">
              Önerilen Alışveriş Stratejisi
            </h2>

            {/* AKILLI BÖLME */}
            <div
              onClick={() => setActiveOption("split")}
              className={`bg-white rounded-3xl border-2 transition-all cursor-pointer overflow-hidden ${
                activeOption === "split"
                  ? "border-[#2D6A4F] ring-4 ring-[#2D6A4F]/10 shadow-lg"
                  : "border-stone-200 shadow-sm hover:border-stone-300"
              }`}
            >
              <div className="p-5 md:p-6 border-b border-stone-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-emerald-50/50 to-transparent">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-[#2D6A4F] flex items-center justify-center flex-shrink-0">
                    <TrendingDown size={22} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-stone-900">Akıllı Bölme</h3>
                      <span className="bg-[#2D6A4F] text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide">
                        Önerilen
                      </span>
                      {savings > 0 && (
                        <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-2 py-1 rounded-full">
                          ₺{formatPrice(savings)} tasarruf
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-500 mt-0.5">Her ürünü en ucuz olduğu marketten al</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-2xl font-bold text-[#1B4332]">₺{formatPrice(splitAnalysis.finalTotal)}</div>
                  <div className="text-[11px] text-stone-500">{Object.keys(groupedBreakdown).length} farklı market</div>
                </div>
              </div>

              <div className="p-5 md:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {STORE_ORDER.map((storeName) => {
                  const storeItems = groupedBreakdown[storeName];
                  if (!storeItems?.length) return null;
                  const storeColor = STORE_COLORS[storeName] || { color: "#9CA3AF", light: "#F3F4F6" };
                  const subTotal = storeItems.reduce((acc, i) => acc + i.total, 0);

                  let shipCost = 0;
                  if (shoppingMode === "online") {
                    const info = MARKET_SHIPPING_INFO[storeName];
                    if (info.threshold === null || subTotal < info.threshold) {
                      shipCost = info.fee;
                    }
                  }

                  return (
                    <div
                      key={storeName}
                      className="rounded-2xl border p-4 flex flex-col"
                      style={{ background: storeColor.light, borderColor: `${storeColor.color}25` }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: storeColor.color }} />
                          <span className="font-bold text-sm" style={{ color: storeColor.color }}>{storeName}</span>
                          <span className="text-[10px] bg-white/80 px-1.5 py-0.5 rounded text-stone-600 font-medium">
                            {storeItems.length} ürün
                          </span>
                        </div>
                        <span className="font-bold text-sm text-stone-900">₺{formatPrice(subTotal + shipCost)}</span>
                      </div>

                      <ul className="space-y-2 mb-3 flex-1">
                        {storeItems.map(({ product, quantity, total }) => (
                          <li key={product.id} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2 min-w-0">
                              <img src={product.image} alt="" className="w-5 h-5 object-contain rounded bg-white p-0.5" />
                              <span className="text-stone-700 truncate">{product.title}</span>
                              {quantity > 1 && <span className="text-stone-400 shrink-0">×{quantity}</span>}
                            </div>
                            <span className="font-semibold text-stone-900 shrink-0 ml-2">₺{formatPrice(total)}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="pt-2 border-t border-black/5 flex items-center justify-between">
                        <span className="text-[10px] text-stone-500 font-medium">
                          {shoppingMode === "online"
                            ? shipCost === 0
                              ? "🎉 Kargo Bedava"
                              : `Kargo: ₺${formatPrice(shipCost)}`
                            : "Mağazadan alınacak"}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const targetStore = storeItems[0]?.product.stores?.find((s) => s.name === storeName);
                            if (targetStore?.url) window.open(targetStore.url, "_blank");
                          }}
                          className="flex items-center gap-1 text-[11px] font-bold px-3 py-1.5 rounded-lg text-white hover:opacity-90 transition-opacity"
                          style={{ background: storeColor.color }}
                        >
                          Siteden Al <ExternalLink size={10} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* TEK MARKET */}
            {bestSingleStore ? (
              <div
                onClick={() => setActiveOption("single")}
                className={`bg-white rounded-3xl border-2 transition-all cursor-pointer overflow-hidden ${
                  activeOption === "single"
                    ? "border-[#2D6A4F] ring-4 ring-[#2D6A4F]/10 shadow-lg"
                    : "border-stone-200 shadow-sm hover:border-stone-300"
                }`}
              >
                <div className="p-5 md:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-600 flex items-center justify-center flex-shrink-0">
                      <ShoppingBag size={22} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-stone-900">Tek Marketten Al</h3>
                      <p className="text-xs text-stone-500 mt-0.5">
                        Tüm ürünleri <span className="font-semibold text-stone-700">{bestSingleStore}</span> üzerinden tek seferde sipariş et
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-2xl font-bold text-stone-800">
                      ₺{formatPrice(storeAnalyses[bestSingleStore].finalTotal)}
                    </div>
                    {shoppingMode === "online" && (
                      <div className="text-[11px] text-stone-500">
                        {storeAnalyses[bestSingleStore].shippingCost === 0
                          ? "Kargo bedava"
                          : `Kargo: ₺${formatPrice(storeAnalyses[bestSingleStore].shippingCost)}`}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl flex items-start gap-3">
                <AlertCircle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-bold text-amber-900">Tek mağaza seçeneği yok</div>
                  <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                    Sepetinizdeki tüm ürünleri aynı anda stoklarında bulunduran tek bir mağaza yok. <strong>Akıllı Bölme</strong> ile en uygun fiyatları yakalayabilirsiniz.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* === BİLGİLENDİRME === */}
        <div className="flex items-start gap-3 p-4 bg-stone-100/50 rounded-2xl border border-stone-200 text-xs text-stone-600 leading-relaxed">
          <Info size={16} className="text-stone-400 flex-shrink-0 mt-0.5" />
          <p>
            Fiyatlar Supabase üzerinden gerçek zamanlı çekilmektedir. Gratis'te 150 TL üzeri kargo bedavadır.
            Watsons: 74,90 TL, Rossmann: 69,90 TL, Mion: 54,90 TL sabit kargo ücreti uygulanır.
            Fiziksel mağaza seçeneğinde kargo maliyetleri hesaplanmaz.
          </p>
        </div>
      </div>
    
  );
}