import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import * as echarts from "echarts";
import { X, ArrowDown, ArrowUp, BookOpen, FlaskConical, Target, TrendingUp, Info } from "lucide-react";
import { supabase } from "../supabase";
import { STORE_COLORS, StoreName } from "../data";


const MARKET_ID_TO_STORE: Record<number, StoreName> = {
  1: "Watsons",
  2: "Gratis",
  3: "Mion",
  4: "Rossmann",
};

interface PriceLogRow {
  m_id: number;
  price: number;
  date: string;
}

interface PredictionRow {
  m_id: number;
  future_prices: number[];
  insight_text?: string;
  signal?: string;
  confidence?: number;
  change_pct?: number;
  min_price?: number;
  max_price?: number;
}

interface ChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string | null;
  productTitle?: string;
}

type RangeKey = "6M" | "1M" | "1W" | "F15";

const RANGES: { key: RangeKey; label: string; days: number | null }[] = [
  { key: "6M", label: "6 Ay", days: 180 },
  { key: "1M", label: "1 Ay", days: 30 },
  { key: "1W", label: "1 Hafta", days: 7 },
  { key: "F15", label: "Gelecek 15 Gün", days: 45 },
];

const SIGNAL_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  discount: { label: "İndirim Fırsatı", color: "#2D6A4F", bg: "#EBF5F0" },
  stable: { label: "Sabit Seyir", color: "#8A6D00", bg: "#FBF4DC" },
  increase: { label: "Artış Bekleniyor", color: "#C3002E", bg: "#FDECEC" },
};

function EChartsView({
  option,
  style,
  notMerge,
}: {
  option: echarts.EChartsOption;
  style?: CSSProperties;
  notMerge?: boolean;
}) {
  const chartRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    const chart = echarts.init(chartRef.current);
    chart.setOption(option, { notMerge: Boolean(notMerge) });

    const handleResize = () => chart.resize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.dispose();
    };
  }, [option, notMerge]);

  return <div ref={chartRef} style={style} />;
}

function fmtDate(d: Date): string {
  // Ay adı yazıyla (ör. "18 Haz")
  return d.toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "short",
  });
}

function fmtTL(v: number): string {
  return `${v.toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ₺`;
}

