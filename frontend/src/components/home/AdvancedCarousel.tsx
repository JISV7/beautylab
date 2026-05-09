import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination, EffectFade } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
// @ts-ignore
import 'swiper/css/effect-fade';

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
    const activeSlides = slides.filter(s => s.is_active);

    if (activeSlides.length === 0) return null;

    return (
        <section className="relative w-full h-[500px] md:h-[600px]">
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
                                    <h2 className="text-h1 text-white mb-4 animate-fadeInUp">
                                        {slide.title}
                                    </h2>
                                )}
                                {slide.description && (
                                    <p className="text-paragraph text-white/90 mb-8 max-w-2xl animate-fadeInUp delay-100">
                                        {slide.description}
                                    </p>
                                )}
                                {slide.link_url && (
                                    <a
                                        href={slide.link_url}
                                        className="theme-button theme-button-primary transition-transform hover:scale-105 animate-fadeInUp delay-200"
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
                
                :root {
                  --swiper-navigation-color: var(--palette-primary);
                  --swiper-pagination-color: var(--palette-primary);
                  --swiper-pagination-bullet-inactive-color: #fff;
                  --swiper-pagination-bullet-inactive-opacity: 0.5;
                }

                .swiper-button-next, .swiper-button-prev {
                    background: rgba(255,255,255,0.1);
                    backdrop-filter: blur(4px);
                    width: 50px;
                    height: 50px;
                    border-radius: 50%;
                    color: white !important;
                }
                .swiper-button-next:after, .swiper-button-prev:after {
                    font-size: 20px;
                }
            `}</style>
        </section>
    );
};
