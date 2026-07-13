import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, ShoppingBag, Check, TrendingDown, Clock, ChevronRight } from 'lucide-react';
import { ROUTINE_PRODUCTS, getCheapestStore, STORE_COLORS, Product, getStoreTotals } from '../data';

interface ChatPageProps {
  products?: Product[];
  onAddToCart: (product: Product) => void;
  cartItemIds: Set<string>;
  onNavigateToCart: () => void;
}

type ChatPhase = 'onboarding' | 'typing' | 'routine';

const SKIN_TYPES = ['Kuru', 'Yağlı', 'Karma', 'Hassas', 'Normal'];
const HAIR_TYPES = ['Kuru', 'Yağlı', 'Normal', 'Boyalı', 'Yıpranmış'];
const CONCERNS = ['Akne', 'Kırışıklık', 'Lekeler', 'Siyah Nokta', 'Kızarıklık', 'Gözenek'];
const BUDGET = 500;

const ROUTINE_STEPS = [
  { step: '01', label: 'TEMİZLEYİCİ', product: ROUTINE_PRODUCTS[0], note: 'kuru cilt için uygun' },
  { step: '02', label: 'NEMLENDİRİCİ', product: ROUTINE_PRODUCTS[1], note: 'kuru cilt için uygun' },
  { step: '03', label: 'GÜNEŞ KREMİ', product: ROUTINE_PRODUCTS[2], note: 'hassas cilt için uygun' },
];

// Store totals: Watsons ₺521 | Gratis ₺487 | Rossmann ₺498 | Mion ₺509
const STORE_TOTALS = getStoreTotals(ROUTINE_PRODUCTS);
const SPLIT_TOTAL = 475;
const CHEAPEST_SINGLE_STORE = 'Gratis';
const CHEAPEST_SINGLE_TOTAL = 487;

