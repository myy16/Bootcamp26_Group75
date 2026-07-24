import { useState, useCallback, useEffect, useMemo } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { HERO_SLIDES, getCheapestStore } from '../data';

const CARDS_PER_GROUP = 3;

export function HeroCarousel() {
  const slideGroups = useMemo(() => {
    const groups = [];

    for (let i = 0; i < HERO_SLIDES.length; i += CARDS_PER_GROUP) {
      groups.push(HERO_SLIDES.slice(i, i + CARDS_PER_GROUP));
    }

    return groups;
  }, []);

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

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h2 style={{ fontFamily: '"Playfair Display", serif', fontSize: 20, fontWeight: 600, color: '#1A1A1A', margin: 0 }}>
            Sana Uygun Ürünler
          </h2>
          <p style={{ fontSize: 12, color: '#666', margin: '3px 0 0', fontWeight: 400 }}>
            Cilt tipine göre kişiselleştirilmiş öneriler
          </p>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button
            onClick={scrollPrev}
            aria-label="Önceki öneri grubu"
            disabled={slideGroups.length <= 1}
            style={{
              width: 34, height: 34, borderRadius: '50%', border: '1.5px solid #D5D5CF',
              background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: slideGroups.length > 1 ? 'pointer' : 'default', color: '#444',
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
              width: 34, height: 34, borderRadius: '50%', border: '1.5px solid #D5D5CF',
              background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: slideGroups.length > 1 ? 'pointer' : 'default', color: '#444',
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
                const cheapest = getCheapestStore(slide.product.stores);

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
                    {/* Text section */}
                    <div style={{ padding: '20px 20px 0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                        <div
                          style={{
                            fontSize: 9.5, fontWeight: 700, letterSpacing: '0.8px',
                            textTransform: 'uppercase', color: slide.accentColor,
                            background: `${slide.accentColor}14`,
                            padding: '2px 8px', borderRadius: 20,
                          }}
                        >
                          {slide.label}
                        </div>
                        {slide.product.featuredLabel && (
                          <div
                            style={{
                              fontSize: 9, padding: '2px 6px', borderRadius: 20,
                              background: 'rgba(27,67,50,0.08)', color: '#1B4332', fontWeight: 500,
                            }}
                          >
                            Öne Çıkan
                          </div>
                        )}
                      </div>
                      <div style={{ fontFamily: '"Playfair Display", serif', fontSize: 15, fontWeight: 600, color: '#1A1A1A', lineHeight: 1.3, marginBottom: 4 }}>
                        {slide.tagline}
                      </div>
                      <div style={{ fontSize: 11.5, color: '#666', marginBottom: 2 }}>
                        {slide.product.brand}
                      </div>
                    </div>

                    {/* Image */}
                    <div style={{ position: 'relative' }}>
                      <img
                        src={slide.product.image}
                        alt={slide.product.title}
                        style={{ width: '100%', height: 156, objectFit: 'cover', display: 'block' }}
                      />
                      {/* Price badge */}
                      <div
                        style={{
                          position: 'absolute', bottom: 10, left: 10,
                          background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(8px)',
                          borderRadius: 10, padding: '6px 12px',
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

      {/* Dot nav */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 12 }}>
        {slideGroups.map((_, i) => (
          <button
            key={i}
            onClick={() => emblaApi?.scrollTo(i)}
            aria-label={`${i + 1}. öneri grubuna git`}
            style={{
              width: selectedIndex === i ? 22 : 7, height: 7, borderRadius: 4,
              border: 'none', padding: 0, cursor: 'pointer', transition: 'all 0.2s ease',
              background: selectedIndex === i ? '#2D6A4F' : '#D5D5CF',
            }}
          />
        ))}
      </div>
    </div>
  );
}