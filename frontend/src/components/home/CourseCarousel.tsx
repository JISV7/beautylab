import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import { Clock, Monitor, ArrowRight } from 'lucide-react';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

interface Course {
  id: number;
  title: string;
  description: string;
  duration: string;
  modality: string;
  image: string;
}

const courses: Course[] = [
  {
    id: 1,
    title: 'Seguridad y Salud en el Trabajo',
    description:
      'Prevención de riesgos industriales, prácticas seguras y cumplimiento para proteger a tu equipo en planta.',
    duration: 'Programa piloto',
    modality: 'Presencial o virtual',
    image:
      'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=1080&q=80',
  },
  {
    id: 2,
    title: 'Finanzas Prácticas para No Financieros',
    description:
      'Lectura de estados financieros, presupuestos y decisiones de negocio para líderes de área.',
    duration: 'Programa piloto',
    modality: 'Virtual en vivo',
    image:
      'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1080&q=80',
  },
  {
    id: 3,
    title: 'Ventas Consultivas y Atención al Cliente',
    description:
      'Técnicas modernas para entender necesidades, construir confianza y elevar la experiencia del cliente.',
    duration: 'Programa piloto',
    modality: 'Virtual en vivo',
    image:
      'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1080&q=80',
  },
  {
    id: 4,
    title: 'Habilidades Digitales para la Oficina Moderna',
    description:
      'Herramientas, colaboración y hábitos digitales para trabajar con más orden, foco y productividad.',
    duration: 'Programa piloto',
    modality: 'Autogestionado',
    image:
      'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1080&q=80',
  },
  {
    id: 5,
    title: 'Liderazgo Operativo y Supervisión Efectiva',
    description:
      'Herramientas de supervisión para acompañar equipos, dar retroalimentación y sostener resultados.',
    duration: 'Programa piloto',
    modality: 'Presencial o virtual',
    image:
      'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1080&q=80',
  },
];

export const CourseCarousel: React.FC = () => {
  return (
    <section id="featured-courses" className="py-16 lg:py-24 palette-background overflow-hidden relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-h2 mb-4">Programas destacados</h2>
          <p className="text-paragraph max-w-2xl mx-auto">
            Rutas de capacitación diseñadas para los retos reales de equipos en Latinoamérica.
          </p>
        </div>

        <Swiper
          modules={[Navigation, Pagination, Autoplay]}
          spaceBetween={30}
          slidesPerView={1}
          pagination={{ clickable: true }}
          autoplay={{ delay: 5000, disableOnInteraction: false }}
          breakpoints={{
            640: { slidesPerView: 1 },
            768: { slidesPerView: 2 },
            1024: { slidesPerView: 3 },
          }}
          className="pb-16"
        >
          {courses.map((course) => (
            <SwiperSlide key={course.id} className="h-full">
              <div className="h-full flex flex-col palette-surface palette-border border rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden group min-h-[500px]">
                {/* Course Image */}
                <div className="h-48 w-full overflow-hidden relative">
                  <img
                    src={course.image}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>

                <div className="p-6 flex flex-col flex-grow">
                  {/* Course Content */}
                  <h3 className="text-h3 mb-3 line-clamp-2 min-h-[3.2rem]">
                    {course.title}
                  </h3>

                  <p className="text-muted mb-6 flex-grow line-clamp-3">
                    {course.description}
                  </p>

                  {/* Course Meta */}
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mb-6 text-paragraph text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[var(--palette-secondary)]" />
                      <span>{course.duration}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Monitor className="w-4 h-4 text-[var(--palette-secondary)]" />
                      <span>{course.modality}</span>
                    </div>
                  </div>

                  {/* CTA */}
                  <a
                    href="/#contact"
                    className="theme-button theme-button-primary w-full inline-flex items-center justify-center gap-2"
                  >
                    Conocer el programa
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </a>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* Global CSS Overrides for Swiper specific to this component */}
      <style>{`
        .swiper-pagination-bullet {
          background-color: var(--palette-secondary);
          opacity: 1;
        }
        .swiper-pagination-bullet-active {
          background-color: var(--palette-primary);
          opacity: 1;
        }
        .swiper {
          padding-bottom: 3rem !important;
          padding-left: 0.5rem;
          padding-right: 0.5rem;
          margin-left: -0.5rem;
          margin-right: -0.5rem;
        }
      `}</style>
    </section>
  );
};
