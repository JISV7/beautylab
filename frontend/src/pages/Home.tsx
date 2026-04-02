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
    onNavigateToHome?: () => void;
    onLogout?: () => void;
}

export function Home({ onNavigateToDashboard, onNavigateToAdmin, onNavigateToHome, onLogout }: HomeProps) {
    const { currentMode } = useTheme();

    return (
        <div className={`min-h-screen flex flex-col ${currentMode}`}>
            <Header 
                onNavigateToDashboard={onNavigateToDashboard} 
                onNavigateToAdmin={onNavigateToAdmin} 
                onNavigateToHome={onNavigateToHome}
                onLogout={onLogout}
                isOnHome={true}
            />
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
