import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, ShoppingBag, Check, TrendingDown, Clock, ChevronRight, User } from 'lucide-react';
import { STORE_COLORS, Product, getCheapestStore, StoreName } from '../data';
import { sendChatMessage, getUserProfile, clearSession } from '../chatApi';
import { saveUserProfile } from '../profileApi';
import { User as SupabaseUser } from '@supabase/supabase-js';

interface ChatPageProps {
  products?: Product[];
  onAddToCart: (product: Product) => void;
  cartItemIds: Set<string>;
  onNavigateToCart: () => void;
  user?: SupabaseUser | null;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isOnboarding?: boolean;
  products?: Product[];
}

const SKIN_TYPES = ['Kuru', 'Yağlı', 'Karma', 'Hassas', 'Normal'];
const HAIR_TYPES = ['Kuru', 'Yağlı', 'Normal', 'Boyalı', 'İnce Telli', 'Kalın Telli', 'Kıvırcık', 'Kepekli'];
const CONCERNS = ['Akne', 'Leke', 'Kuruluk', 'Siyah Nokta', 'Kızarıklık', 'Yaşlanma Karşıtı'];

// Helper to map backend product to frontend Product interface
const mapBackendProductToFrontend = (bp: any): Product => {
  const storesData = (bp.store_mappings || []).map((sm: any) => ({
    name: (sm.market_name || "Gratis") as StoreName,
    price: Number(sm.current_price) || 0,
  }));

  // Fallback store price if store_mappings is empty
  if (storesData.length === 0) {
    storesData.push({ name: "Gratis" as StoreName, price: 0 });
  }

  return {
    id: bp.id.toString(),
    image: bp.image_url || "https://images.unsplash.com/photo-1746227638992-50b1e1e0d96b?auto=format&fit=crop&w=300&q=80",
    brand: bp.brand?.name || bp.brand_name || "Marka",
    title: bp.universal_name || "İsimsiz Ürün",
    category: bp.category_name || "Genel",
    stores: storesData,
  };
};

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
  onSave: (skinType: string, hairType: string, concerns: string[]) => void;
  onSkip: () => void;
}) {
  const [skinType, setSkinType] = useState<string>('');
  const [hairType, setHairType] = useState<string>('');
  const [concerns, setConcerns] = useState<string[]>([]);
  const [step, setStep] = useState(0);

  const toggleConcern = (val: string) => {
    setConcerns(prev => prev.includes(val) ? prev.filter((x) => x !== val) : [...prev, val]);
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
      subtitle: 'Sana özel öneriler için cilt tipini seç',
      items: SKIN_TYPES,
      selected: skinType,
      onClick: (v: string) => setSkinType(v),
      isMulti: false
    },
    {
      title: 'Saç Tipin',
      subtitle: 'Sana özel öneriler için saç tipini seç',
      items: HAIR_TYPES,
      selected: hairType,
      onClick: (v: string) => setHairType(v),
      isMulti: false
    },
    {
      title: 'Cilt Sorunların',
      subtitle: 'Varsa cilt sorunlarını seç (birden fazla seçebilirsin)',
      items: CONCERNS,
      selected: concerns,
      onClick: (v: string) => toggleConcern(v),
      isMulti: true
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
        marginTop: 10
      }}
    >
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1B4332 0%, #2D6A4F 100%)', padding: '18px 20px' }}>
        <div style={{ fontSize: 10, color: '#FFB7B2', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 4 }}>
          Adım {step + 1} / {steps.length}
        </div>
        <div style={{ fontSize: 17, fontWeight: 600, color: '#FFFFFF', fontFamily: '"Playfair Display", serif' }}>
          Profilini Oluştur
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 3 }}>
          {currentStep.subtitle}
        </div>
        {/* Progress bar */}
        <div style={{ marginTop: 10, height: 3, background: 'rgba(255,255,255,0.2)', borderRadius: 2 }}>
          <div style={{ height: '100%', width: `${((step + 1) / steps.length) * 100}%`, background: '#FFB7B2', borderRadius: 2, transition: 'width 0.3s ease' }} />
        </div>
      </div>

      {/* Step content */}
      <div style={{ padding: '20px' }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: '#1A1A1A', marginBottom: 12 }}>
          {currentStep.title} {currentStep.isMulti && <span style={{ fontWeight: 400, color: '#999', fontSize: 12 }}>(birden fazla seçebilirsin)</span>}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {currentStep.items.map((item) => {
            const isActive = currentStep.isMulti 
              ? (currentStep.selected as string[]).includes(item)
              : currentStep.selected === item;
            return (
              <Chip
                key={item}
                label={item}
                active={isActive}
                onClick={() => currentStep.onClick(item)}
              />
            );
          })}
        </div>
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
          {step < steps.length - 1 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={!currentStep.isMulti && !currentStep.selected}
              style={{
                padding: '9px 20px', borderRadius: 8, border: 'none',
                background: (!currentStep.isMulti && !currentStep.selected) ? '#D5D5CF' : '#2D6A4F',
                color: '#FFFFFF', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              İleri <ChevronRight size={14} />
            </button>
          ) : (
            <button
              onClick={() => onSave(skinType, hairType, concerns)}
              disabled={!skinType || !hairType}
              style={{
                padding: '9px 20px', borderRadius: 8, border: 'none',
                background: (!skinType || !hairType) ? '#D5D5CF' : '#2D6A4F',
                color: '#FFFFFF', cursor: 'pointer', fontSize: 13, fontWeight: 600,
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

function ProductListCard({ products, cartItemIds, onAddToCart }: { products: Product[]; cartItemIds: Set<string>; onAddToCart: (p: Product) => void; }) {
  if (products.length === 0) return null;

  // Sepet Optimizasyon Bilgilerini Hesapla
  const storeTotals = { Watsons: 0, Gratis: 0, Rossmann: 0, Mion: 0 };
  let validProductsCount = 0;

  products.forEach(p => {
    let hasStores = false;
    p.stores.forEach(s => {
      if (s.price > 0) {
        storeTotals[s.name] += s.price;
        hasStores = true;
      }
    });
    if (hasStores) validProductsCount++;
  });

  const activeStores = Object.entries(storeTotals).filter(([, total]) => total > 0);
  const minStoreEntry = activeStores.length > 0 
    ? activeStores.reduce((min, curr) => curr[1] < min[1] ? curr : min)
    : null;

  return (
    <div style={{ width: '100%', maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 12, marginTop: 10 }}>
      {/* Ürün Listesi Kartı */}
      <div
        style={{
          background: '#FFFFFF', borderRadius: 16, border: '1.5px solid #E8E8E2',
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)', overflow: 'hidden',
        }}
      >
        <div
          style={{
            background: 'linear-gradient(135deg, #F5F5F0 0%, #EDEEE8 100%)',
            borderBottom: '1px solid #E8E8E2', padding: '14px 18px',
          }}
        >
          <div style={{ fontSize: 9.5, color: '#999', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            ÖNERİLEN ÜRÜNLER
          </div>
          <div style={{ fontFamily: '"Playfair Display", serif', fontSize: 18, fontWeight: 600, color: '#1A1A1A', marginTop: 2 }}>
            Sizin İçin Seçilenler 🌱
          </div>
        </div>

        <div style={{ padding: '8px 0' }}>
          {products.map((p, idx) => {
            const cheapest = getCheapestStore(p.stores);
            const inCart = cartItemIds.has(p.id);
            const storeColor = STORE_COLORS[cheapest.name] || { color: '#2D6A4F', light: '#E8F5E9' };
            return (
              <div
                key={p.id}
                style={{
                  padding: '12px 18px',
                  borderBottom: idx < products.length - 1 ? '1px solid #F0F0EC' : 'none',
                  display: 'flex', alignItems: 'flex-start', gap: 14,
                }}
              >
                <div
                  style={{
                    width: 26, height: 26, borderRadius: '50%', border: '1.5px solid #D5D5CF',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 700, color: '#999', flexShrink: 0, marginTop: 2,
                  }}
                >
                  {idx + 1}
                </div>

                <img
                  src={p.image}
                  alt={p.title}
                  style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', flexShrink: 0, border: '1px solid #F0F0EC' }}
                />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 9, color: '#999', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 2 }}>
                    {p.category}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A', lineHeight: 1.3, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.brand} {p.title}
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
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#1A1A1A' }}>
                    {cheapest.price > 0 ? `₺${cheapest.price}` : 'Stok Dışı'}
                  </div>
                  {cheapest.price > 0 && (
                    <button
                      onClick={() => onAddToCart(p)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        padding: '6px 12px', borderRadius: 8, border: 'none',
                        background: inCart ? '#EBF5F0' : '#1B4332',
                        color: inCart ? '#2D6A4F' : '#FFFFFF',
                        cursor: 'pointer', fontSize: 11.5, fontWeight: 500, whiteSpace: 'nowrap',
                      }}
                    >
                      {inCart ? <><Check size={11} /> Sepette</> : <><ShoppingBag size={11} /> Ekle</>}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Karşılaştırma Kartı (Eğer Fiyat Bilgisi Varsa) */}
      {minStoreEntry && (
        <div
          style={{
            background: '#FFFFFF', borderRadius: 16, border: '1.5px solid #E8E8E2',
            boxShadow: '0 4px 24px rgba(0,0,0,0.08)', overflow: 'hidden',
          }}
        >
          <div style={{ padding: '12px 18px', borderBottom: '1px solid #F0F0EC', fontSize: 11, fontWeight: 700, color: '#1B4332', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            Mağaza Fiyat Karşılaştırması (Toplam Sepet)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${activeStores.length}, 1fr)`, gap: 0 }}>
            {Object.entries(storeTotals).map(([store, total]) => {
              if (total === 0) return null;
              const isBest = minStoreEntry && store === minStoreEntry[0];
              const storeColor = STORE_COLORS[store as StoreName] || { color: '#2D6A4F', light: '#E8F5E9' };
              return (
                <div
                  key={store}
                  style={{
                    padding: '12px 10px', textAlign: 'center',
                    background: isBest ? `${storeColor.light}` : '#FFFFFF',
                    borderRight: '1px solid #F0F0EC',
                  }}
                >
                  <div style={{ fontSize: 10, fontWeight: 600, color: isBest ? storeColor.color : '#999', marginBottom: 4, textTransform: 'uppercase' }}>
                    {store}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: isBest ? storeColor.color : '#1A1A1A' }}>
                    ₺{total}
                  </div>
                  {isBest && (
                    <div style={{ fontSize: 9, color: storeColor.color, fontWeight: 600, marginTop: 2 }}>EN UCUZ</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function ChatPage({ onAddToCart, cartItemIds, onNavigateToCart, user }: ChatPageProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputVal, setInputVal] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Generate or retrieve a persistent test user UUID if not logged in
  const getUserId = () => {
    if (user?.id) return user.id;
    let localId = localStorage.getItem("beautrics_chat_user_id");
    if (!localId) {
      localId = "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"; // Default fallback test UUID
      localStorage.setItem("beautrics_chat_user_id", localId);
    }
    return localId;
  };

  const userId = getUserId();
  const sessionId = "session-v2";

  // Initial Load: Check profile and greeting
  useEffect(() => {
    async function initChat() {
      setIsLoading(true);
      try {
        // Clear old sessions on reload to start fresh
        await clearSession(userId, sessionId);

        const profile = await getUserProfile(userId);
        
        const welcomeMessage: Message = {
          id: 'welcome',
          role: 'assistant',
          content: 'Merhaba! 👋 Ben Beautrics Kişisel Bakım Asistanıyım. Sana özel bir cilt bakım rutini oluşturmak ve 4 farklı mağazada fiyatları karşılaştırmak için buradayım.'
        };

        if (!profile || !profile.skin_type || !profile.hair_type) {
          // Profile is missing, ask for onboarding
          setMessages([
            welcomeMessage,
            {
              id: 'onboarding-ask',
              role: 'assistant',
              content: 'Sana en doğru ürünleri ve bakım önerilerini sunabilmem için öncelikle cilt ve saç yapını öğrenmem gerekiyor. Lütfen aşağıdaki sihirbazı tamamla: 🌱',
              isOnboarding: true
            }
          ]);
        } else {
          // Profile complete, greet with current profile context
          const skin = profile.skin_type || 'belirtilmedi';
          const hair = profile.hair_type || 'belirtilmedi';
          const concerns = profile.skin_concerns && profile.skin_concerns.length > 0 
            ? `, Cilt Problemleri: ${profile.skin_concerns.join(', ')}` 
            : '';

          setMessages([
            welcomeMessage,
            {
              id: 'profile-greet',
              role: 'assistant',
              content: `Profilinizi kontrol ettim: \n- Cilt Tipi: **${skin}**\n- Saç Tipi: **${hair}**${concerns}\n\nSize nasıl yardımcı olabilirim? Örneğin *"Bana nemlendirici önerir misin?"* diye sorabilirsiniz.`
            }
          ]);
        }
      } catch (err) {
        console.error("Chat init error:", err);
        // Fallback message
        setMessages([
          {
            id: 'err-welcome',
            role: 'assistant',
            content: 'Merhaba! Bağlantı kurulamadı ancak ben her an yardıma hazırım. Cilt tipinizi belirterek ürün aramaya başlayabilirsiniz! 🌱',
            isOnboarding: true
          }
        ]);
      } finally {
        setIsLoading(false);
      }
    }

    initChat();
  }, [userId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    // 1. Add user message
    const userMsgId = `msg-${Date.now()}`;
    const newMessages = [...messages, { id: userMsgId, role: 'user', content: text } as Message];
    setMessages(newMessages);
    setInputVal('');
    setIsLoading(true);

    try {
      // 2. Send request to backend
      const data = await sendChatMessage(userId, text, sessionId);

      // 3. Map retrieved products
      const productsMapped = (data.retrieved_products || []).map(mapBackendProductToFrontend);

      // 4. Add assistant message
      setMessages(prev => [
        ...prev,
        {
          id: `msg-${Date.now() + 1}`,
          role: 'assistant',
          content: data.response,
          products: productsMapped,
          isOnboarding: data.missing_fields.length > 0
        }
      ]);
    } catch (err) {
      console.error("Error sending message:", err);
      setMessages(prev => [
        ...prev,
        {
          id: `msg-err-${Date.now()}`,
          role: 'assistant',
          content: 'Üzgünüm, şu an yanıt oluşturulamadı. Lütfen tekrar deneyin.'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveOnboarding = async (skinType: string, hairType: string, selectedConcerns: string[]) => {
    if (user?.id) {
      try {
        await saveUserProfile(user.id, {
          fullName: user.user_metadata?.full_name || '',
          currentEmail: user.email || undefined,
          skinTypeName: skinType,
          hairTypeName: hairType,
          skinConcernNames: selectedConcerns,
          onboardingCompleted: true,
        });
      } catch (error) {
        console.error('Onboarding profile save error:', error);
      }
    }

    // Construct message payload to submit onboarding selections
    const concernsText = selectedConcerns.length > 0 ? `, Cilt Sorunlarım: ${selectedConcerns.join(', ')}` : '';
    const onboardingText = `Cildim ${skinType}, Saçım ${hairType}${concernsText}`;
    
    // Hide onboarding prompt from the last welcome message and proceed to send chat message
    setMessages(prev => prev.map(m => m.isOnboarding ? { ...m, isOnboarding: false } : m));
    await handleSendMessage(onboardingText);
  };

  const handleSkipOnboarding = () => {
    setMessages(prev => prev.map(m => m.isOnboarding ? { ...m, isOnboarding: false } : m));
    setMessages(prev => [
      ...prev,
      {
        id: `skip-${Date.now()}`,
        role: 'assistant',
        content: 'Onboarding adımı atlandı. Genel sohbet edebiliriz ya da cilt ve saç tipinizi istediğiniz zaman belirtebilirsiniz! 🌱'
      }
    ]);
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
        {messages.map((m) => {
          const isUser = m.role === 'user';
          return (
            <div 
              key={m.id} 
              style={{ 
                display: 'flex', 
                justifyContent: isUser ? 'flex-end' : 'flex-start',
                gap: 10,
                alignItems: 'flex-start'
              }}
            >
              {!isUser && (
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #1B4332, #2D6A4F)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                  <Sparkles size={14} style={{ color: '#FFB7B2' }} />
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, maxWidth: isUser ? '85%' : '90%', alignItems: isUser ? 'flex-end' : 'flex-start' }}>
                <div
                  style={{
                    background: isUser ? '#FFFFFF' : '#E8F5E9',
                    borderRadius: isUser ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                    padding: '12px 16px',
                    fontSize: 14,
                    color: '#1A1A1A',
                    lineHeight: 1.5,
                    border: isUser ? '1px solid #E8E8E2' : '1px solid #C8E6C9',
                    boxShadow: isUser ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                    whiteSpace: 'pre-wrap'
                  }}
                >
                  {m.content}
                </div>

                {m.isOnboarding && (
                  <OnboardingCard 
                    onSave={handleSaveOnboarding} 
                    onSkip={handleSkipOnboarding} 
                  />
                )}

                {m.products && m.products.length > 0 && (
                  <ProductListCard 
                    products={m.products} 
                    cartItemIds={cartItemIds} 
                    onAddToCart={onAddToCart} 
                  />
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #1B4332, #2D6A4F)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
              <Sparkles size={14} style={{ color: '#FFB7B2' }} />
            </div>
            <div
              style={{
                background: '#E8F5E9', borderRadius: '4px 16px 16px 16px',
                padding: '12px 16px', border: '1px solid #C8E6C9',
                display: 'inline-flex', alignItems: 'center',
              }}
            >
              <TypingIndicator />
            </div>
          </div>
        )}

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
            placeholder="Cilt tipini, bütçeni veya ürün kategorisini yazın..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSendMessage(inputVal);
              }
            }}
            style={{
              flex: 1, padding: '11px 16px', borderRadius: 24,
              border: '1.5px solid #D5D5CF', background: '#F8F8F5',
              fontSize: 14, color: '#1A1A1A', outline: 'none',
            }}
          />
          <button
            onClick={() => handleSendMessage(inputVal)}
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
          {['Nemlendirici önerisi', 'Akne için rutin', 'En ucuz maskara hangisi?', 'Yağlı cilt için güneş kremi'].map((q) => (
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
