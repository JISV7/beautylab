import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { Hero } from '../components/home/Hero';
import { CourseCarousel } from '../components/home/CourseCarousel';
import { Services } from '../components/home/Services';
import { About } from '../components/home/About';
import { ContactForm } from '../components/home/ContactForm';
import { useTheme } from '../contexts/ThemeContext';

interface HomeProps {
    onNavigateToDashboard?: () => void;
    onNavigateToAdmin?: () => void;
    onNavigateToExplore?: () => void;
    onLogout?: () => void;
}

export function Home({ onNavigateToDashboard, onNavigateToAdmin, onNavigateToExplore, onLogout }: HomeProps) {
    const { currentMode } = useTheme();

    return (
        <div className={`min-h-screen flex flex-col ${currentMode}`}>
            <Header onNavigateToDashboard={onNavigateToDashboard} onNavigateToAdmin={onNavigateToAdmin} onNavigateToExplore={onNavigateToExplore} onLogout={onLogout} />
            <main className="flex-1">
                <Hero />
                <CourseCarousel />
                <Services />
                <About />
                <ContactForm />
            </main>
            <Footer />
        </div>
    );
}
