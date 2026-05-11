import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Subtitles, RotateCcw, RotateCw, Settings2, MonitorPlay } from 'lucide-react';
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
    Poster,
    Popover
} from '@videojs/react';
import { videoFeatures } from '@videojs/react/video';

const Player = createPlayer({
    features: videoFeatures
});

interface Subtitle {
    label: string;
    src: string;
    srcLang: string;
    default?: boolean;
}

interface AudioTrack {
    label: string;
    src: string;
    lang: string;
    default?: boolean;
}

interface VideoProps {
    url: string;
    subtitles?: Subtitle[];
    audio_tracks?: AudioTrack[];
    title?: string;
    description?: string;
    autoplay?: boolean;
}

const AudioTrackSync: React.FC<{ 
    selectedAudio: string; 
    audio_tracks: AudioTrack[];
}> = ({ selectedAudio, audio_tracks }) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);
    const media = Player.useMedia() as unknown as HTMLVideoElement | null;
    
    const isPlaying = Player.usePlayer(state => !state.paused);
    const currentTime = Player.usePlayer(state => state.currentTime as number);
    const volume = Player.usePlayer(state => state.volume as number);
    const isMuted = Player.usePlayer(state => state.muted as boolean);
    
    const isUsingSeparateAudio = selectedAudio !== 'default';
    const currentAudioTrack = audio_tracks.find(a => a.lang === selectedAudio);

    // Synchronize playback
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || !media || !isUsingSeparateAudio) return;

        if (isPlaying) {
            audio.play().catch(e => console.error("Audio play failed:", e));
        } else {
            audio.pause();
        }
    }, [isPlaying, isUsingSeparateAudio, media]);

    // Synchronize time
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || !media || !isUsingSeparateAudio) return;

        if (Math.abs(audio.currentTime - currentTime) > 0.3) {
            audio.currentTime = currentTime;
        }
    }, [currentTime, isUsingSeparateAudio, media]);

    // Synchronize volume and mute to the AUDIO element
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
            audioRef.current.muted = isMuted;
        }
    }, [volume, isMuted]);

    // Silence the VIDEO element using Web Audio when separate audio is active
    // This avoids updating the store's muted/volume state via media.muted = true
    useEffect(() => {
        if (!media) return;

        if (isUsingSeparateAudio) {
            if (!audioCtxRef.current) {
                const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
                audioCtxRef.current = new AudioContextClass();
                gainNodeRef.current = audioCtxRef.current.createGain();
                gainNodeRef.current.connect(audioCtxRef.current.destination);
            }

            if (!sourceRef.current) {
                sourceRef.current = audioCtxRef.current.createMediaElementSource(media);
                sourceRef.current.connect(gainNodeRef.current!);
            }

            if (gainNodeRef.current) {
                gainNodeRef.current.gain.value = 0; // Silent video
            }
        } else {
            // Restore volume if we switch back to default audio
            if (gainNodeRef.current) {
                gainNodeRef.current.gain.value = 1;
            }
        }
    }, [media, isUsingSeparateAudio]);

    if (!isUsingSeparateAudio || !currentAudioTrack) return null;

    return <audio ref={audioRef} src={currentAudioTrack.src} preload="auto" />;
};

