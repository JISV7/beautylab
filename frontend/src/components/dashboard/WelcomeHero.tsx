import React from 'react';
import { Play, ArrowRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface LastActivity {
    courseTitle: string;
    lessonTitle: string;
    progress: number;
}

interface WelcomeHeroProps {
    lastActivity?: LastActivity;
    onContinue?: () => void;
}

export const WelcomeHero: React.FC<WelcomeHeroProps> = ({ 
    lastActivity,
    onContinue 
}) => {
    const { user } = useAuth();
    const userName = user?.name || user?.email?.split('@')[0] || 'equipo';

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Buenos días';
        if (hour < 18) return 'Buenas tardes';
        return 'Buenas noches';
    };

    return (
        <div className="dashboard-welcome-hero rounded-2xl p-8 mb-8 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full blur-2xl" />
            </div>

            <div className="relative z-10">
                {/* Greeting */}
                <div className="mb-6">
                    <p className="text-sm font-medium opacity-80 mb-2">
                        {getGreeting()}
                    </p>
                    <h1 className="dashboard-welcome-title text-3xl md:text-4xl font-bold mb-2">
                        Hola de nuevo, {userName} 👋
                    </h1>
                    <p className="dashboard-welcome-description text-lg opacity-90">
                        Continúa donde lo dejaste y sigue construyendo evidencia de avance.
                    </p>
                </div>

                {/* Continue Learning Section */}
                {lastActivity ? (
                    <div className="theme-surface rounded-xl p-6 max-w-2xl">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <Play className="w-4 h-4 theme-primary" style={{ color: 'var(--decorator-color)' }} />
                                    <span className="text-xs font-medium theme-text-link">
                                        CONTINÚA DONDE LO DEJASTE
                                    </span>
                                </div>
                                <h3 className="text-lg font-semibold theme-text-base mb-1">
                                    {lastActivity.lessonTitle}
                                </h3>
                                <p className="text-sm theme-text-link mb-4">
                                    {lastActivity.courseTitle}
                                </p>
                                <div className="w-full theme-border rounded-full h-2 mb-2">
                                    <div 
                                        className="dashboard-progress-fill h-2 rounded-full transition-all"
                                        style={{ width: `${lastActivity.progress}%` }}
                                    />
                                </div>
                                <p className="text-xs theme-text-link">
                                    {lastActivity.progress}% completado
                                </p>
                            </div>
                            <button
                                onClick={onContinue}
                                className="dashboard-welcome-button px-6 py-3 rounded-lg font-semibold flex items-center gap-2 whitespace-nowrap hover:opacity-90 transition-opacity"
                            >
                                Continuar
                                <ArrowRight className="w-4 h-4" style={{ color: 'var(--decorator-color)' }} />
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="theme-surface rounded-xl p-6 max-w-2xl">
                        <p className="theme-text-base mb-4">
                            Aún no has comenzado ningún curso. Explora la oferta formativa para tu equipo.
                        </p>
                        <button className="dashboard-welcome-button px-6 py-3 rounded-lg font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity">
                            Explorar cursos
                            <ArrowRight className="w-4 h-4" style={{ color: 'var(--decorator-color)' }} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
