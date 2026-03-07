import React from 'react';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { Hero } from '../components/home/Hero';
import { CourseCarousel } from '../components/home/CourseCarousel';
import { Services } from '../components/home/Services';
import { ContactForm } from '../components/home/ContactForm';
import { useTheme } from '../contexts/ThemeContext';

interface HomeProps {
    onNavigateToDashboard?: () => void;
    onNavigateToAdmin?: () => void;
}

export function Home({ onNavigateToDashboard, onNavigateToAdmin }: HomeProps) {
    const { isLoading, currentMode } = useTheme();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center palette-background">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-palette-primary mx-auto"></div>
                    <p className="mt-4 palette-text">Loading theme...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen flex flex-col ${currentMode}`}>
            <Header onNavigateToDashboard={onNavigateToDashboard} onNavigateToAdmin={onNavigateToAdmin} />
            <main className="flex-1">
                <Hero />
                <CourseCarousel />
                <Services />
                <ContactForm />
            </main>
            <Footer />
        </div>
    );
}
