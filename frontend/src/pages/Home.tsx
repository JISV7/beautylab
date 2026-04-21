import React, { useState, useEffect } from 'react';
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

        if (loaderEnabled && !isAdmin) {
            // Check session storage so we only show it once per session
            const hasSeenLoader = sessionStorage.getItem('hasSeenTangramLoader');
            if (!hasSeenLoader) {
                console.log('[Home] Showing loader');
                setShowLoader(true);
            } else {
                console.log('[Home] Loader already seen in this session');
            }
        }
    }, [activeTheme, user, currentMode]);

    const handleLoaderFinish = () => {
        setShowLoader(false);
        sessionStorage.setItem('hasSeenTangramLoader', 'true');
    };

    if (showLoader) {
        const currentPalette = activeTheme?.config?.[currentMode];
        return <TangramLoader 
            onFinish={handleLoaderFinish} 
            selectedTangram={currentPalette?.colors?.loader?.selectedTangram || 1} 
        />;
    }

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
        </div>
    );
}
