import { useEffect, useMemo, useState } from "react";
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

function LineChart({
  historyByStore,
}: {
  historyByStore: Record<StoreName, { date: string; price: number }[]>;
}) {
  const width = 840;
  const height = 420;
  const padding = 36;

  const allPoints = Object.values(historyByStore).flat();
  if (allPoints.length === 0) {
    return (
      <div className="flex h-[420px] items-center justify-center rounded-2xl border border-dashed border-[#DDDAD3] bg-[#FAF9F5] text-sm text-[#777]">
        Bu ürün için fiyat geçmişi bulunamadı.
      </div>
    );
  }

  const prices = allPoints.map((item) => item.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const range = maxPrice - minPrice || 1;

  const dates = Array.from(new Set(allPoints.map((item) => item.date))).sort();
  const plotWidth = width - padding * 2;
  const plotHeight = height - padding * 2;

  const xForIndex = (index: number) => {
    if (dates.length <= 1) return padding + plotWidth / 2;
    return padding + (index / (dates.length - 1)) * plotWidth;
  };

  const yForPrice = (price: number) => padding + plotHeight - ((price - minPrice) / range) * plotHeight;

  return (
    <div className="overflow-x-auto">
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="min-w-full">
        {[0, 1, 2, 3].map((tick) => {
          const y = padding + (plotHeight / 3) * tick;
          return <line key={tick} x1={padding} x2={width - padding} y1={y} y2={y} stroke="#F0F0EC" strokeWidth={1} />;
        })}

        {(Object.keys(historyByStore) as StoreName[]).map((store) => {
          const color = STORE_COLORS[store].color;
          const series = historyByStore[store];
          if (!series.length) return null;

          const points = dates
            .map((date, index) => {
              const match = series.find((item) => item.date === date);
              if (!match) return null;
              return `${xForIndex(index)},${yForPrice(match.price)}`;
            })
            .filter(Boolean) as string[];

          const d = points.map((point, index) => `${index === 0 ? "M" : "L"}${point}`).join(" ");
          return (
            <g key={store}>
              <path d={d} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
              {points.map((point, index) => {
                const [x, y] = point.split(",").map(Number);
                return <circle key={`${store}-${index}`} cx={x} cy={y} r={3} fill={color} />;
              })}
            </g>
          );
        })}
      </svg>
    </div>
  );
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
          supabase
            .from("price_log")
            .select("m_id, price, date")
            .eq("p_id", pid)
            .order("date", { ascending: true }),
          supabase
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

  const { historyByStore, periodMin, periodMax, legendStores } = useMemo(() => {
    const showPredictions = range === "F15";

    const storeHistory: Record<StoreName, { date: string; price: number }[]> = {
      Watsons: [],
      Gratis: [],
      Mion: [],
      Rossmann: [],
    };

    for (const row of logs) {
      const store = MARKET_ID_TO_STORE[row.m_id];
      if (!store) continue;
      storeHistory[store].push({ date: row.date, price: Number(row.price) });
    }

    const rangeDef = RANGES.find((r) => r.key === range)!;
    const cutoff =
      rangeDef.days != null ? Date.now() - rangeDef.days * 24 * 60 * 60 * 1000 : null;

    const allHistDatesSet = new Set<string>();
    Object.values(storeHistory).forEach((arr) =>
      arr.forEach((p) => {
        if (!cutoff || new Date(p.date).getTime() >= cutoff) {
          allHistDatesSet.add(p.date);
        }
      }),
    );
    const histDates = Array.from(allHistDatesSet).sort();

    const lastHistDate = histDates.length > 0 ? new Date(histDates[histDates.length - 1]) : new Date();
    const futureDates: string[] = [];
    if (showPredictions) {
      for (let i = 1; i <= 15; i++) {
        const d = new Date(lastHistDate);
        d.setDate(d.getDate() + i);
        futureDates.push(d.toISOString().slice(0, 10));
      }
    }

    const legendStores: { name: StoreName; color: string }[] = [];
    const allValues: number[] = [];

    const stores = Object.keys(storeHistory) as StoreName[];

    for (const store of stores) {
      const color = STORE_COLORS[store]?.color || STORE_COLORS.Mion.color;
      const map = new Map(storeHistory[store].map((p) => [p.date, p.price]));

      const histData = histDates.map((d) => map.get(d) ?? null);
      histData.forEach((v) => {
        if (v != null && (v as number) > 0) allValues.push(v as number);
      });

      legendStores.push({ name: store, color });

      if (showPredictions) {
        const pred = predictions.find((p) => MARKET_ID_TO_STORE[p.m_id] === store);
        if (pred && Array.isArray(pred.future_prices)) {
          const futureVals = pred.future_prices.slice(0, 15);
          futureVals.forEach((v) => {
            if (v != null && v > 0) allValues.push(v);
          });
        }
      }
    }

    const periodMin = allValues.length > 0 ? Math.min(...allValues) : 0;
    const periodMax = allValues.length > 0 ? Math.max(...allValues) : 0;
    return { historyByStore: storeHistory, periodMin, periodMax, legendStores };
  }, [logs, predictions, range]);

  if (!isOpen) return null;

  const hasData = logs.length > 0 || predictions.length > 0;

  const predictionInsights = predictions
    .map((p) => ({
      store: MARKET_ID_TO_STORE[p.m_id],
      insight: p.insight_text,
      signal: p.signal,
      confidence: p.confidence,
      changePct: p.change_pct,
    }))
    .filter((item) => Boolean(item.insight || item.signal));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-[28px] bg-white shadow-[0_30px_120px_rgba(0,0,0,0.25)]">
        <div className="flex items-start justify-between border-b border-[#E8E8E2] px-6 py-5">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#2D6A4F]">Fiyat analizi</div>
            <h2 className="mt-1 text-2xl font-bold text-[#1A1A1A]">{productTitle || "Ürün fiyat geçmişi"}</h2>
            <p className="mt-1 text-sm text-[#666]">Mağaza bazlı geçmiş fiyatlar ve tahminler</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E8E8E2] bg-white text-[#666] transition-colors hover:bg-[#FAF9F5]"
          >
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[calc(90vh-88px)] overflow-y-auto px-6 py-5">
          <div className="flex flex-wrap gap-2">
            {RANGES.map((item) => {
              const active = range === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => setRange(item.key)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                    active ? "bg-[#1B4332] text-white" : "border border-[#D5D5CF] bg-white text-[#555] hover:bg-[#FAF9F5]"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.7fr)_360px]">
            <div className="rounded-[24px] border border-[#E8E8E2] bg-white p-4 shadow-sm">
              {loading ? (
                <div className="flex h-[360px] items-center justify-center text-sm text-[#666]">Veriler yükleniyor...</div>
              ) : (
                <LineChart historyByStore={historyByStore} />
              )}
            </div>

            <div className="space-y-4">
              <div className="rounded-[24px] border border-[#E8E8E2] bg-[#FAF9F5] p-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6F6F67]">Özet</div>
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-2xl bg-white p-3 shadow-sm">
                    <div className="text-[10px] uppercase tracking-[0.16em] text-[#8C8C84]">Min</div>
                    <div className="mt-1 text-lg font-bold text-[#1A1A1A]">{periodMin ? fmtTL(periodMin) : "-"}</div>
                  </div>
                  <div className="rounded-2xl bg-white p-3 shadow-sm">
                    <div className="text-[10px] uppercase tracking-[0.16em] text-[#8C8C84]">Max</div>
                    <div className="mt-1 text-lg font-bold text-[#1A1A1A]">{periodMax ? fmtTL(periodMax) : "-"}</div>
                  </div>
                </div>
              </div>

              {predictionInsights.length > 0 && (
                <div className="rounded-[24px] border border-[#E8E8E2] bg-white p-4 shadow-sm">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6F6F67]">İçgörüler</div>
                  <div className="mt-3 space-y-3">
                    {predictionInsights.map((item) => {
                      const signalKey = (item.signal || "stable").toLowerCase();
                      const signal = SIGNAL_LABELS[signalKey] || SIGNAL_LABELS.stable;
                      return (
                        <div key={`${item.store}-${item.signal}`} className="rounded-2xl border border-[#E8E8E2] p-3">
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-sm font-semibold text-[#1A1A1A]">{item.store}</div>
                            <span className="rounded-full px-2.5 py-1 text-[10px] font-semibold" style={{ background: signal.bg, color: signal.color }}>
                              {signal.label}
                            </span>
                          </div>
                          {item.insight && <p className="mt-2 text-sm leading-6 text-[#555]">{item.insight}</p>}
                          <div className="mt-2 flex items-center gap-3 text-[11px] text-[#777]">
                            {item.confidence != null && <span>Güven: %{Math.round(item.confidence * 100)}</span>}
                            {item.changePct != null && <span>Değişim: %{item.changePct.toFixed(1)}</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="rounded-[24px] border border-[#E8E8E2] bg-white p-4 shadow-sm">
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6F6F67]">Legend</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {legendStores.map((store) => (
                    <div key={store.name} className="rounded-full px-3 py-1 text-xs font-semibold" style={{ background: `${store.color}14`, color: store.color }}>
                      {store.name}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
