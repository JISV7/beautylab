import { useState, useEffect } from 'react';
import axios from 'axios';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { Hero } from '../components/home/Hero';
import { Services } from '../components/home/Services';
import { About } from '../components/home/About';
import { ContactForm } from '../components/home/ContactForm';
import { PromotionalVideo } from '../components/home/PromotionalVideo';
import { AdvancedCarousel } from '../components/home/AdvancedCarousel';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { TangramLoader } from '../components/common/TangramLoader';

const API_URL = 'http://localhost:8000';

export function Home() {
    const { activeTheme, currentMode } = useTheme();
    const { user } = useAuth();
    const [homeConfig, setHomeConfig] = useState<any>(null);
    
    // Check if this is a redirect after login
    const isRedirectAfterLogin = typeof window !== 'undefined' && sessionStorage.getItem('redirectAfterLogin') === 'true';
    
    // Initialize state - follow theme config if available to avoid flicker
    const [showLoader, setShowLoader] = useState(() => {
        if (isRedirectAfterLogin) return false;
        return !!activeTheme?.config[currentMode]?.colors?.loader?.enabled;
    });


    useEffect(() => {
        const fetchHomeConfig = async () => {
            try {
                const response = await axios.get(`${API_URL}/home-config`);
                setHomeConfig(response.data.config);
            } catch (error) {
                console.error('Error fetching home config:', error);
            }
        };
        fetchHomeConfig();

        // Loader enabled in theme config and not admin/root
        if (!activeTheme) return;
        const currentPalette = activeTheme.config[currentMode];
        const loaderEnabled = !!currentPalette?.colors?.loader?.enabled;
        
        // Check if this is a redirect after login (add delay)
        const wasRedirect = sessionStorage.getItem('redirectAfterLogin') === 'true';
        
        if (wasRedirect) {
            // Add 1-second delay for redirect transitions
            const timer = setTimeout(() => {
                setShowLoader(loaderEnabled);
                sessionStorage.removeItem('redirectAfterLogin');
            }, 1000);
            return () => clearTimeout(timer);
        } else {
            // Standard load: follow theme config
            setShowLoader(loaderEnabled);
        }
    }, [activeTheme, user, currentMode]);

    const handleLoaderFinish = () => {
        setShowLoader(false);
    };

    if (!activeTheme) {
        return null;
    }

    return (
        <div className={`min-h-screen flex flex-col ${currentMode}`}>
            <Header />
            <main className="flex-1">
                <Hero />
                
                {homeConfig?.video?.enabled && homeConfig?.video?.url && (
                    <PromotionalVideo 
                        url={homeConfig.video.url}
                        subtitles={homeConfig.video.subtitles}
                        audioTracks={homeConfig.video.audio_tracks}
                        title={homeConfig.video.title}
                        description={homeConfig.video.description}
                        autoplay={homeConfig.video.autoplay}
                    />
                )}

                {homeConfig?.carousel?.slides?.length > 0 && (
                    <AdvancedCarousel slides={homeConfig.carousel.slides} />
                )}

                <Services />
                <About />
                <ContactForm />
            </main>
            <Footer />
            {showLoader && (
                <TangramLoader
                    onFinish={handleLoaderFinish}
                />
            )}
        </div>
    );
}
