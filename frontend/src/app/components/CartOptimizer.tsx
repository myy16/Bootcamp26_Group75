import { useState } from 'react';
import { Trash2, ShoppingBag, TrendingDown, ExternalLink, Info, Share2, Heart } from 'lucide-react';
import { Product, getCheapestStore, getStoreTotals, STORE_COLORS, STORE_ORDER, StoreName, getCheapestTotal } from '../data';

interface CartOptimizerProps {
  items: Product[];
  onRemoveItem: (id: string) => void;
}

export function CartOptimizer({ items, onRemoveItem }: CartOptimizerProps) {
  const [quantities, setQuantities] = useState<Record<string, number>>(() =>
    Object.fromEntries(items.map((p) => [p.id, 1]))
  );
  const [activeOption, setActiveOption] = useState<'single' | 'split'>('split');

  if (items.length === 0) {
    return (
      <div style={{ minHeight: '100vh', background: '#F5F5F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🛒</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#1A1A1A', marginBottom: 8 }}>Sepetin boş</div>
          <div style={{ fontSize: 14, color: '#666' }}>Ürün kataloğundan veya AI asistanından ürün ekle</div>
        </div>
      </div>
    );
  }

  const storeTotals = getStoreTotals(items);
  const { total: splitTotal, breakdown } = getCheapestTotal(items);

  // Only a store that sells EVERY item in the cart can be a "single store" candidate.
  // Otherwise storeTotals[s] falls back to 0 for stores missing some items, which
  // incorrectly makes them look like the cheapest option.
  const eligibleStores = STORE_ORDER.filter((s) =>
    items.every((p) => p.stores.some((st) => st.name === s))
  );

  const cheapestSingleStore: { name: StoreName; total: number } | null =
    eligibleStores.length > 0
      ? eligibleStores.reduce<{ name: StoreName; total: number }>(
          (best, s) => (storeTotals[s] < best.total ? { name: s, total: storeTotals[s] } : best),
          { name: eligibleStores[0], total: storeTotals[eligibleStores[0]] }
        )
      : null;

  const savings = cheapestSingleStore
  ? Math.round(Math.max(0, cheapestSingleStore.total - splitTotal) * 100) / 100
  : 0;

  // For the top summary bar, only consider eligible stores' totals for the bar scale,
  // falling back to splitTotal if no store is eligible, so bars don't look broken.
  const maxTotal = Math.max(
    ...STORE_ORDER.map((s) => (eligibleStores.includes(s) ? storeTotals[s] : 0)),
    splitTotal,
    1
  );

  return (
    <div style={{ minHeight: '100vh', background: '#F5F5F0', fontFamily: 'Inter, sans-serif' }}>
      {/* Top bar */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E8E8E2', padding: '16px 32px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1A1A1A', margin: 0 }}>Sepet Optimizasyonu</h1>
          <p style={{ fontSize: 12, color: '#666', margin: '2px 0 0', fontWeight: 400 }}>
            {items.length} ürün · 4 mağazada en iyi kombinasyon
          </p>
        </div>
        <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1.5px solid #E0E0DA', background: '#FFFFFF', color: '#666', cursor: 'pointer', fontSize: 13 }}>
          <Share2 size={14} /> Paylaş
        </button>
        <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1.5px solid #E0E0DA', background: '#FFFFFF', color: '#666', cursor: 'pointer', fontSize: 13 }}>
          <Heart size={14} /> Favorilere Ekle
        </button>
      </div>

      {/* Store summary bar */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E8E8E2', padding: '0 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
          {STORE_ORDER.map((store) => {
            const isEligible = eligibleStores.includes(store);
            const total = storeTotals[store];
            const isBest = cheapestSingleStore !== null && store === cheapestSingleStore.name;
            const storeColor = STORE_COLORS[store];
            const barPct = isEligible ? (total / maxTotal) * 100 : 0;
            return (
              <div
                key={store}
                style={{
                  padding: '16px 20px',
                  borderRight: '1px solid #F0F0EC',
                  background: isBest ? storeColor.light : 'transparent',
                  position: 'relative',
                }}
              >
                {isBest && (
                  <div
                    style={{
                      position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                      background: storeColor.color,
                    }}
                  />
                )}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div
                    style={{
                      fontSize: 12, fontWeight: 700, color: isBest ? storeColor.color : '#999',
                      textTransform: 'uppercase', letterSpacing: '0.3px',
                    }}
                  >
                    {store}
                  </div>
                  {isBest && (
                    <span style={{ fontSize: 9, background: storeColor.color, color: '#FFFFFF', padding: '2px 7px', borderRadius: 20, fontWeight: 700 }}>
                      EN İYİ
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 22, fontWeight: 700, color: isBest ? storeColor.color : '#1A1A1A', letterSpacing: '-0.5px', marginBottom: 6 }}>
                  {isEligible ? `₺${total}` : 'Stok yok'}
                </div>
                {/* Bar */}
                <div style={{ height: 4, borderRadius: 2, background: '#EEEEE8', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%', width: isEligible ? `${100 - barPct + 30}%` : '0%', maxWidth: '100%', borderRadius: 2,
                      background: isBest ? storeColor.color : '#DDDDD8',
                    }}
                  />
                </div>
                <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>Kargo dahil değil</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main content */}
      <div style={{ display: 'flex', gap: 24, padding: '28px 32px', alignItems: 'flex-start' }}>
        {/* Left: Product list */}
        <div style={{ flex: '0 0 380px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1A1A1A', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>
            Sepetteki Ürünler
          </div>
          {items.map((product) => {
            const cheapest = getCheapestStore(product.stores);
            const qty = quantities[product.id] || 1;
            const storeColor = STORE_COLORS[cheapest.name];
            return (
              <div
                key={product.id}
                style={{
                  background: '#FFFFFF', borderRadius: 12, border: '1.5px solid #E8E8E2',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.06)', padding: '14px 16px',
                  display: 'flex', alignItems: 'center', gap: 14,
                }}
              >
                <img
                  src={product.image}
                  alt={product.title}
                  style={{ width: 52, height: 52, borderRadius: 8, objectFit: 'cover', border: '1px solid #F0F0EC', flexShrink: 0 }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 10, color: '#2D6A4F', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{product.brand}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A', marginTop: 1, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {product.title}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    <span style={{ fontSize: 10, background: storeColor.light, color: storeColor.color, padding: '2px 7px', borderRadius: 20, fontWeight: 500 }}>
                      {cheapest.name}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#1A1A1A' }}>₺{cheapest.price}</span>
                  </div>
                </div>
                {/* Quantity */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button
                    onClick={() => setQuantities((q) => ({ ...q, [product.id]: Math.max(1, (q[product.id] || 1) - 1) }))}
                    style={{ width: 26, height: 26, borderRadius: 6, border: '1.5px solid #E0E0DA', background: '#FFFFFF', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}
                  >−</button>
                  <span style={{ fontSize: 13, fontWeight: 600, width: 20, textAlign: 'center' }}>{qty}</span>
                  <button
                    onClick={() => setQuantities((q) => ({ ...q, [product.id]: (q[product.id] || 1) + 1 }))}
                    style={{ width: 26, height: 26, borderRadius: 6, border: '1.5px solid #E0E0DA', background: '#FFFFFF', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}
                  >+</button>
                </div>
                <button
                  onClick={() => onRemoveItem(product.id)}
                  style={{ padding: '6px', borderRadius: 6, border: 'none', background: 'transparent', color: '#CCC', cursor: 'pointer' }}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            );
          })}
        </div>

        {/* Right: Optimization panel */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1A1A1A', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>
            En Uygun Sepet
          </div>

          {/* Option A: Single store */}
          {cheapestSingleStore ? (
            <div
              onClick={() => setActiveOption('single')}
              style={{
                background: '#FFFFFF', borderRadius: 12,
                border: activeOption === 'single' ? '2px solid #2D6A4F' : '1.5px solid #E8E8E2',
                boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                overflow: 'hidden', cursor: 'pointer',
                transition: 'border-color 0.15s ease',
              }}
            >
              <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid #F0F0EC' }}>
                <ShoppingBag size={16} style={{ color: '#666' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#1A1A1A' }}>Tek Kargo</div>
                  <div style={{ fontSize: 12, color: '#666' }}>Tüm ürünleri {cheapestSingleStore.name}'ten al</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#1A1A1A' }}>₺{cheapestSingleStore.total}</div>
                  <div style={{ fontSize: 11, color: '#999' }}>+ kargo ücreti</div>
                </div>
              </div>
              {/* Per-item breakdown */}
              <div style={{ padding: '10px 18px' }}>
                {items.map((p) => {
                  const storePrice = p.stores.find((s) => s.name === cheapestSingleStore.name)!;
                  return (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 12, color: '#666', borderBottom: '1px dashed #F0F0EC' }}>
                      <span>{p.brand} {p.title.split(' ')[0]}</span>
                      <span style={{ fontWeight: 500, color: '#1A1A1A' }}>₺{storePrice?.price || 0}</span>
                    </div>
                  );
                })}
              </div>
              <div style={{ padding: '10px 18px', textAlign: 'right' }}>
                <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 8, border: 'none', background: '#2D6A4F', color: '#FFFFFF', cursor: 'pointer', fontSize: 13, fontWeight: 600, marginLeft: 'auto' }}>
                  <ExternalLink size={13} /> {cheapestSingleStore.name}'e Git
                </button>
              </div>
            </div>
          ) : (
            <div style={{ background: '#FFFFFF', borderRadius: 12, border: '1.5px solid #E8E8E2', boxShadow: '0 4px 16px rgba(0,0,0,0.06)', padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <ShoppingBag size={16} style={{ color: '#999' }} />
              <div style={{ fontSize: 13, color: '#666' }}>
                Sepetteki tüm ürünleri satan tek bir mağaza yok. En iyi seçenek: <strong>Akıllı Bölme</strong>.
              </div>
            </div>
          )}

          {/* Option B: Maximum savings */}
          <div
            onClick={() => setActiveOption('split')}
            style={{
              background: '#FFFFFF', borderRadius: 12,
              border: activeOption === 'split' ? '2px solid #2D6A4F' : '1.5px solid #E8E8E2',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              overflow: 'hidden', cursor: 'pointer',
              position: 'relative',
              transition: 'border-color 0.15s ease',
            }}
          >
            {/* Tag */}
            <div
              style={{
                position: 'absolute', top: 14, right: 16,
                background: '#FFB7B2', color: '#1B4332',
                borderRadius: 20, padding: '4px 12px',
                fontSize: 11, fontWeight: 700,
              }}
            >
              Maksimum Tasarruf
            </div>

            <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid #F0F0EC' }}>
              <TrendingDown size={16} style={{ color: '#2D6A4F' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1A1A1A' }}>Akıllı Bölme</div>
                <div style={{ fontSize: 12, color: '#666' }}>Her ürünü en ucuz mağazadan al</div>
              </div>
              <div style={{ textAlign: 'right', paddingRight: 80 }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#1B4332' }}>₺{splitTotal}</div>
                <div style={{ fontSize: 11, color: '#52B788', fontWeight: 600 }}>
                  {savings > 0 ? `₺${savings} tasarruf!` : 'En uygun fiyat'}
                </div>
              </div>
            </div>

            {/* Per-store breakdown */}
            <div style={{ padding: '12px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(() => {
                const groupedByStore: Record<string, typeof breakdown> = {};
                for (const b of breakdown) {
                  const key = b.store.name;
                  if (!groupedByStore[key]) groupedByStore[key] = [];
                  groupedByStore[key].push(b);
                }
                return Object.entries(groupedByStore).map(([storeName, storeItems]) => {
                  const storeColor = STORE_COLORS[storeName as StoreName];
                  const storeTotal = storeItems.reduce((s, b) => s + b.store.price, 0);
                  return (
                    <div key={storeName} style={{ padding: '10px 12px', borderRadius: 8, background: storeColor.light, border: `1px solid ${storeColor.color}22` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: storeColor.color, textTransform: 'uppercase' }}>
                          {storeName}
                        </span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#1A1A1A' }}>₺{storeTotal}</span>
                      </div>
                      {storeItems.map(({ product }) => (
                        <div key={product.id} style={{ fontSize: 11.5, color: '#555', paddingLeft: 4 }}>
                          · {product.brand} {product.title.split(' ').slice(0, 2).join(' ')}
                        </div>
                      ))}
                    </div>
                  );
                });
              })()}
            </div>

            {/* Checkout buttons */}
            <div style={{ padding: '10px 18px 14px', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {Object.keys(
                breakdown.reduce<Record<string, boolean>>((acc, b) => { acc[b.store.name] = true; return acc; }, {})
              ).map((storeName) => {
                const storeColor = STORE_COLORS[storeName as StoreName];
                return (
                  <button
                    key={storeName}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '8px 16px', borderRadius: 8, border: 'none',
                      background: storeColor.color, color: '#FFFFFF',
                      cursor: 'pointer', fontSize: 12.5, fontWeight: 600,
                    }}
                  >
                    <ExternalLink size={12} /> {storeName}'e Git
                  </button>
                );
              })}
            </div>
          </div>

          {/* Commission disclosure */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, padding: '10px 14px', background: '#FFFBF0', borderRadius: 8, border: '1px solid #F5E4A8' }}>
            <Info size={13} style={{ color: '#B8860B', flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 11, color: '#8B6914', margin: 0, lineHeight: 1.5 }}>
              Bu öneriler iş birlikleri içerebilir. Tüm fiyat karşılaştırmaları gerçek zamanlı veriye dayanmaktadır.
            </p>
          </div>

          {/* Total savings summary */}
          <div
            style={{
              background: 'linear-gradient(135deg, #1B4332 0%, #2D6A4F 100%)',
              borderRadius: 12, padding: '20px 24px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>Akıllı bölme ile tasarruf</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#FFFFFF', letterSpacing: '-0.5px' }}>₺{savings}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>Toplam (bölünmüş)</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#FFB7B2' }}>₺{splitTotal}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
