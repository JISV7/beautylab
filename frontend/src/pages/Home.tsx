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
        // Check if loader should be shown
        // 1. Loader must be enabled in theme config for the current mode
        // 2. User must not be an admin/root
        if (!activeTheme) {
            console.log('[Home] Waiting for activeTheme...');
            return;
        }

        const currentPalette = activeTheme.config[currentMode];
        const loaderEnabled = currentPalette?.colors?.loader?.enabled;
        const selectedTangram = currentPalette?.colors?.loader?.selectedTangram;

        const roles = user?.roles ?? [];
        const isAdmin = roles.includes('admin') || roles.includes('root');

        console.log('[Home] Loader check:', {
            mode: currentMode,
            enabled: loaderEnabled,
            tangram: selectedTangram,
            isAdmin,
            user: user?.email || 'guest'
        });

        const hasSeenLoader = sessionStorage.getItem('hasSeenTangramLoader');
        const shouldShowLoader = !!loaderEnabled && !isAdmin && !hasSeenLoader;

        if (shouldShowLoader) {
            console.log('[Home] Showing loader');
        } else {
            console.log('[Home] Loader not shown', { hasSeenLoader, loaderEnabled, isAdmin });
        }

        setShowLoader(shouldShowLoader);
    }, [activeTheme, user, currentMode]);

    const handleLoaderFinish = () => {
        setShowLoader(false);
        sessionStorage.setItem('hasSeenTangramLoader', 'true');
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