const AudioTrackSelector: React.FC<{
    audio_tracks: AudioTrack[];
    selectedAudio: string;
    onAudioChange: (lang: string) => void;
}> = ({ audio_tracks, selectedAudio, onAudioChange }) => {
    if (audio_tracks.length === 0) return null;

    return (
        <Popover.Root>
            <Popover.Trigger render={(props) => (
                <button {...props} className="text-white hover:scale-110 transition-transform" aria-label="Audio Tracks">
                    <Settings2 size={24} />
                </button>
            )} />
            <Popover.Popup className="bg-black/90 backdrop-blur-md border border-white/10 rounded-lg p-2 min-w-[140px] mb-2 z-50">
                <div className="flex flex-col gap-1">
                    <p className="text-[10px] uppercase font-bold text-white/40 px-3 py-1">Audio Tracks</p>
                    <button 
                        onClick={() => onAudioChange('default')}
                        className={`w-full text-left px-3 py-1.5 text-sm rounded transition-colors ${selectedAudio === 'default' ? 'bg-palette-primary text-white' : 'text-gray-300 hover:bg-white/10'}`}
                    >
                        Default
                    </button>
                    {audio_tracks.map((track, idx) => (
                        <button 
                            key={idx}
                            onClick={() => onAudioChange(track.lang)}
                            className={`w-full text-left px-3 py-1.5 text-sm rounded transition-colors ${selectedAudio === track.lang ? 'bg-palette-primary text-white' : 'text-gray-300 hover:bg-white/10'}`}
                        >
                            {track.label}
                        </button>
                    ))}
                </div>
            </Popover.Popup>
        </Popover.Root>
    );
};

const SubtitleSelector: React.FC<{
    subtitles: Subtitle[];
    selectedSubtitle: string;
    onSubtitleChange: (lang: string) => void;
}> = ({ subtitles, selectedSubtitle, onSubtitleChange }) => {
    if (subtitles.length === 0) return null;

    return (
        <Popover.Root>
            <Popover.Trigger render={(props) => (
                <button {...props} className="text-white hover:scale-110 transition-transform" aria-label="Subtitles">
                    <Subtitles size={24} />
                </button>
            )} />
            <Popover.Popup className="bg-black/90 backdrop-blur-md border border-white/10 rounded-lg p-2 min-w-[140px] mb-2 z-50">
                <div className="flex flex-col gap-1">
                    <p className="text-[10px] uppercase font-bold text-white/40 px-3 py-1">Captions</p>
                    <button 
                        onClick={() => onSubtitleChange('none')}
                        className={`w-full text-left px-3 py-1.5 text-sm rounded transition-colors ${selectedSubtitle === 'none' ? 'bg-palette-primary text-white' : 'text-gray-300 hover:bg-white/10'}`}
                    >
                        Off
                    </button>
                    {subtitles.map((sub, idx) => (
                        <button 
                            key={idx}
                            onClick={() => onSubtitleChange(sub.srcLang)}
                            className={`w-full text-left px-3 py-1.5 text-sm rounded transition-colors ${selectedSubtitle === sub.srcLang ? 'bg-palette-primary text-white' : 'text-gray-300 hover:bg-white/10'}`}
                        >
                            {sub.label}
                        </button>
                    ))}
                </div>
            </Popover.Popup>
        </Popover.Root>
    );
};

