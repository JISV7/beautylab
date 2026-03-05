import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { Hero } from '../components/home/Hero';
import { CourseCarousel } from '../components/home/CourseCarousel';
import { Services } from '../components/home/Services';
import { ContactForm } from '../components/home/ContactForm';

interface HomeProps {
    onNavigateToDashboard?: () => void;
}

export function Home({ onNavigateToDashboard }: HomeProps) {
    return (
        <div className="min-h-screen flex flex-col font-sans theme-text-base theme-background">
            <Header onNavigateToDashboard={onNavigateToDashboard} />
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
