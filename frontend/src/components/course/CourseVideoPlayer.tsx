import React, { useEffect, useRef, useState } from 'react';
import {
    Play,
    Pause,
    Volume2,
    VolumeX,
    Maximize,
    RotateCcw,
    RotateCw,
    MonitorPlay,
    AlertTriangle,
} from 'lucide-react';
import {
    createPlayer,
    useMediaAttach,
    PlayButton,
    MuteButton,
    VolumeSlider,
    TimeSlider,
    FullscreenButton,
    Controls,
    SeekButton,
    Time,
    PlaybackRateButton,
    PiPButton,
    BufferingIndicator,
} from '@videojs/react';
import { videoFeatures } from '@videojs/react/video';

const Player = createPlayer({
    features: videoFeatures,
    displayName: 'CursorgCoursePlayer',
});

export interface CourseVideoPlayerProps {
    src: string;
    poster?: string | null;
    title: string;
    initialProgress?: number;
    onProgress?: (percent: number) => void;
}

/** Subset of the Video.js player store used by the keyboard shortcuts. */
interface PlayerStore {
    play(): Promise<void>;
    pause(): void;
    seek(time: number): Promise<number>;
    setVolume(volume: number): number;
    toggleMuted(): boolean;
    requestFullscreen(): Promise<void>;
    exitFullscreen(): Promise<void>;
}