const PlayerUI: React.FC<{
    url: string;
    subtitles: Subtitle[];
    audio_tracks: AudioTrack[];
    autoplay: boolean;
    selectedSubtitle: string;
    setSelectedSubtitle: (s: string) => void;
    selectedAudio: string;
    setSelectedAudio: (s: string) => void;
}> = ({ url, subtitles, audio_tracks, autoplay, selectedSubtitle, setSelectedSubtitle, selectedAudio, setSelectedAudio }) => {
    const store = Player.usePlayer() as any;
    const volume = Player.usePlayer(state => state.volume as number);
    const isMuted = Player.usePlayer(state => state.muted as boolean);
    const currentTime = Player.usePlayer(state => state.currentTime as number);
    const paused = Player.usePlayer(state => state.paused as boolean);
    const isFullscreen = Player.usePlayer(state => state.fullscreen as boolean);
    const setMedia = useMediaAttach();
    const media = Player.useMedia() as unknown as HTMLVideoElement | null;
    const containerRef = useRef<HTMLDivElement>(null);

    const handleSubtitleChange = (lang: string) => {
        setSelectedSubtitle(lang);
        if (media) {
            const tracks = media.textTracks;
            for (let i = 0; i < tracks.length; i++) {
                tracks[i].mode = tracks[i].language === lang ? 'showing' : 'hidden';
            }
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (['input', 'textarea'].includes((e.target as HTMLElement).tagName.toLowerCase())) return;

        switch (e.key.toLowerCase()) {
            case ' ':
            case 'k':
                e.preventDefault();
                if (paused) {
                    store.play();
                } else {
                    store.pause();
                }
                break;
            case 'f':
                e.preventDefault();
                if (isFullscreen) {
                    store.exitFullscreen();
                } else {
                    store.requestFullscreen();
                }
                break;
            case 'm':
                e.preventDefault();
                store.toggleMuted();
                break;
            case 'arrowup':
                e.preventDefault();
                store.setVolume(Math.min(1, volume + 0.1));
                if (isMuted) store.setMuted(false);
                break;
            case 'arrowdown':
                e.preventDefault();
                store.setVolume(Math.max(0, volume - 0.1));
                break;
            case 'arrowleft':
                e.preventDefault();
                store.seek(Math.max(0, currentTime - 5));
                break;
            case 'arrowright':
                e.preventDefault();
                store.seek(currentTime + 5);
                break;
            case 'v':
                e.preventDefault();
                if (subtitles.length > 0) {
                    const langs = ['none', ...subtitles.map(s => s.srcLang)];
                    const currentIndex = langs.indexOf(selectedSubtitle);
                    const nextIndex = (currentIndex + 1) % langs.length;
                    handleSubtitleChange(langs[nextIndex]);
                }
                break;
            case 'b':
                e.preventDefault();
                if (audio_tracks.length > 0) {
                    const langs = audio_tracks.map(a => a.lang);
                    const currentIndex = langs.indexOf(selectedAudio);
                    const nextIndex = (currentIndex + 1) % langs.length;
                    setSelectedAudio(langs[nextIndex]);
                }
                break;
        }
    };

    return (
        <Player.Container 
            ref={containerRef} 
            className="relative w-full h-full outline-none group"
            tabIndex={0}
            onKeyDown={handleKeyDown}
        >
            <video
                ref={setMedia}
                className="w-full h-full"
                src={url}
                autoPlay={autoplay}
                muted={autoplay}
                playsInline
                crossOrigin="anonymous"
            >
                {subtitles.map((sub, idx) => (
                    <track
                        key={idx}
                        label={sub.label}
                        kind="subtitles"
                        srcLang={sub.srcLang}
                        src={sub.src}
                        default={sub.default}
                    />
                ))}
            </video>

            <Poster />
            <BufferingIndicator />

            <AudioTrackSync 
                selectedAudio={selectedAudio} 
                audio_tracks={audio_tracks}
            />

            <Controls.Root className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300">
                <div className="px-4 py-2">
                    <TimeSlider.Root className="w-full h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer group/slider relative flex items-center">
                        <TimeSlider.Track className="w-full h-full bg-white/20 rounded-full absolute" />
                        <TimeSlider.Fill className="h-full bg-palette-primary rounded-full absolute" style={{ width: 'var(--media-slider-fill)' }} />
                        <TimeSlider.Thumb className="w-3.5 h-3.5 bg-white rounded-full absolute shadow-lg scale-0 group-hover/slider:scale-100 data-[interactive]:scale-100 transition-transform" style={{ left: 'var(--media-slider-fill)', transform: 'translateX(-50%)' }} />
                    </TimeSlider.Root>
                </div>

                <div className="flex items-center justify-between px-4 pb-4">
                    <div className="flex items-center gap-4">
                        <PlayButton 
                            render={(props, { paused }) => (
                                <button {...props} className="text-white hover:scale-110 transition-transform">
                                    {paused ? <Play size={24} fill="white" /> : <Pause size={24} fill="white" />}
                                </button>
                            )}
                        />

                        <div className="flex items-center gap-2">
                            <SeekButton seconds={-5} render={(props) => (
                                <button {...props} className="text-white/80 hover:text-white transition-colors">
                                    <RotateCcw size={20} />
                                </button>
                            )} />
                            <SeekButton seconds={5} render={(props) => (
                                <button {...props} className="text-white/80 hover:text-white transition-colors">
                                    <RotateCw size={20} />
                                </button>
                            )} />
                        </div>

                        <div className="flex items-center gap-1 text-sm font-medium text-white/90">
                            <Time.Value type="current" />
                            <span className="text-white/40">/</span>
                            <Time.Value type="duration" />
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 group/volume">
                            <MuteButton 
                                render={(props, { muted }) => (
                                    <button {...props} className="text-white hover:scale-110 transition-transform">
                                        {muted ? <VolumeX size={24} /> : <Volume2 size={24} />}
                                    </button>
                                )}
                            />
                            <VolumeSlider.Root className="w-0 group-hover/volume:w-20 data-[interactive]:w-20 overflow-hidden transition-all duration-300 h-1.5 bg-white/20 rounded-full relative flex items-center">
                                <VolumeSlider.Track className="w-full h-full bg-white/20 rounded-full absolute" />
                                <VolumeSlider.Fill className="h-full bg-palette-primary rounded-full absolute" style={{ width: 'var(--media-slider-fill)' }} />
                                <VolumeSlider.Thumb className="w-3 h-3 bg-white rounded-full absolute shadow-md" style={{ left: 'var(--media-slider-fill)', transform: 'translateX(-50%)' }} />
                            </VolumeSlider.Root>
                        </div>

                        <SubtitleSelector 
                            subtitles={subtitles}
                            selectedSubtitle={selectedSubtitle}
                            onSubtitleChange={handleSubtitleChange}
                        />

                        <AudioTrackSelector 
                            audio_tracks={audio_tracks}
                            selectedAudio={selectedAudio}
                            onAudioChange={setSelectedAudio}
                        />

                        <PlaybackRateButton render={(props, { rate }) => (
                            <button {...props} className="text-white text-xs font-bold hover:bg-white/10 px-2 py-1 rounded transition-colors">
                                {rate}x
                            </button>
                        )} />

                        <PiPButton render={(props) => (
                            <button {...props} className="text-white hover:scale-110 transition-transform">
                                <MonitorPlay size={24} />
                            </button>
                        )} />

                        <FullscreenButton render={(props) => (
                            <button {...props} className="text-white hover:scale-110 transition-transform">
                                <Maximize size={24} />
                            </button>
                        )} />
                    </div>
                </div>
            </Controls.Root>
        </Player.Container>
    );
};

export const PromotionalVideo: React.FC<VideoProps> = ({
    url,
    subtitles = [],
    audio_tracks = [],
    title,
    description,
    autoplay = false
}) => {
    const [selectedSubtitle, setSelectedSubtitle] = useState<string>(
        subtitles.find(s => s.default)?.srcLang || 'none'
    );
    const [selectedAudio, setSelectedAudio] = useState<string>(
        audio_tracks.length > 0 ? audio_tracks[0].lang : 'default'
    );

    return (
        <section className="py-12 px-4 md:px-8 palette-background">
            <div className="max-w-6xl mx-auto">
                {title && (
                    <h2 className="text-h2 mb-4 text-center">
                        {title}
                    </h2>
                )}
                {description && (
                    <p className="text-paragraph mb-8 text-center opacity-80">
                        {description}
                    </p>
                )}
                
                <Player.Provider>
                    <div className="relative group aspect-video bg-black rounded-xl overflow-hidden shadow-2xl palette-border border">
                        <PlayerUI 
                            url={url}
                            subtitles={subtitles}
                            audio_tracks={audio_tracks}
                            autoplay={autoplay}
                            selectedSubtitle={selectedSubtitle}
                            setSelectedSubtitle={setSelectedSubtitle}
                            selectedAudio={selectedAudio}
                            setSelectedAudio={setSelectedAudio}
                        />
                    </div>
                </Player.Provider>
            </div>
        </section>
    );
};
