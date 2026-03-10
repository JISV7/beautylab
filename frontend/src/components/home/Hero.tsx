import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

export const Hero: React.FC = () => {
  return (
    <section className="relative overflow-hidden py-20 lg:py-32 palette-background">
      {/* Background gradient */}
      <div className="absolute inset-0 opacity-5 bg-gradient"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full palette-surface palette-border border mb-6">
            <Sparkles className="w-4 h-4 text-p-color" />
            <span className="text-p-font text-p-size text-p-color">Master the Future of Technology</span>
          </div>

          {/* Heading */}
          <h1 className="text-h1-font text-h1-size text-h1-color mb-6 max-w-4xl mx-auto">
            Learn Programming, Web Development & Agentic AI
          </h1>

          {/* Description */}
          <p className="text-p-font text-p-size text-p-color mb-8 max-w-2xl mx-auto">
            Transform your career with cutting-edge courses in web development, programming fundamentals,
            and the emerging field of agentic AI. Join thousands of learners building the future.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button className="theme-button theme-button-primary">
              Get Started Free
              <ArrowRight className="w-4 h-4 decorator-color" />
            </button>
            <button className="theme-button theme-button-secondary">
              Browse Courses
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 mt-16 max-w-3xl mx-auto">
            <div>
              <div className="text-title-size text-title-weight text-primary">50K+</div>
              <div className="text-p-font text-p-size text-p-color">Active Learners</div>
            </div>
            <div>
              <div className="text-title-size text-title-weight text-primary">200+</div>
              <div className="text-p-font text-p-size text-p-color">Expert Courses</div>
            </div>
            <div>
              <div className="text-title-size text-title-weight text-primary">95%</div>
              <div className="text-p-font text-p-size text-p-color">Success Rate</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