function TypingIndicator() {
  return (
    <div style={{ display: 'flex', gap: 5, alignItems: 'center', padding: '8px 4px' }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: 7, height: 7, borderRadius: '50%', background: '#2D6A4F',
            animation: `bounce 1.2s ${i * 0.2}s infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
          30% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

function OnboardingCard({
  onSave,
  onSkip,
}: {
  onSave: (skinTypes: string[], concerns: string[]) => void;
  onSkip: () => void;
}) {
  const [skinTypes, setSkinTypes] = useState<string[]>([]);
  const [hairTypes, setHairTypes] = useState<string[]>([]);
  const [concerns, setConcerns] = useState<string[]>([]);
  const [budget, setBudget] = useState(500);
  const [step, setStep] = useState(0);

  const toggle = (arr: string[], setArr: (a: string[]) => void, val: string) => {
    setArr(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);
  };

  const Chip = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
    <button
      onClick={onClick}
      style={{
        padding: '7px 14px', borderRadius: 20, border: '1.5px solid',
        borderColor: active ? '#2D6A4F' : '#D5D5CF',
        background: active ? '#2D6A4F' : '#FFFFFF',
        color: active ? '#FFFFFF' : '#555',
        cursor: 'pointer', fontSize: 13, fontWeight: active ? 500 : 400,
        transition: 'all 0.15s ease',
      }}
    >
      {label}
    </button>
  );

  const steps = [
    {
      title: 'Cilt Tipin',
      items: SKIN_TYPES,
      selected: skinTypes,
      setSelected: (v: string[]) => setSkinTypes(v),
      toggle: (v: string) => toggle(skinTypes, setSkinTypes, v),
    },
    {
      title: 'Saç Tipin',
      items: HAIR_TYPES,
      selected: hairTypes,
      setSelected: (v: string[]) => setHairTypes(v),
      toggle: (v: string) => toggle(hairTypes, setHairTypes, v),
    },
    {
      title: 'Cilt Sorunların',
      items: CONCERNS,
      selected: concerns,
      setSelected: (v: string[]) => setConcerns(v),
      toggle: (v: string) => toggle(concerns, setConcerns, v),
    },
  ];

  const currentStep = steps[step];

  return (
    <div
      style={{
        background: '#FFFFFF', borderRadius: 16,
        border: '1.5px solid #E8E8E2',
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        overflow: 'hidden', width: '100%', maxWidth: 560,
      }}
    >
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1B4332 0%, #2D6A4F 100%)', padding: '18px 20px' }}>
        <div style={{ fontSize: 10, color: '#FFB7B2', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 4 }}>
          Adım {step + 1} / {steps.length + 1}
        </div>
        <div style={{ fontSize: 17, fontWeight: 600, color: '#FFFFFF', fontFamily: '"Playfair Display", serif' }}>
          Profilini Oluştur
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 3 }}>
          Sana özel öneriler için {currentStep.title.toLowerCase()}ni seç
        </div>
        {/* Progress bar */}
        <div style={{ marginTop: 10, height: 3, background: 'rgba(255,255,255,0.2)', borderRadius: 2 }}>
          <div style={{ height: '100%', width: `${((step + 1) / (steps.length + 1)) * 100}%`, background: '#FFB7B2', borderRadius: 2, transition: 'width 0.3s ease' }} />
        </div>
      </div>

      {/* Step content */}
      <div style={{ padding: '20px' }}>
        {step < steps.length ? (
          <>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: '#1A1A1A', marginBottom: 12 }}>
              {currentStep.title} <span style={{ fontWeight: 400, color: '#999', fontSize: 12 }}>(birden fazla seçebilirsin)</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {currentStep.items.map((item) => (
                <Chip
                  key={item}
                  label={item}
                  active={currentStep.selected.includes(item)}
                  onClick={() => currentStep.toggle(item)}
                />
              ))}
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: '#1A1A1A', marginBottom: 8 }}>Aylık Bütçen</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <input
                type="range" min={100} max={2000} step={50} value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                style={{ flex: 1, accentColor: '#2D6A4F' }}
              />
              <span style={{ fontSize: 18, fontWeight: 700, color: '#1B4332', minWidth: 68, textAlign: 'right' }}>
                ₺{budget}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#999' }}>
              <span>₺100</span><span>₺2,000</span>
            </div>
          </>
        )}
      </div>

      {/* Actions */}
      <div style={{ padding: '0 20px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          onClick={onSkip}
          style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer', fontSize: 13, textDecoration: 'underline' }}
        >
          Şimdilik Atla
        </button>
        <div style={{ display: 'flex', gap: 8 }}>
          {step > 0 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              style={{
                padding: '9px 18px', borderRadius: 8, border: '1.5px solid #D5D5CF',
                background: '#FFFFFF', color: '#555', cursor: 'pointer', fontSize: 13, fontWeight: 500,
              }}
            >
              Geri
            </button>
          )}
          {step < steps.length ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              style={{
                padding: '9px 20px', borderRadius: 8, border: 'none',
                background: '#2D6A4F', color: '#FFFFFF', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              İleri <ChevronRight size={14} />
            </button>
          ) : (
            <button
              onClick={() => onSave(skinTypes, concerns)}
              style={{
                padding: '9px 20px', borderRadius: 8, border: 'none',
                background: '#2D6A4F', color: '#FFFFFF', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              }}
            >
              Kaydet ve Öneri Üret ✓
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function RoutineCard({ cartItemIds, onAddToCart, onNavigateToCart }: { cartItemIds: Set<string>; onAddToCart: (p: Product) => void; onNavigateToCart: () => void; }) {
  const totalUsed = ROUTINE_STEPS.reduce((sum, s) => sum + getCheapestStore(s.product.stores).price, 0);
  const progressPct = Math.min((totalUsed / BUDGET) * 100, 100);
  const storeOrderForCompare: Array<[string, number]> = [
    ['Watsons', STORE_TOTALS['Watsons']],
    ['Gratis', STORE_TOTALS['Gratis']],
    ['Rossmann', STORE_TOTALS['Rossmann']],
    ['Mion', STORE_TOTALS['Mion']],
  ];
  const minStoreTotal = Math.min(...storeOrderForCompare.map(([, v]) => v));

  return (
    <div style={{ width: '100%', maxWidth: 560 }}>
      {/* Recipe card */}
      <div
        style={{
          background: '#FFFFFF', borderRadius: 16, border: '1.5px solid #E8E8E2',
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)', overflow: 'hidden', marginBottom: 12,
        }}
      >
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #F5F5F0 0%, #EDEEE8 100%)',
            borderBottom: '1px solid #E8E8E2', padding: '14px 18px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: 9.5, color: '#999', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              REÇETE #0017 · 06.07.2026
            </div>
            <div style={{ fontFamily: '"Playfair Display", serif', fontSize: 18, fontWeight: 600, color: '#1A1A1A', marginTop: 2 }}>
              Kuru + Hassas Cilt <span style={{ color: '#FFB7B2', fontStyle: 'italic' }}>Rutini</span>
            </div>
          </div>
          <div
            style={{
              width: 50, height: 50, borderRadius: '50%', border: '2px solid #E8E8E2',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              background: '#FFFFFF',
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 700, color: '#1B4332', lineHeight: 1 }}>₺{totalUsed}</div>
            <div style={{ fontSize: 8.5, color: '#999', textTransform: 'uppercase', letterSpacing: '0.3px' }}>toplam</div>
          </div>
        </div>

        {/* Products */}
        <div style={{ padding: '8px 0' }}>
          {ROUTINE_STEPS.map((s, idx) => {
            const cheapest = getCheapestStore(s.product.stores);
            const inCart = cartItemIds.has(s.product.id);
            const storeColor = STORE_COLORS[cheapest.name];
            return (
              <div
                key={s.product.id}
                style={{
                  padding: '12px 18px',
                  borderBottom: idx < ROUTINE_STEPS.length - 1 ? '1px solid #F0F0EC' : 'none',
                  display: 'flex', alignItems: 'flex-start', gap: 14,
                }}
              >
                {/* Step number */}
                <div
                  style={{
                    width: 26, height: 26, borderRadius: '50%', border: '1.5px solid #D5D5CF',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 700, color: '#999', flexShrink: 0, marginTop: 2,
                  }}
                >
                  {idx + 1}
                </div>

                {/* Product image */}
                <img
                  src={s.product.image}
                  alt={s.product.title}
                  style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', flexShrink: 0, border: '1px solid #F0F0EC' }}
                />

                {/* Product info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 9, color: '#999', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 2 }}>
                    {s.label}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A', lineHeight: 1.3, marginBottom: 3 }}>
                    {s.product.brand} {s.product.title.split(' ').slice(0, 3).join(' ')}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div
                      style={{
                        fontSize: 10, color: storeColor.color, background: storeColor.light,
                        padding: '2px 7px', borderRadius: 20, fontWeight: 500,
                      }}
                    >
                      {cheapest.name}
                    </div>
                    <div style={{ fontSize: 10, color: '#999' }}>{s.note}</div>
                  </div>
                </div>

                {/* Price + action */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#1A1A1A' }}>₺{cheapest.price}</div>
                  <button
                    onClick={() => onAddToCart(s.product)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      padding: '6px 12px', borderRadius: 8, border: 'none',
                      background: inCart ? '#EBF5F0' : '#1B4332',
                      color: inCart ? '#2D6A4F' : '#FFFFFF',
                      cursor: 'pointer', fontSize: 11.5, fontWeight: 500, whiteSpace: 'nowrap',
                    }}
                  >
                    {inCart ? <><Check size={11} /> Sepette</> : <><ShoppingBag size={11} /> Sepete Ekle</>}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Budget progress */}
        <div style={{ padding: '14px 18px', borderTop: '1px solid #F0F0EC', background: '#FAFAF8' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#1A1A1A' }}>₺{totalUsed} kullanıldı</span>
            <span style={{ fontSize: 12, color: '#999' }}>₺{BUDGET} bütçe</span>
          </div>
          <div style={{ height: 8, borderRadius: 4, background: '#E8E8E2', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%', borderRadius: 4, transition: 'width 0.6s ease',
                width: `${progressPct}%`,
                background: `linear-gradient(90deg, #FFB7B2 0%, #52B788 100%)`,
              }}
            />
          </div>
          <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>
            ₺{BUDGET - totalUsed} kaldı · Bütçenin %{Math.round(progressPct)}'ini kullandın
          </div>
        </div>
      </div>

      {/* Cart optimization section */}
      <div
        style={{
          background: '#FFFFFF', borderRadius: 16, border: '1.5px solid #E8E8E2',
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)', overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ padding: '12px 18px', borderBottom: '1px solid #F0F0EC', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#1B4332', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            Sepet Optimizasyonu · 3 Ürün
          </div>
          <button
            onClick={onNavigateToCart}
            style={{ fontSize: 11.5, color: '#2D6A4F', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 3 }}
          >
            Tümünü Gör <ChevronRight size={12} />
          </button>
        </div>

        {/* Store comparison row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, borderBottom: '1px solid #F0F0EC' }}>
          {storeOrderForCompare.map(([store, total]) => {
            const isBest = total === minStoreTotal;
            const storeColor = STORE_COLORS[store as keyof typeof STORE_COLORS];
            return (
              <div
                key={store}
                style={{
                  padding: '12px 10px', textAlign: 'center',
                  background: isBest ? `${storeColor.light}` : '#FFFFFF',
                  borderRight: '1px solid #F0F0EC',
                }}
              >
                <div
                  style={{
                    fontSize: 10, fontWeight: 600, color: isBest ? storeColor.color : '#999',
                    marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.3px',
                  }}
                >
                  {store}
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: isBest ? storeColor.color : '#1A1A1A' }}>
                  ₺{total}
                </div>
                {isBest && (
                  <div style={{ fontSize: 9, color: storeColor.color, fontWeight: 600, marginTop: 2 }}>EN İYİ</div>
                )}
              </div>
            );
          })}
        </div>

        {/* Split options */}
        <div style={{ padding: '12px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Single store */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, background: '#F8F8F5', border: '1px solid #E8E8E2' }}>
            <ShoppingBag size={14} style={{ color: '#666', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#1A1A1A' }}>Tek Kargo</div>
              <div style={{ fontSize: 11, color: '#666' }}>3 ürünün tamamı {CHEAPEST_SINGLE_STORE}'ten</div>
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#1A1A1A' }}>₺{CHEAPEST_SINGLE_TOTAL}</div>
          </div>

          {/* Max savings */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, background: '#EBF5F0', border: '1.5px solid #A8D5C2' }}>
            <TrendingDown size={14} style={{ color: '#2D6A4F', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#1B4332' }}>Maksimum Tasarruf</span>
                <span style={{ fontSize: 9.5, background: '#FFB7B2', color: '#1B4332', borderRadius: 20, padding: '1px 7px', fontWeight: 700 }}>
                  ₺{CHEAPEST_SINGLE_TOTAL - SPLIT_TOTAL} tasarruf
                </span>
              </div>
              <div style={{ fontSize: 11, color: '#2D6A4F' }}>Temizleyici + nemlendirici Gratis'ten, güneş kremi Rossmann'dan</div>
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#1B4332' }}>₺{SPLIT_TOTAL}</div>
          </div>

          {/* Timing suggestion */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8, background: '#FFFBF0', border: '1px solid #F5E4A8' }}>
            <Clock size={13} style={{ color: '#B8860B', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 11, color: '#8B6914' }}>
                <strong>Zamanlama Önerisi:</strong> Güneş kremi 4 gün içinde %15 düşüş bekliyor, beklenebilir
              </span>
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#8B6914', whiteSpace: 'nowrap' }}>₺87 → ₺74</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ChatPage({ onAddToCart, cartItemIds, onNavigateToCart }: ChatPageProps) {
  const [phase, setPhase] = useState<ChatPhase>('onboarding');
  const [inputVal, setInputVal] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [phase]);

  const handleSaveProfile = () => {
    setPhase('typing');
    setTimeout(() => setPhase('routine'), 2000);
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#F5F5F0', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div
        style={{
          background: '#FFFFFF', borderBottom: '1px solid #E8E8E2',
          padding: '16px 28px', display: 'flex', alignItems: 'center', gap: 14,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 40, height: 40, borderRadius: '50%',
            background: 'linear-gradient(135deg, #1B4332 0%, #2D6A4F 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Sparkles size={18} style={{ color: '#FFB7B2' }} />
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#1A1A1A' }}>AI Cilt Bakım Asistanı</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#666' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#52B788', display: 'inline-block' }} />
            Çevrimiçi · 4 mağazada fiyat karşılaştırılıyor
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div
        style={{
          flex: 1, overflowY: 'auto', padding: '24px 28px',
          display: 'flex', flexDirection: 'column', gap: 20,
        }}
      >
        {/* AI greeting */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #1B4332, #2D6A4F)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
            <Sparkles size={14} style={{ color: '#FFB7B2' }} />
          </div>
          <div
            style={{
              background: '#E8F5E9', borderRadius: '4px 16px 16px 16px',
              padding: '12px 16px', maxWidth: 460,
              fontSize: 14, color: '#1A1A1A', lineHeight: 1.5,
              border: '1px solid #C8E6C9',
            }}
          >
            Merhaba! 👋 Sana özel bir cilt bakım rutini oluşturmamı ister misin? 4 farklı mağazada fiyatları karşılaştırarak en uygun ürünleri buluyorum.
          </div>
        </div>

        {/* User message */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div
            style={{
              background: '#FFFFFF', borderRadius: '16px 4px 16px 16px',
              padding: '12px 16px', maxWidth: 420,
              fontSize: 14, color: '#1A1A1A', lineHeight: 1.5,
              border: '1px solid #E8E8E2', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            }}
          >
            Cildim kuru ve hassas, bütçem 500 TL. Bana uygun bir cilt bakım rutini oluşturur musun?
          </div>
        </div>

        {/* AI response */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #1B4332, #2D6A4F)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
            <Sparkles size={14} style={{ color: '#FFB7B2' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
            {phase === 'onboarding' && (
              <>
                <div
                  style={{
                    background: '#E8F5E9', borderRadius: '4px 16px 16px 16px',
                    padding: '12px 16px', maxWidth: 460,
                    fontSize: 14, color: '#1A1A1A', lineHeight: 1.5,
                    border: '1px solid #C8E6C9',
                  }}
                >
                  Harika! Sana tam olarak uygun öneriler yapabilmem için birkaç bilgiye ihtiyacım var. 🌿
                </div>
                <OnboardingCard onSave={handleSaveProfile} onSkip={handleSaveProfile} />
              </>
            )}
            {phase === 'typing' && (
              <div
                style={{
                  background: '#E8F5E9', borderRadius: '4px 16px 16px 16px',
                  padding: '12px 16px', border: '1px solid #C8E6C9',
                  display: 'inline-flex', alignItems: 'center',
                }}
              >
                <TypingIndicator />
              </div>
            )}
            {phase === 'routine' && (
              <>
                <div
                  style={{
                    background: '#E8F5E9', borderRadius: '4px 16px 16px 16px',
                    padding: '12px 16px', maxWidth: 460,
                    fontSize: 14, color: '#1A1A1A', lineHeight: 1.5,
                    border: '1px solid #C8E6C9',
                  }}
                >
                  Kuru ve hassas cildine uygun, ₺500 altında bir rutin hazırladım! Her ürün için en uygun mağazayı karşılaştırdım 🌱
                </div>
                <RoutineCard
                  cartItemIds={cartItemIds}
                  onAddToCart={onAddToCart}
                  onNavigateToCart={onNavigateToCart}
                />
              </>
            )}
          </div>
        </div>

        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div
        style={{
          background: '#FFFFFF', borderTop: '1px solid #E8E8E2',
          padding: '14px 28px', flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Cilt tipini, bütçeni veya sorununu yaz..."
            onKeyDown={(e) => {
              if (e.key === 'Enter' && inputVal.trim()) setInputVal('');
            }}
            style={{
              flex: 1, padding: '11px 16px', borderRadius: 24,
              border: '1.5px solid #D5D5CF', background: '#F8F8F5',
              fontSize: 14, color: '#1A1A1A', outline: 'none',
            }}
          />
          <button
            style={{
              width: 42, height: 42, borderRadius: '50%', border: 'none',
              background: '#2D6A4F', color: '#FFFFFF',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', flexShrink: 0,
            }}
          >
            <Send size={16} />
          </button>
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
          {['Yağlı cilt önerisi', 'Akne için rutin', 'SPF önerisi', 'Serum tavsiyesi'].map((q) => (
            <button
              key={q}
              onClick={() => setInputVal(q)}
              style={{
                padding: '5px 12px', borderRadius: 20, border: '1px solid #D5D5CF',
                background: '#FFFFFF', color: '#666', cursor: 'pointer', fontSize: 12,
              }}
            >
              {q}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