const CoursePlayerUI: React.FC<CourseVideoPlayerProps> = ({
    src,
    poster,
    title,
    initialProgress = 0,
    onProgress,
}) => {
    const store = Player.usePlayer() as unknown as PlayerStore;
    const setMedia = useMediaAttach();
    const containerRef = useRef<HTMLDivElement>(null);
    const resumedRef = useRef(false);
    const lastReportedPercentRef = useRef<number | null>(null);
    const [hasError, setHasError] = useState(false);

    const paused = Player.usePlayer((state) => state.paused as boolean);
    const duration = Player.usePlayer((state) => state.duration as number);
    const currentTime = Player.usePlayer((state) => state.currentTime as number);
    const volume = Player.usePlayer((state) => state.volume as number);
    const muted = Player.usePlayer((state) => state.muted as boolean);
    const isFullscreen = Player.usePlayer((state) => state.fullscreen as boolean);

    // Resume where the customer left off. Completed courses restart from the
    // beginning so the learner can review them.
    useEffect(() => {
        if (resumedRef.current || !duration || !Number.isFinite(duration) || duration <= 0) {
            return;
        }

        resumedRef.current = true;
        if (initialProgress > 0 && initialProgress < 100) {
            store.seek(duration * (Math.min(initialProgress, 95) / 100));
        }
    }, [duration, initialProgress, store]);

    // Report the percentage reached. The page throttles network writes so the
    // API is not called on every video frame.
    useEffect(() => {
        if (!duration || !Number.isFinite(duration) || duration <= 0) return;

        const percent = Math.max(
            0,
            Math.min(100, Math.round((currentTime / duration) * 100))
        );

        if (lastReportedPercentRef.current === percent) return;
        lastReportedPercentRef.current = percent;
        onProgress?.(percent);
    }, [currentTime, duration, onProgress]);

    const handleKeyDown = (event: React.KeyboardEvent) => {
        const target = event.target as HTMLElement;
        if (['input', 'textarea', 'select'].includes(target.tagName.toLowerCase())) {
            return;
        }

        switch (event.key.toLowerCase()) {
            case ' ':
            case 'k':
                event.preventDefault();
                if (paused) store.play();
                else store.pause();
                break;
            case 'f':
                event.preventDefault();
                if (isFullscreen) store.exitFullscreen();
                else store.requestFullscreen();
                break;
            case 'm':
                event.preventDefault();
                store.toggleMuted();
                break;
            case 'arrowup':
                event.preventDefault();
                store.setVolume(Math.min(1, volume + 0.1));
                if (muted) store.toggleMuted();
                break;
            case 'arrowdown':
                event.preventDefault();
                store.setVolume(Math.max(0, volume - 0.1));
                break;
            case 'arrowleft':
                event.preventDefault();
                store.seek(Math.max(0, currentTime - 5));
                break;
            case 'arrowright':
                event.preventDefault();
                store.seek(currentTime + 5);
                break;
        }
    };

    return (
        <Player.Container
            ref={containerRef}
            className="relative w-full aspect-video bg-black outline-none group overflow-hidden"
            tabIndex={0}
            onKeyDown={handleKeyDown}
            aria-label={`Reproductor del curso ${title}`}
        >
            <video
                ref={setMedia}
                className="w-full h-full object-contain"
                src={src}
                poster={poster || undefined}
                playsInline
                preload="metadata"
                onError={() => setHasError(true)}
            />

            <BufferingIndicator />

            {hasError && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-6 text-center">
                    <div>
                        <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-amber-400" />
                        <p className="text-white font-semibold">
                            No se pudo cargar el video.
                        </p>
                        <p className="text-white/60 text-sm mt-1">
                            Verifica el enlace del curso o inténtalo de nuevo.
                        </p>
                    </div>
                </div>
            )}

            {paused && !hasError && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <PlayButton
                        render={(props) => (
                            <button
                                {...props}
                                aria-label="Reproducir video"
                                className="pointer-events-auto w-20 h-20 rounded-full bg-white/95 text-slate-950 shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
                            >
                                <Play size={36} fill="currentColor" className="ml-1" />
                            </button>
                        )}
                    />
                </div>
            )}

            <Controls.Root className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/85 via-black/10 to-transparent opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 transition-opacity duration-300">
                <div className="px-4 pt-16 pb-2">
                    <TimeSlider.Root className="w-full h-1.5 bg-white/25 rounded-full appearance-none cursor-pointer group/slider relative flex items-center">
                        <TimeSlider.Track className="w-full h-full bg-white/25 rounded-full absolute" />
                        <TimeSlider.Fill
                            className="h-full bg-palette-primary rounded-full absolute"
                            style={{ width: 'var(--media-slider-fill)' }}
                        />
                        <TimeSlider.Thumb
                            className="w-3.5 h-3.5 bg-white rounded-full absolute shadow-lg scale-0 group-hover/slider:scale-100 data-[interactive]:scale-100 transition-transform"
                            style={{
                                left: 'var(--media-slider-fill)',
                                transform: 'translateX(-50%)',
                            }}
                        />
                    </TimeSlider.Root>
                </div>

                <div className="flex items-center justify-between gap-3 px-4 pb-4">
                    <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                        <PlayButton
                            render={(props, state) => (
                                <button
                                    {...props}
                                    aria-label={state.paused ? 'Reproducir' : 'Pausar'}
                                    className="text-white hover:scale-110 transition-transform"
                                >
                                    {state.paused ? (
                                        <Play size={24} fill="white" />
                                    ) : (
                                        <Pause size={24} fill="white" />
                                    )}
                                </button>
                            )}
                        />

                        <div className="hidden sm:flex items-center gap-2">
                            <SeekButton
                                seconds={-10}
                                render={(props) => (
                                    <button
                                        {...props}
                                        aria-label="Retroceder 10 segundos"
                                        className="text-white/80 hover:text-white transition-colors"
                                    >
                                        <RotateCcw size={20} />
                                    </button>
                                )}
                            />
                            <SeekButton
                                seconds={10}
                                render={(props) => (
                                    <button
                                        {...props}
                                        aria-label="Avanzar 10 segundos"
                                        className="text-white/80 hover:text-white transition-colors"
                                    >
                                        <RotateCw size={20} />
                                    </button>
                                )}
                            />
                        </div>

                        <div className="flex items-center gap-1 text-xs sm:text-sm font-medium text-white/90 whitespace-nowrap">
                            <Time.Value type="current" />
                            <span className="text-white/40">/</span>
                            <Time.Value type="duration" />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="hidden sm:flex items-center gap-2">
                            <MuteButton
                                render={(props, state) => (
                                    <button
                                        {...props}
                                        aria-label={state.muted ? 'Activar sonido' : 'Silenciar'}
                                        className="text-white hover:scale-110 transition-transform"
                                    >
                                        {state.muted ? (
                                            <VolumeX size={22} />
                                        ) : (
                                            <Volume2 size={22} />
                                        )}
                                    </button>
                                )}
                            />
                            <VolumeSlider.Root className="w-16 lg:w-20 h-1.5 bg-white/25 rounded-full relative flex items-center">
                                <VolumeSlider.Track className="w-full h-full bg-white/25 rounded-full absolute" />
                                <VolumeSlider.Fill
                                    className="h-full bg-palette-primary rounded-full absolute"
                                    style={{ width: 'var(--media-slider-fill)' }}
                                />
                                <VolumeSlider.Thumb
                                    className="w-3 h-3 bg-white rounded-full absolute shadow-md"
                                    style={{
                                        left: 'var(--media-slider-fill)',
                                        transform: 'translateX(-50%)',
                                    }}
                                />
                            </VolumeSlider.Root>
                        </div>

                        <PlaybackRateButton
                            render={(props, state) => (
                                <button
                                    {...props}
                                    aria-label="Velocidad de reproducción"
                                    className="hidden sm:block text-white text-xs font-bold hover:bg-white/10 px-2 py-1 rounded transition-colors"
                                >
                                    {state.rate}x
                                </button>
                            )}
                        />

                        <PiPButton
                            render={(props) => (
                                <button
                                    {...props}
                                    aria-label="Picture in picture"
                                    className="hidden sm:block text-white hover:scale-110 transition-transform"
                                >
                                    <MonitorPlay size={22} />
                                </button>
                            )}
                        />

                        <FullscreenButton
                            render={(props) => (
                                <button
                                    {...props}
                                    aria-label="Pantalla completa"
                                    className="text-white hover:scale-110 transition-transform"
                                >
                                    <Maximize size={22} />
                                </button>
                            )}
                        />
                    </div>
                </div>
            </Controls.Root>
        </Player.Container>
    );
};

export const CourseVideoPlayer: React.FC<CourseVideoPlayerProps> = (props) => {
    return (
        <Player.Provider>
            <CoursePlayerUI {...props} />
        </Player.Provider>
    );
};