export function ChartModal({
  isOpen,
  onClose,
  productId,
  productTitle,
}: ChartModalProps) {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<PriceLogRow[]>([]);
  const [predictions, setPredictions] = useState<PredictionRow[]>([]);
  const [range, setRange] = useState<RangeKey>("F15");
  const [activeTab, setActiveTab] = useState<"price" | "description" | "ingredients">("price");
  const [productDetails, setProductDetails] = useState<{
    description: string;
    ingredients: string;
    suitable_for: string;
  } | null>(null);

  useEffect(() => {
    if (!isOpen || !productId || !supabase) return;

    async function fetchData() {
      setLoading(true);
      try {
        const pid = Number(productId);
        
        // Fetch logs and predictions
        const [logRes, predRes] = await Promise.all([
          supabase!
            .from("price_log")
            .select("m_id, price, date")
            .eq("p_id", pid)
            .order("date", { ascending: true }),
          supabase!
            .from("predictions")
            .select(
              "m_id, future_prices, insight_text, signal, confidence, change_pct, min_price, max_price",
            )
            .eq("p_id", pid),
        ]);

        setLogs((logRes.data as PriceLogRow[]) || []);
        setPredictions((predRes.data as PredictionRow[]) || []);

        // Safely fetch product details (handles database exceptions gracefully if columns do not exist yet)
        let prodDetails = null;
        try {
          const prodRes = await supabase!
            .from("products")
            .select("description, ingredients, suitable_for")
            .eq("id", pid)
            .maybeSingle();
          if (prodRes && prodRes.data) {
            prodDetails = prodRes.data;
          }
        } catch (prodErr) {
          console.warn("Product details not available (migration pending?):", prodErr);
        }
        setProductDetails(prodDetails);

      } catch (err) {
        console.error("Fiyat geçmişi çekilirken hata:", err);
        setLogs([]);
        setPredictions([]);
        setProductDetails(null);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [isOpen, productId]);

  const { option, periodMin, periodMax, legendStores } = useMemo(() => {
    const showPredictions = range === "F15";

    // Mağaza bazında geçmiş verileri grupla
    const storeHistory: Record<
      string,
      { date: string; price: number }[]
    > = {};

    for (const row of logs) {
      const store = MARKET_ID_TO_STORE[row.m_id];
      if (!store) continue;
      if (!storeHistory[store]) storeHistory[store] = [];
      storeHistory[store].push({
        date: row.date,
        price: Number(row.price),
      });
    }

    // Aralık filtresi (geçmiş gün sayısı)
    const rangeDef = RANGES.find((r) => r.key === range)!;
    const cutoff =
      rangeDef.days != null
        ? Date.now() - rangeDef.days * 24 * 60 * 60 * 1000
        : null;

    // Tüm geçmiş tarihleri topla
    const allHistDatesSet = new Set<string>();
    Object.values(storeHistory).forEach((arr) =>
      arr.forEach((p) => {
        if (!cutoff || new Date(p.date).getTime() >= cutoff) {
          allHistDatesSet.add(p.date);
        }
      }),
    );
    const histDates = Array.from(allHistDatesSet).sort();

    // Son geçmiş tarihten itibaren 15 günlük tahmin tarihleri üret
    // (yalnızca "Gelecek 15 Gün" görünümünde)
    const lastHistDate =
      histDates.length > 0
        ? new Date(histDates[histDates.length - 1])
        : new Date();
    const futureDates: string[] = [];
    if (showPredictions) {
      for (let i = 1; i <= 15; i++) {
        const d = new Date(lastHistDate);
        d.setDate(d.getDate() + i);
        futureDates.push(d.toISOString().slice(0, 10));
      }
    }

    const axisDates = [...histDates, ...futureDates];
    const axisLabels = axisDates.map((d) => fmtDate(new Date(d)));

    const series: any[] = [];
    const legendStores: { name: StoreName; color: string }[] = [];
    const allValues: number[] = [];

    const stores = Object.keys(storeHistory) as StoreName[];

    for (const store of stores) {
      const color =
        STORE_COLORS[store]?.color || STORE_COLORS.Mion.color;
      const map = new Map(
        storeHistory[store].map((p) => [p.date, p.price]),
      );

      // Geçmiş çizgi (düz)
      const histData = axisDates.map((d, i) =>
        i < histDates.length ? (map.get(d) ?? null) : null,
      );
      histData.forEach((v) => {
        if (v != null && (v as number) > 0)
          allValues.push(v as number);
      });

      const lastReal = [...histData]
        .reverse()
        .find((v) => v != null) as number | undefined;

      legendStores.push({ name: store, color });

      // Geçmiş serisi — legend'de bu mağaza adıyla görünür
      series.push({
        name: store,
        type: "line",
        smooth: true,
        symbol: "none",
        connectNulls: false,
        lineStyle: { color, width: 2 },
        itemStyle: { color },
        data: histData,
      });

      // Tahmin serisi — yalnızca "Gelecek 15 Gün" görünümünde
      if (showPredictions) {
        const pred = predictions.find(
          (p) => MARKET_ID_TO_STORE[p.m_id] === store,
        );
        if (pred && Array.isArray(pred.future_prices)) {
          const futureVals = pred.future_prices.slice(0, 15);
          const predData = axisDates.map((_, i) => {
            if (i === histDates.length - 1)
              return lastReal ?? null;
            if (i >= histDates.length) {
              return futureVals[i - histDates.length] ?? null;
            }
            return null;
          });
          futureVals.forEach((v) => {
            if (v != null && v > 0) allValues.push(v);
          });

          series.push({
            name: `${store} · tahmin`, // legend'de gizlenecek
            type: "line",
            smooth: true,
            symbol: "none",
            connectNulls: true,
            lineStyle: { color, width: 2, type: "dashed" },
            itemStyle: { color },
            data: predData,
          });
        }
      }
    }

    const periodMin =
      allValues.length > 0 ? Math.min(...allValues) : 0;
    const periodMax =
      allValues.length > 0 ? Math.max(...allValues) : 0;

    // Legend yalnızca mağaza adlarını (renkli nokta ile) gösterir
    const legendData = legendStores.map((s) => s.name);

    const option: echarts.EChartsOption = {
      color: legendStores.map((s) => s.color),
      tooltip: {
        trigger: "axis",
        valueFormatter: (value: echarts.EChartsOption) => {
          const v = Array.isArray(value) ? value[0] : value;
          return v != null && typeof v === "number" ? fmtTL(v) : "-";
        },
      },
      legend: {
        bottom: 0,
        type: "scroll",
        icon: "circle",
        data: legendData,
        textStyle: { fontSize: 12, color: "#444" },
      },
      grid: {
        top: 24,
        left: 8,
        right: 24,
        bottom: 48,
        containLabel: true,
      },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: axisLabels,
        axisLine: { lineStyle: { color: "#E0E0DA" } },
        axisLabel: { color: "#999", fontSize: 10 },
        splitLine: { show: false },
      },
      yAxis: {
        type: "value",
        scale: true,
        axisLabel: {
          color: "#999",
          fontSize: 10,
          formatter: (v: number) =>
            `${v.toLocaleString("tr-TR")} ₺`,
        },
        splitLine: { lineStyle: { color: "#F0F0EC" } },
      },
      series:
        histDates.length > 0
          ? series.map((s) =>
              // "Gelecek 15 Gün" görünümünde tahmin bölgesini vurgula
              s.name.includes("tahmin") && showPredictions
                ? {
                    ...s,
                    markArea: {
                      silent: true,
                      itemStyle: {
                        color: "rgba(82,183,136,0.06)",
                      },
                      data: [
                        [
                          {
                            xAxis:
                              axisLabels[histDates.length - 1],
                          },
                          {
                            xAxis:
                              axisLabels[axisLabels.length - 1],
                          },
                        ],
                      ],
                    },
                  }
                : s,
            )
          : [],
    };

    return { option, periodMin, periodMax, legendStores };
  }, [logs, predictions, range]);

  if (!isOpen) return null;

  const hasData = logs.length > 0 || predictions.length > 0;

  // Tahmin içgörülerini (insight) mağaza bazında hazırla
  const predictionInsights = predictions
    .map((p) => ({
      store: MARKET_ID_TO_STORE[p.m_id],
      insight: p.insight_text,
      signal: p.signal,
      confidence: p.confidence,
      changePct: p.change_pct,
    }))
    .filter((p) => p.store && p.insight);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-8 overflow-hidden font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Başlık */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E8E2] bg-[#1B4332]">
          <h2 className="text-base font-bold text-white pr-4 line-clamp-1">
            {productTitle || "Ürün"} Detay & Analiz
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-white/10 hover:text-white transition-colors shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Bar */}
        <div className="flex border-b border-[#E8E8E2] bg-[#F5F5F0]">
          <button
            onClick={() => setActiveTab("price")}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-[13.5px] font-semibold transition-all border-b-2 ${
              activeTab === "price"
                ? "border-[#1B4332] text-[#1B4332] bg-white font-bold"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-white/40"
            }`}
          >
            <TrendingUp size={15} /> Fiyat Analizi
          </button>
          <button
            onClick={() => setActiveTab("description")}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-[13.5px] font-semibold transition-all border-b-2 ${
              activeTab === "description"
                ? "border-[#1B4332] text-[#1B4332] bg-white font-bold"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-white/40"
            }`}
          >
            <BookOpen size={15} /> Ürün Açıklaması
          </button>
          <button
            onClick={() => setActiveTab("ingredients")}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-[13.5px] font-semibold transition-all border-b-2 ${
              activeTab === "ingredients"
                ? "border-[#1B4332] text-[#1B4332] bg-white font-bold"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-white/40"
            }`}
          >
            <FlaskConical size={15} /> İçindekiler (Bileşenler)
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="h-[320px] flex items-center justify-center text-sm text-gray-400 animate-pulse">
              Yükleniyor...
            </div>
          ) : activeTab === "price" ? (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-center gap-2">
                {RANGES.map((r) => {
                  const active = range === r.key;
                  return (
                    <button
                      key={r.key}
                      onClick={() => setRange(r.key)}
                      className={`px-4 py-2 rounded-lg border text-[13px] font-medium transition-colors ${
                        active
                          ? "border-[#2D6A4F] text-[#2D6A4F] bg-[#EBF5F0]"
                          : "border-[#E0E0DA] text-[#666] bg-white hover:bg-gray-50"
                      }`}
                    >
                      {r.label}
                    </button>
                  );
                })}
              </div>

              {!hasData ? (
                <div className="h-[300px] flex items-center justify-center text-sm text-gray-400 text-center px-6">
                  Bu ürün için henüz yeterli fiyat geçmişi veya tahmin verisi bulunmuyor.
                </div>
              ) : (
                <>
                  <EChartsView
                    option={option}
                    style={{ height: 340, width: "100%" }}
                    notMerge
                  />

                  {periodMin > 0 && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-3 bg-[#F5F5F0] rounded-xl p-3.5">
                        <div className="w-9 h-9 rounded-full bg-[#EBF5F0] flex items-center justify-center shrink-0">
                          <ArrowDown size={18} className="text-[#52B788]" />
                        </div>
                        <div>
                          <div className="text-[11px] text-gray-500">Dönem içi en düşük</div>
                          <div className="text-[16px] font-bold text-[#1A1A1A]">{fmtTL(periodMin)}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 bg-[#F5F5F0] rounded-xl p-3.5">
                        <div className="w-9 h-9 rounded-full bg-[#FDECEC] flex items-center justify-center shrink-0">
                          <ArrowUp size={18} className="text-[#E63946]" />
                        </div>
                        <div>
                          <div className="text-[11px] text-gray-500">Dönem içi en yüksek</div>
                          <div className="text-[16px] font-bold text-[#1A1A1A]">{fmtTL(periodMax)}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {predictionInsights.length > 0 && (
                    <div className="space-y-2.5 pt-2">
                      <div className="text-[13px] font-bold text-[#1A1A1A]">Yapay Zeka Tahmini</div>
                      {predictionInsights.map((p) => {
                        const storeColor =
                          STORE_COLORS[p.store as StoreName]?.color || STORE_COLORS.Mion.color;
                        const sig =
                          (p.signal && SIGNAL_LABELS[p.signal]) || SIGNAL_LABELS.stable;
                        return (
                          <div key={p.store} className="bg-[#F5F5F0] rounded-xl p-3.5">
                            <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
                              <div className="flex items-center gap-2">
                                <span
                                  className="w-2.5 h-2.5 rounded-full shrink-0"
                                  style={{ background: storeColor }}
                                />
                                <span className="text-[13px] font-bold text-[#1A1A1A]">{p.store}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span
                                  className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                  style={{ background: sig.bg, color: sig.color }}
                                >
                                  {sig.label}
                                </span>
                                {p.confidence != null && (
                                  <span className="text-[10px] font-semibold text-gray-500">
                                    Güven: %{Number(p.confidence).toFixed(0)}
                                  </span>
                                )}
                              </div>
                            </div>
                            <p className="text-[12px] text-gray-600 leading-relaxed">{p.insight}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          ) : activeTab === "description" ? (
            // --- URUN ACIKLAMASI TABI ---
            <div className="space-y-5">
              {productDetails && (productDetails.description || productDetails.suitable_for) ? (
                <>
                  {/* Cilt Tipi & Bilgi Doğruluğu Kartı */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-[#E8E8E2] bg-[#F4FAF6] p-4 flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#EBF5F0] text-[#2D6A4F] flex items-center justify-center shrink-0">
                        <Target size={20} />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-[0.1em] text-[#2D6A4F]">Hedef Cilt / Saç Tipi</h3>
                        <p className="mt-1.5 text-sm font-semibold text-[#1A1A1A]">
                          {productDetails.suitable_for && productDetails.suitable_for !== "Bilinmiyor" && productDetails.suitable_for !== "Metinden çıkarılan cilt/saç tipi bilgisi..."
                            ? productDetails.suitable_for
                            : "Tüm Cilt Tiplerine Uygun"}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-[#E8E8E2] bg-[#FAF9F5] p-4 flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                        <Info size={20} />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-[0.1em] text-amber-800">Bilgi Doğruluğu</h3>
                        <p className="mt-1.5 text-[12px] leading-relaxed text-gray-600">
                          Detay sayfalarından kazınıp yapay zekayla ayıklanmıştır.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Açıklama İçerik Kartı */}
                  <div className="rounded-2xl border border-[#E8E8E2] bg-white p-5 shadow-sm space-y-3">
                    <h3 className="text-[13px] font-bold text-[#1A1A1A] flex items-center gap-2 border-b border-[#F0F0EC] pb-2">
                      <BookOpen size={16} className="text-[#2D6A4F]" /> Resmi Ürün Açıklaması
                    </h3>
                    <p className="text-sm leading-6 text-gray-600 font-normal">
                      {productDetails.description && productDetails.description !== "Metinden çıkarılan açıklama......"
                        ? productDetails.description
                        : "Resmi açıklama metninde bulunamadı veya henüz kazınmadı."}
                    </p>
                  </div>
                </>
              ) : (
                <div className="h-[200px] flex flex-col items-center justify-center text-sm text-gray-400 text-center px-6 border border-dashed border-[#E8E8E2] rounded-2xl bg-[#FCFBF9] space-y-2">
                  <div className="text-base font-bold text-gray-500">Ürün Açıklaması Bulunamadı</div>
                  <p className="max-w-md text-xs leading-relaxed text-gray-400">
                    Veritabanında bu ürün için henüz açıklama verisi bulunmuyor. Ürün detay kazıma pipeline'ı çalıştırıldığında bu alanlar otomatik olarak dolacaktır.
                  </p>
                </div>
              )}
            </div>
          ) : (
            // --- ICINDEKILER TABI ---
            <div className="space-y-6">
              {productDetails && productDetails.ingredients && productDetails.ingredients !== "Metinde bulunamadı" && productDetails.ingredients !== "Metinden çıkarılan içerik listesi......" ? (
                <div className="rounded-2xl border border-[#E8E8E2] bg-white p-5 shadow-sm space-y-3">
                  <h3 className="text-[13px] font-bold text-[#1A1A1A] flex items-center gap-2 border-b border-[#F0F0EC] pb-2">
                    <FlaskConical size={16} className="text-[#2D6A4F]" /> Formül İçerik Listesi (Ingredients)
                  </h3>
                  <div className="bg-[#F5F5F0] rounded-xl p-4 text-[13px] text-gray-700 leading-relaxed font-mono select-all max-h-[220px] overflow-y-auto">
                    {productDetails.ingredients}
                  </div>
                </div>
              ) : (
                <div className="h-[200px] flex flex-col items-center justify-center text-sm text-gray-400 text-center px-6 border border-dashed border-[#E8E8E2] rounded-2xl bg-[#FCFBF9] space-y-2">
                  <div className="text-base font-bold text-gray-500">İçindekiler Listesi Bulunamadı</div>
                  <p className="max-w-md text-xs leading-relaxed text-gray-400">
                    Bileşen listesi bu ürünün detay sayfasından ayıklanamadı veya henüz detay kazıma pipeline'ı çalıştırılmadı.
                  </p>
                </div>
              )}

              {/* UX Designer Önerileri & Gelecek Planı */}
              <div className="rounded-2xl border border-[#DCDBCF] bg-gradient-to-r from-[#FDFBF7] to-[#FAF8F2] p-5 shadow-sm space-y-3">
                <h4 className="text-[12px] font-bold text-[#1B4332] uppercase tracking-[0.05em] flex items-center gap-1.5">
                  💡 UX / UI Yol Haritası Önerileri (UX Scope)
                </h4>
                <p className="text-[12.5px] leading-relaxed text-gray-600">
                  Kullanıcı deneyimini mükemmelleştirmek amacıyla ilerleyen aşamalarda bu sekme altına eklenebilecek akıllı özellikler:
                </p>
                <ul className="text-[12px] text-gray-600 space-y-2 list-disc list-inside pl-1">
                  <li><strong>EWG Temiz İçerik Skoru:</strong> Formüldeki maddelerin 1-10 arası tehlike derecesini görsel bar grafik halinde puanlamak.</li>
                  <li><strong>Komedojenik (Gözenek Tıkama) Analizi:</strong> İçeriklerdeki akne tetikleyici kimyasalları tarayarak hassas ciltleri uyarmak.</li>
                  <li><strong>Akıllı Asit Çakışması Uyarısı:</strong> Sahip olduğunuz diğer kozmetiklerle aynı rutinde kullanıldığında (örn. Retinol + C Vitamini) oluşabilecek tahriş risklerini analiz etmek.</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}