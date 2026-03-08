import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import { Clock, Users, Star } from 'lucide-react';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

interface Course {
  id: number;
  title: string;
  description: string;
  duration: string;
  students: string;
  rating: number;
  image: string;
}

const courses: Course[] = [
  {
    id: 1,
    title: 'Complete Web Development Bootcamp',
    description: 'Master HTML, CSS, JavaScript, React, and Node.js from scratch',
    duration: '48 hours',
    students: '12,450',
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1540397106260-e24a507a08ea?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3ZWIlMjBkZXZlbG9wbWVudCUyMGNvZGluZyUyMGxhcHRvcHxlbnwxfHx8fDE3NzIxMTcxMDF8MA&ixlib=rb-4.1.0&q=80&w=1080',
  },
  {
    id: 2,
    title: 'Python Programming Masterclass',
    description: 'From basics to advanced Python programming and data structures',
    duration: '36 hours',
    students: '8,920',
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1660616246653-e2c57d1077b9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxweXRob24lMjBwcm9ncmFtbWluZyUyMGNvZGUlMjBzY3JlZW58ZW58MXx8fHwxNzcyMTIzNzk0fDA&ixlib=rb-4.1.0&q=80&w=1080',
  },
  {
    id: 3,
    title: 'Agentic AI & LLM Applications',
    description: 'Build intelligent AI agents using GPT-4, LangChain, and more',
    duration: '24 hours',
    students: '5,630',
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1760629863094-5b1e8d1aae74?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcnRpZmljaWFsJTIwaW50ZWxsaWdlbmNlJTIwcm9ib3QlMjB0ZWNobm9sb2d5fGVufDF8fHx8MTc3MjA1MDg4NHww&ixlib=rb-4.1.0&q=80&w=1080',
  },
  {
    id: 4,
    title: 'React & TypeScript Advanced',
    description: 'Build scalable applications with React, TypeScript, and best practices',
    duration: '32 hours',
    students: '9,840',
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1699885960867-56d5f5262d38?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZWFjdCUyMHR5cGVzY3JpcHQlMjBkZXZlbG9wbWVudHxlbnwxfHx8fDE3NzIxMjM3OTV8MA&ixlib=rb-4.1.0&q=80&w=1080',
  },
  {
    id: 5,
    title: 'Full Stack Development',
    description: 'Complete MERN stack development with real-world projects',
    duration: '56 hours',
    students: '11,230',
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1624948384140-e48e47087fad?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmdWxsJTIwc3RhY2slMjBkZXZlbG9wZXIlMjB3b3Jrc3BhY2V8ZW58MXx8fHwxNzcyMTIzNzk2fDA&ixlib=rb-4.1.0&q=80&w=1080',
  },
];

export const CourseCarousel: React.FC = () => {
  return (
    <section id="courses" className="py-16 lg:py-24 palette-background overflow-hidden relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="course-carousel-title mb-4">Featured Courses</h2>
          <p className="text-p-font text-p-size text-p-color max-w-2xl mx-auto">
            Explore our most popular courses designed by industry experts
          </p>
        </div>

        <Swiper
          modules={[Navigation, Pagination, Autoplay]}
          spaceBetween={30}
          slidesPerView={1}
          pagination={{ clickable: true }}
          autoplay={{ delay: 3000, disableOnInteraction: false }}
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
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm palette-primary font-bold px-3 py-1 rounded-full text-sm flex items-center gap-1 shadow-sm">
                    <Star className="w-4 h-4 fill-current" style={{ color: 'var(--decorator-color)' }} />
                    {course.rating}
                  </div>
                </div>

                <div className="p-6 flex flex-col flex-grow">
                  {/* Course Content */}
                  <h3 className="course-card-title mb-3 line-clamp-2 min-h-[3.2rem]">
                    {course.title}
                  </h3>

                  <p className="text-p-font text-p-size text-p-color mb-6 flex-grow line-clamp-2">
                    {course.description}
                  </p>

                  {/* Course Meta */}
                  <div className="flex items-center justify-between mb-6 text-p-size">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-p-color" style={{ color: 'var(--decorator-color)' }} />
                      <span className="font-medium text-p-color">{course.duration}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-p-color" style={{ color: 'var(--decorator-color)' }} />
                      <span className="font-medium text-p-color">{course.students}</span>
                    </div>
                  </div>

                  {/* CTA */}
                  <button className="theme-button theme-button-primary w-full">
                    Enroll Now
                  </button>
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
        /* Create padding for the pagination dots so they don't overlap cards */
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
