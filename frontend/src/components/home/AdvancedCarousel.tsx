import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination, EffectFade } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
// @ts-ignore
import 'swiper/css/effect-fade';
import { useTheme } from '../../contexts/ThemeContext';

interface Slide {
    id: string;
    image_url: string;
    title?: string;
    description?: string;
    link_url?: string;
    is_active: boolean;
}

interface CarouselProps {
    slides: Slide[];
}

export const AdvancedCarousel: React.FC<CarouselProps> = ({ slides }) => {
    const { activeTheme, currentMode } = useTheme();
    const activeSlides = slides.filter(s => s.is_active);

    const colors = activeTheme?.config[currentMode]?.colors as any || {};
    const primaryColor = colors.primary || '#000';

    if (activeSlides.length === 0) return null;

    return (
        <section className="relative w-full h-[600px]">
            <Swiper
                modules={[Autoplay, Navigation, Pagination, EffectFade]}
                effect="fade"
                spaceBetween={0}
                slidesPerView={1}
                navigation
                pagination={{ clickable: true }}
                autoplay={{ delay: 5000, disableOnInteraction: false }}
                loop={activeSlides.length > 1}
                className="w-full h-full"
                style={{
                    // @ts-ignore
                    '--swiper-navigation-color': primaryColor,
                    '--swiper-pagination-color': primaryColor,
                }}
            >
                {activeSlides.map((slide) => (
                    <SwiperSlide key={slide.id}>
                        <div className="relative w-full h-full">
                            <img
                                src={slide.image_url}
                                alt={slide.title || 'Carousel Slide'}
                                className="w-full h-full object-cover"
                                loading="lazy"
                            />
                            <div className="absolute inset-0 bg-black/40 flex flex-col justify-center items-center text-center p-6">
                                {slide.title && (
                                    <h2 className="text-4xl md:text-6xl font-bold text-white mb-4 animate-fadeInUp">
                                        {slide.title}
                                    </h2>
                                )}
                                {slide.description && (
                                    <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-2xl animate-fadeInUp delay-100">
                                        {slide.description}
                                    </p>
                                )}
                                {slide.link_url && (
                                    <a
                                        href={slide.link_url}
                                        className="px-8 py-3 rounded-full text-white font-semibold transition-transform hover:scale-105 animate-fadeInUp delay-200"
                                        style={{ backgroundColor: primaryColor }}
                                    >
                                        Learn More
                                    </a>
                                )}
                            </div>
                        </div>
                    </SwiperSlide>
                ))}
            </Swiper>

            <style>{`
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-fadeInUp {
                    animation: fadeInUp 0.8s ease-out forwards;
                }
                .delay-100 { animation-delay: 0.1s; }
                .delay-200 { animation-delay: 0.2s; }
                
                .swiper-button-next, .swiper-button-prev {
                    background: rgba(255,255,255,0.1);
                    backdrop-filter: blur(4px);
                    width: 50px;
                    height: 50px;
                    border-radius: 50%;
                }
                .swiper-button-next:after, .swiper-button-prev:after {
                    font-size: 20px;
                }
            `}</style>
        </section>
    );
};
