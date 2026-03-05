import React from 'react';
import { Code2, Globe, Bot, Zap, BookOpen, Award } from 'lucide-react';

const services = [
  {
    icon: Code2,
    title: 'Programming Fundamentals',
    description: 'Learn the core concepts of programming with Python, JavaScript, and more. Build a solid foundation for your coding journey.',
  },
  {
    icon: Globe,
    title: 'Web Development',
    description: 'Master modern web technologies including React, Next.js, and responsive design. Create beautiful, performant websites.',
  },
  {
    icon: Bot,
    title: 'Agentic AI',
    description: 'Explore the cutting edge of AI with LLMs, autonomous agents, and intelligent systems that can reason and act.',
  },
  {
    icon: Zap,
    title: 'Performance Optimization',
    description: 'Learn techniques to build lightning-fast applications with optimal user experience and resource efficiency.',
  },
  {
    icon: BookOpen,
    title: 'Hands-on Projects',
    description: 'Apply your knowledge with real-world projects. Build your portfolio while learning industry best practices.',
  },
  {
    icon: Award,
    title: 'Certification Programs',
    description: 'Earn recognized certificates upon completion. Showcase your skills to employers and advance your career.',
  },
];

export const Services: React.FC = () => {
  return (
    <section id="services" className="py-16 lg:py-24 theme-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="theme-subtitle mb-4">What We Offer</h2>
          <p className="theme-paragraph theme-text-secondary max-w-2xl mx-auto">
            Comprehensive learning paths designed to take you from beginner to professional
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <div
              key={index}
              className="theme-surface border theme-border rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden group p-6"
            >
              <div className="w-12 h-12 rounded-lg theme-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <service.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="theme-subtitle mb-3">{service.title}</h3>
              <p className="theme-paragraph theme-text-secondary">
                {service.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
