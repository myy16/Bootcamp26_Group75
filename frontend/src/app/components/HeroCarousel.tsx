import { useState, useCallback, useEffect, useMemo } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { Product, StorePrice } from '../data';

const CARDS_PER_GROUP = 3;

interface HeroCarouselProps {
  products?: Product[];
  user: User | null;
  userSkinTypeName?: string | null;
}

interface RecommendationSlide {
  id: string;
  label: string;
  product: Product;
  bg: string;
  accentColor: string;
  personalized: boolean;
}

const SLIDE_STYLES = [
  {
    bg: 'linear-gradient(135deg, #F0F7F4 0%, #E8F5F0 100%)',
    accentColor: '#2D6A4F',
  },
  {
    bg: 'linear-gradient(135deg, #EFF6FB 0%, #E8F2FA 100%)',
    accentColor: '#0077B6',
  },
  {
    bg: 'linear-gradient(135deg, #FDF5F5 0%, #FAF0F0 100%)',
    accentColor: '#E63946',
  },
  {
    bg: 'linear-gradient(135deg, #FFF7E8 0%, #FFF1D6 100%)',
    accentColor: '#B7791F',
  },
];

const CATEGORY_LABELS: Record<string, string> = {
  'gunes kremi': 'Yaz Koruması',
  'nemlendirici': 'Nem Desteği',
  'yuz temizleme ve tonik': 'Temiz Bakım',
  'cilt serumu ve yaglar': 'Serum Bakımı',
  'sampuan': 'Saç Bakımı',
  'sac kremi': 'Saç Bakımı',
  'sac bakim urunleri': 'Saç Bakımı',
};

function normalizeText(value?: string | null): string {
  return (value ?? '')
    .trim()
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c');
}

function getValidStores(product: Product): StorePrice[] {
  return (product.stores || []).filter((store) => Number.isFinite(store.price) && store.price > 0);
}

function getCheapestValidStore(product: Product): StorePrice | null {
  const stores = getValidStores(product);
  if (stores.length === 0) return null;
  return stores.reduce((min, store) => (store.price < min.price ? store : min), stores[0]);
}

function matchesSkinType(product: Product, userSkinTypeName?: string | null): boolean {
  if (!userSkinTypeName) return false;

  const normalizedSkinType = normalizeText(userSkinTypeName);

  return (product.skinTypeNames || []).some(
    (skinType) => normalizeText(skinType) === normalizedSkinType
  );
}

function getRecommendationLabel(
  product: Product,
  userSkinTypeName?: string | null,
  personalized = false
): string {
  if (personalized && userSkinTypeName) {
    return `${userSkinTypeName} Cilt`;
  }

  const tag = product.tagNames?.find(Boolean);
  if (tag) return tag;

  return CATEGORY_LABELS[normalizeText(product.category)] || product.category || 'Önerilen Ürün';
}

function getSubtitle(
  user: User | null,
  userSkinTypeName?: string | null,
  hasPersonalizedSlides = false
): string {
  if (!user) {
    return 'Fiyatı doğrulanmış popüler ürünler ve en uygun market seçenekleri';
  }

  if (!userSkinTypeName) {
    return 'Profilindeki cilt tipi tamamlandığında kişisel öneriler önceliklenir';
  }

  if (hasPersonalizedSlides) {
    return `${userSkinTypeName} cilt tipine göre fiyatı karşılaştırılmış öneriler`;
  }

  return 'Cilt profiline özel eşleşme bulunamadı, fiyatı uygun ürünler listeleniyor';
}

function getTitle(user: User | null, hasPersonalizedSlides = false): string {
  if (user && hasPersonalizedSlides) {
    return 'Sana Uygun Ürünler';
  }

  return 'Öne Çıkan Ürünler';
}

