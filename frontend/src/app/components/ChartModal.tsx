import { useEffect, useMemo, useState } from "react";
import ReactECharts from "echarts-for-react";
import { X, ArrowDown, ArrowUp } from "lucide-react";
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

  useEffect(() => {
    if (!isOpen || !productId || !supabase) return;

    async function fetchData() {
      setLoading(true);
      try {
        const pid = Number(productId);
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
      } catch (err) {
        console.error("Fiyat geçmişi çekilirken hata:", err);
        setLogs([]);
        setPredictions([]);
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

    const option = {
      color: legendStores.map((s) => s.color),
      tooltip: {
        trigger: "axis",
        valueFormatter: (v: number) =>
          v != null ? fmtTL(v) : "-",
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
            {productTitle || "Ürün"} Fiyat Analizi
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-200 hover:text-gray-700 transition-colors shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
    

          {/* Aralık butonları */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-5">
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

          {loading ? (
            <div className="h-[320px] flex items-center justify-center text-sm text-gray-400">
              Fiyat geçmişi yükleniyor...
            </div>
          ) : !hasData ? (
            <div className="h-[320px] flex items-center justify-center text-sm text-gray-400 text-center px-6">
              Bu ürün için henüz yeterli fiyat geçmişi veya tahmin
              verisi bulunmuyor.
            </div>
          ) : (
            <ReactECharts
              option={option}
              style={{ height: 340, width: "100%" }}
              notMerge
            />
          )}

          {/* Özet: dönem içi en düşük / en yüksek fiyat (yan yana) */}
          {hasData && periodMin > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="flex items-center gap-3 bg-[#F5F5F0] rounded-xl p-3.5">
                <div className="w-9 h-9 rounded-full bg-[#EBF5F0] flex items-center justify-center shrink-0">
                  <ArrowDown size={18} className="text-[#52B788]" />
                </div>
                <div>
                  <div className="text-[11px] text-gray-500">
                    Dönem içi en düşük
                  </div>
                  <div className="text-[16px] font-bold text-[#1A1A1A]">
                    {fmtTL(periodMin)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-[#F5F5F0] rounded-xl p-3.5">
                <div className="w-9 h-9 rounded-full bg-[#FDECEC] flex items-center justify-center shrink-0">
                  <ArrowUp size={18} className="text-[#E63946]" />
                </div>
                <div>
                  <div className="text-[11px] text-gray-500">
                    Dönem içi en yüksek
                  </div>
                  <div className="text-[16px] font-bold text-[#1A1A1A]">
                    {fmtTL(periodMax)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tahmin içgörüleri (insight_text, signal, confidence) */}
          {hasData && predictionInsights.length > 0 && (
            <div className="mt-8 space-y-2.5">
              <div className="text-[13px] font-bold text-[#1A1A1A]">
                Yapay Zeka Tahmini
              </div>
              {predictionInsights.map((p) => {
                const storeColor =
                  STORE_COLORS[p.store as StoreName]?.color ||
                  STORE_COLORS.Mion.color;
                const sig =
                  (p.signal && SIGNAL_LABELS[p.signal]) ||
                  SIGNAL_LABELS.stable;
                return (
                  <div
                    key={p.store}
                    className="bg-[#F5F5F0] rounded-xl p-3.5"
                  >
                    <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ background: storeColor }}
                        />
                        <span className="text-[13px] font-bold text-[#1A1A1A]">
                          {p.store}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{
                            background: sig.bg,
                            color: sig.color,
                          }}
                        >
                          {sig.label}
                        </span>
                        {p.confidence != null && (
                          <span className="text-[10px] font-semibold text-gray-500">
                            Güven: %
                            {Number(p.confidence).toFixed(0)}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-[12px] text-gray-600 leading-relaxed">
                      {p.insight}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
