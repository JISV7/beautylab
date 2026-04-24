import React, { useEffect, useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface TangramLoaderProps {
    onFinish: () => void;
    selectedTangram?: number;
}

export const TangramLoader: React.FC<TangramLoaderProps> = ({ onFinish, selectedTangram = 1 }) => {
    const { currentMode } = useTheme();
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        console.log('[TangramLoader] Mounted with variant:', selectedTangram);
        // Auto-finish after animation (e.g., 5 seconds)
        const timer = setTimeout(() => {
            handleFinish();
        }, 6000);
        return () => clearTimeout(timer);
    }, []);

    const handleFinish = () => {
        setIsExiting(true);
        setTimeout(onFinish, 500); // Wait for fade out
    };

    // Tangram pieces - 7 pieces as requested
    const pieces = [
        { id: 1, color: 'var(--palette-primary)', delay: '0s', type: 'large-tri' },
        { id: 2, color: 'var(--palette-secondary)', delay: '0.2s', type: 'large-tri' },
        { id: 3, color: 'var(--palette-accent)', delay: '0.4s', type: 'med-tri' },
        { id: 4, color: 'var(--palette-surface)', delay: '0.6s', type: 'small-tri' },
        { id: 5, color: 'var(--palette-primary)', opacity: 0.7, delay: '0.8s', type: 'small-tri' },
        { id: 6, color: 'var(--palette-secondary)', opacity: 0.7, delay: '1.0s', type: 'square' },
        { id: 7, color: 'var(--palette-accent)', opacity: 0.7, delay: '1.2s', type: 'parallelogram' },
    ];

    return (
        <div className={`fixed inset-0 z-[9999] flex items-center justify-center palette-background transition-opacity duration-500 ${isExiting ? 'opacity-0' : 'opacity-100'} ${currentMode}`}>
            <style>{`
                .tangram-container {
                    width: 300px;
                    height: 300px;
                    position: relative;
                    perspective: 1000px;
                    transform-style: preserve-3d;
                }

                .tangram-piece {
                    position: absolute;
                    width: 100px;
                    height: 100px;
                    transition: transform 1s ease-out, opacity 1s ease-out;
                    animation: float 4s infinite ease-in-out;
                }

                @keyframes float {
                    0%, 100% { transform: translateY(0) rotateX(0) rotateY(0); }
                    50% { transform: translateY(-20px) rotateX(10deg) rotateY(10deg); }
                }

                /* Animation variations based on selectedTangram */
                .tangram-1 .tangram-piece { animation-name: float3d-1; }
                .tangram-2 .tangram-piece { animation-name: float3d-2; }
                .tangram-3 .tangram-piece { animation-name: float3d-3; }

                @keyframes float3d-1 {
                    0% { transform: scale(0) rotate(-180deg) translateZ(-500px); opacity: 0; }
                    20% { transform: scale(1.1) rotate(10deg) translateZ(50px); opacity: 1; }
                    40% { transform: scale(1) rotate(0) translateZ(0); }
                    100% { transform: scale(1) rotate(0) translateZ(0); }
                }

                @keyframes float3d-2 {
                    0% { transform: translateX(-100vw) rotateY(90deg); opacity: 0; }
                    30% { transform: translateX(20px) rotateY(-20deg); opacity: 1; }
                    50% { transform: translateX(0) rotateY(0); }
                    100% { transform: translateX(0) rotateY(0); }
                }

                @keyframes float3d-3 {
                    0% { transform: translateY(100vh) rotateX(90deg); opacity: 0; }
                    30% { transform: translateY(-20px) rotateX(-20deg); opacity: 1; }
                    50% { transform: translateY(0) rotateX(0); }
                    100% { transform: translateY(0) rotateX(0); }
                }

                /* Basic shapes for the "simple rectangles" request, but layout like a tangram */
                .piece-1 { top: 0; left: 0; width: 150px; height: 150px; clip-path: polygon(0 0, 100% 0, 0 100%); }
                .piece-2 { top: 0; left: 0; width: 150px; height: 150px; clip-path: polygon(100% 0, 100% 100%, 0 100%); }
                .piece-3 { top: 75px; left: 75px; width: 150px; height: 150px; clip-path: polygon(0 0, 100% 100%, 0 100%); }
                .piece-4 { top: 150px; left: 0; width: 75px; height: 75px; clip-path: polygon(0 0, 100% 0, 0 100%); }
                .piece-5 { top: 225px; left: 75px; width: 75px; height: 75px; clip-path: polygon(0 0, 100% 0, 100% 100%); }
                .piece-6 { top: 150px; left: 75px; width: 75px; height: 75px; }
                .piece-7 { top: 0; left: 150px; width: 75px; height: 75px; clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%); }

                .skip-button {
                    position: fixed;
                    bottom: 2rem;
                    right: 2rem;
                    padding: 0.75rem 1.5rem;
                    background: var(--palette-surface);
                    border: 1px solid var(--palette-border);
                    color: var(--text-p-color);
                    border-radius: 9999px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                }

                .skip-button:hover {
                    transform: translateY(-2px);
                    background: var(--palette-primary);
                    color: white;
                    border-color: var(--palette-primary);
                }
            `}</style>

            <div className={`tangram-container tangram-${selectedTangram}`}>
                {pieces.map((piece) => (
                    <div
                        key={piece.id}
                        className={`tangram-piece piece-${piece.id}`}
                        style={{
                            backgroundColor: piece.color,
                            opacity: piece.opacity || 1,
                            animationDelay: piece.delay,
                            animationDuration: '5s',
                            animationFillMode: 'both'
                        }}
                    />
                ))}
            </div>

            <button className="skip-button" onClick={handleFinish}>
                Saltar Animación →
            </button>
        </div>
    );
};
