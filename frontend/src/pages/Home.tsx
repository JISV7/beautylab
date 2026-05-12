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
import { TangramLoader } from '../components/common/TangramLoader';
import { normalizeUrl } from '../utils/url';

import { BASE_URL } from '../config';

interface HomeConfig {
    video?: {
        enabled: boolean;
        url: string;
        title: string;
        description: string;
        autoplay: boolean;
        subtitles?: Array<{ label: string; src: string; srcLang: string }>;
        audio_tracks?: Array<{ label: string; src: string; lang: string }>;
    };
    carousel?: {
        enabled: boolean;
        slides: Array<{ id: string; image_url: string; title: string; description: string; link_url: string; is_active?: boolean }>;
    };
}

export function Home() {
    const { activeTheme, currentMode } = useTheme();
    const [homeConfig, setHomeConfig] = useState<HomeConfig | null>(null);
    
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
                const response = await axios.get(`${BASE_URL}/home-config`);
                setHomeConfig(response.data.config);
            } catch (error) {
                console.error('Error fetching home config:', error);
            }
        };
        fetchHomeConfig();
    }, []);

    // Sync loader state with theme config using render-phase state update
    const [prevActiveTheme, setPrevActiveTheme] = useState(activeTheme);
    const [prevMode, setPrevMode] = useState(currentMode);

    if (activeTheme !== prevActiveTheme || currentMode !== prevMode) {
        setPrevActiveTheme(activeTheme);
        setPrevMode(currentMode);
        
        const loaderEnabled = !!activeTheme?.config[currentMode]?.colors?.loader?.enabled;
        const wasRedirect = sessionStorage.getItem('redirectAfterLogin') === 'true';
        
        if (!wasRedirect && showLoader !== loaderEnabled) {
            setShowLoader(loaderEnabled);
        }
    }

    useEffect(() => {
        const wasRedirect = sessionStorage.getItem('redirectAfterLogin') === 'true';
        if (wasRedirect && activeTheme) {
            const currentPalette = activeTheme.config[currentMode];
            const loaderEnabled = !!currentPalette?.colors?.loader?.enabled;
            
            const timer = setTimeout(() => {
                setShowLoader(loaderEnabled);
                sessionStorage.removeItem('redirectAfterLogin');
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [activeTheme, currentMode]);

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
                        url={normalizeUrl(homeConfig.video.url)}
                        subtitles={homeConfig.video.subtitles?.map((s) => ({ ...s, src: normalizeUrl(s.src) }))}
                        audio_tracks={homeConfig.video.audio_tracks?.map((a) => ({ ...a, src: normalizeUrl(a.src) }))}
                        title={homeConfig.video.title}
                        description={homeConfig.video.description}
                        autoplay={homeConfig.video.autoplay}
                    />
                )}
                {homeConfig?.carousel?.enabled && homeConfig?.carousel?.slides && homeConfig.carousel.slides.length > 0 && (
                    <AdvancedCarousel slides={homeConfig.carousel.slides.map((s) => ({ ...s, image_url: normalizeUrl(s.image_url), is_active: s.is_active ?? true }))} />
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
