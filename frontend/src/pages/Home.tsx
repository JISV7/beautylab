import { useState, useEffect } from 'react';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { Hero } from '../components/home/Hero';
import { CourseCarousel } from '../components/home/CourseCarousel';
import { Services } from '../components/home/Services';
import { About } from '../components/home/About';
import { ContactForm } from '../components/home/ContactForm';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { TangramLoader } from '../components/common/TangramLoader';

export function Home() {
    const { activeTheme, currentMode } = useTheme();
    const { user } = useAuth();
    const [showLoader, setShowLoader] = useState(false);


    useEffect(() => {
        // Loader enabled in theme config and not admin/root
        if (!activeTheme) return;
        const currentPalette = activeTheme.config[currentMode];
        const loaderEnabled = currentPalette?.colors?.loader?.enabled;
        // --- Session logic (deactivated, just uncomment to reactivate) ---
        // const hasSeenLoader = sessionStorage.getItem('hasSeenTangramLoader');
        // const shouldShowLoader = !!loaderEnabled && !hasSeenLoader;
        // setShowLoader(shouldShowLoader);

        // --- Always show loader on Home reload (current behavior) ---
        setShowLoader(!!loaderEnabled);
    }, [activeTheme, user, currentMode]);

    const handleLoaderFinish = () => {
        setShowLoader(false);
        // sessionStorage.setItem('hasSeenTangramLoader', 'true'); // (deactivated)
    };

    if (!activeTheme) {
        return null;
    }

    const currentPalette = activeTheme.config[currentMode];

    return (
        <div className={`min-h-screen flex flex-col ${currentMode}`}>
            <Header />
            <main className="flex-1">
                <Hero />
                <CourseCarousel />
                <Services />
                <About />
                <ContactForm />
            </main>
            <Footer />
            {showLoader && (
                <TangramLoader
                    onFinish={handleLoaderFinish}
                    selectedTangram={currentPalette?.colors?.loader?.selectedTangram || 1}
                />
            )}
        </div>
    );
}
