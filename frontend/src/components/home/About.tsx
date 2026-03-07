import React from 'react';
import { Target, Users, Lightbulb, Trophy } from 'lucide-react';

const aboutFeatures = [
  {
    icon: Target,
    title: 'Our Mission',
    description: 'To empower learners worldwide with cutting-edge technology skills, making quality education accessible and engaging for everyone.',
  },
  {
    icon: Users,
    title: 'Our Community',
    description: 'Join thousands of students from around the globe. Learn together, grow together, and build your professional network.',
  },
  {
    icon: Lightbulb,
    title: 'Our Approach',
    description: 'Hands-on, project-based learning with real-world applications. We focus on practical skills that employers value.',
  },
  {
    icon: Trophy,
    title: 'Our Success',
    description: 'Graduates from Codyn have gone on to work at top tech companies and launch successful startups of their own.',
  },
];

export const About: React.FC = () => {
  return (
    <section id="about" className="py-16 lg:py-24 palette-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-subtitle-size text-subtitle-color text-subtitle-weight mb-4">About Codyn</h2>
          <p className="text-p-size text-p-color max-w-2xl mx-auto">
            We're passionate about transforming technology education and helping learners achieve their career goals.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {aboutFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="text-center p-6 rounded-xl palette-border border hover:shadow-md transition-shadow duration-300"
              >
                <div className="w-12 h-12 rounded-lg palette-primary flex items-center justify-center mb-4 mx-auto">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-subtitle-size text-subtitle-color text-subtitle-weight mb-3">{feature.title}</h3>
                <p className="text-p-size text-p-color">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