export function HeroCarousel({ products = [], user, userSkinTypeName }: HeroCarouselProps) {
  const recommendationSlides = useMemo<RecommendationSlide[]>(() => {
    const productsWithPrices = products.filter((product) => getCheapestValidStore(product) !== null);
    const personalizedProducts = productsWithPrices.filter((product) =>
      matchesSkinType(product, userSkinTypeName)
    );
    const selectedProducts = personalizedProducts.length > 0 ? personalizedProducts : productsWithPrices;

    return selectedProducts
      .slice()
      .sort((a, b) => {
        const aCheapest = getCheapestValidStore(a)?.price ?? Number.MAX_SAFE_INTEGER;
        const bCheapest = getCheapestValidStore(b)?.price ?? Number.MAX_SAFE_INTEGER;

        return aCheapest - bCheapest;
      })
      .slice(0, 6)
      .map((product, index) => {
        const style = SLIDE_STYLES[index % SLIDE_STYLES.length];
        const personalized = matchesSkinType(product, userSkinTypeName);

        return {
          id: `hero-${product.id}`,
          label: getRecommendationLabel(product, userSkinTypeName, personalized),
          product,
          bg: style.bg,
          accentColor: style.accentColor,
          personalized,
        };
      });
  }, [products, userSkinTypeName]);

  const hasPersonalizedSlides = recommendationSlides.some((slide) => slide.personalized);

  const slideGroups = useMemo(() => {
    const groups: RecommendationSlide[][] = [];

    for (let i = 0; i < recommendationSlides.length; i += CARDS_PER_GROUP) {
      groups.push(recommendationSlides.slice(i, i + CARDS_PER_GROUP));
    }

    return groups;
  }, [recommendationSlides]);

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: slideGroups.length > 1,
    align: 'start',
    slidesToScroll: 1,
  });

  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());

    onSelect();
    emblaApi.on('reInit', onSelect);
    emblaApi.on('select', onSelect);

    return () => {
      emblaApi.off('reInit', onSelect);
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi]);

  if (recommendationSlides.length === 0) {
    return null;
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h2 style={{ fontFamily: '"Playfair Display", serif', fontSize: 20, fontWeight: 600, color: '#1A1A1A', margin: 0 }}>
            {getTitle(user, hasPersonalizedSlides)}
          </h2>
          <p style={{ fontSize: 12, color: '#666', margin: '3px 0 0', fontWeight: 400 }}>
            {getSubtitle(user, userSkinTypeName, hasPersonalizedSlides)}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button
            onClick={scrollPrev}
            aria-label="Önceki öneri grubu"
            disabled={slideGroups.length <= 1}
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              border: '1.5px solid #D5D5CF',
              background: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: slideGroups.length > 1 ? 'pointer' : 'default',
              color: '#444',
              opacity: slideGroups.length > 1 ? 1 : 0.45,
            }}
          >
            <ChevronLeft size={16} />
          </button>

          <button
            onClick={scrollNext}
            aria-label="Sonraki öneri grubu"
            disabled={slideGroups.length <= 1}
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              border: '1.5px solid #D5D5CF',
              background: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: slideGroups.length > 1 ? 'pointer' : 'default',
              color: '#444',
              opacity: slideGroups.length > 1 ? 1 : 0.45,
            }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div ref={emblaRef} style={{ overflow: 'hidden', borderRadius: 12 }}>
        <div style={{ display: 'flex' }}>
          {slideGroups.map((group, groupIndex) => (
            <div
              key={`hero-group-${groupIndex}`}
              style={{
                flex: '0 0 100%',
                minWidth: 0,
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
                gap: 16,
              }}
            >
              {group.map((slide) => {
                const cheapest = getCheapestValidStore(slide.product);
                if (!cheapest) return null;

                return (
                  <div
                    key={slide.id}
                    style={{
                      minWidth: 0,
                      borderRadius: 12,
                      overflow: 'hidden',
                      background: slide.bg,
                      border: '1.5px solid rgba(0,0,0,0.06)',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                      cursor: 'grab',
                    }}
                  >
                    <div style={{ padding: '20px 20px 0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                        <div
                          style={{
                            fontSize: 9.5,
                            fontWeight: 700,
                            letterSpacing: '0.8px',
                            textTransform: 'uppercase',
                            color: slide.accentColor,
                            background: `${slide.accentColor}14`,
                            padding: '2px 8px',
                            borderRadius: 20,
                          }}
                        >
                          {slide.label}
                        </div>

                        {slide.product.featuredLabel && (
                          <div
                            style={{
                              fontSize: 9,
                              padding: '2px 6px',
                              borderRadius: 20,
                              background: 'rgba(27,67,50,0.08)',
                              color: '#1B4332',
                              fontWeight: 500,
                            }}
                          >
                            Öne Çıkan
                          </div>
                        )}
                      </div>

                      <div style={{ fontFamily: '"Playfair Display", serif', fontSize: 15, fontWeight: 600, color: '#1A1A1A', lineHeight: 1.3, marginBottom: 4 }}>
                        {slide.product.title}
                      </div>

                      <div style={{ fontSize: 11.5, color: '#666', marginBottom: 2 }}>
                        {slide.product.brand}
                      </div>
                    </div>

                    <div style={{ position: 'relative' }}>
                      <img
                        src={slide.product.image}
                        alt={slide.product.title}
                        style={{ width: '100%', height: 156, objectFit: 'cover', display: 'block' }}
                      />

                      <div
                        style={{
                          position: 'absolute',
                          bottom: 10,
                          left: 10,
                          background: 'rgba(255,255,255,0.96)',
                          backdropFilter: 'blur(8px)',
                          borderRadius: 10,
                          padding: '6px 12px',
                          boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
                        }}
                      >
                        <div style={{ fontSize: 9, color: '#2D6A4F', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                          {cheapest.name} · En Ucuz
                        </div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: '#1A1A1A', letterSpacing: '-0.5px', lineHeight: 1.2 }}>
                          ₺{cheapest.price}
                        </div>
                      </div>

                      {selectedIndex === groupIndex && (
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: slide.accentColor }} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {slideGroups.length > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 12 }}>
          {slideGroups.map((_, i) => (
            <button
              key={i}
              onClick={() => emblaApi?.scrollTo(i)}
              aria-label={`${i + 1}. öneri grubuna git`}
              style={{
                width: selectedIndex === i ? 22 : 7,
                height: 7,
                borderRadius: 4,
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                background: selectedIndex === i ? '#2D6A4F' : '#D5D5CF',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}