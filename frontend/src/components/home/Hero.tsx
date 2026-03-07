import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

export const Hero: React.FC = () => {
  return (
    <section className="hero-section relative overflow-hidden py-20 lg:py-32">
      {/* Background gradient */}
      <div className="hero-background absolute inset-0 opacity-5"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* Badge */}
          <div className="hero-badge inline-flex items-center gap-2 px-4 py-2 rounded-full palette-surface palette-border border mb-6">
            <Sparkles className="w-4 h-4 palette-text-secondary" />
            <span className="hero-badge-text">Master the Future of Technology</span>
          </div>

          {/* Heading */}
          <h1 className="hero-title mb-6 max-w-4xl mx-auto">
            Learn Programming, Web Development & Agentic AI
          </h1>

          {/* Description */}
          <p className="hero-description mb-8 max-w-2xl mx-auto">
            Transform your career with cutting-edge courses in web development, programming fundamentals,
            and the emerging field of agentic AI. Join thousands of learners building the future.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button className="hero-cta-primary inline-flex items-center gap-2">
              Get Started Free
              <ArrowRight className="w-4 h-4" />
            </button>
            <button className="hero-cta-secondary">
              Browse Courses
            </button>
          </div>

          {/* Stats */}
          <div className="hero-stats grid grid-cols-3 gap-8 mt-16 max-w-3xl mx-auto">
            <div className="hero-stat">
              <div className="hero-stat-value">50K+</div>
              <div className="hero-stat-label">Active Learners</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-value">200+</div>
              <div className="hero-stat-label">Expert Courses</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-value">95%</div>
              <div className="hero-stat-label">Success Rate</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
