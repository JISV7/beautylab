import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Subtitles } from 'lucide-react';
import { 
    createPlayer, 
    PlayButton,
    MuteButton,
    VolumeSlider,
    TimeSlider,
    FullscreenButton,
    Controls,
    useMediaAttach
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
    const media = Player.useMedia() as unknown as HTMLVideoElement | null;
    
    // Subscribe to playback and time state using Player.usePlayer selector
    const isPlaying = Player.usePlayer(state => !state.paused);
    const currentTime = Player.usePlayer(state => state.currentTime as number);
    const volume = Player.usePlayer(state => state.volume as number);
    const isMuted = Player.usePlayer(state => state.muted as boolean);
    
    const isUsingSeparateAudio = selectedAudio !== 'default';
    const currentAudioTrack = audio_tracks.find(a => a.lang === selectedAudio);

    useEffect(() => {
        const audio = audioRef.current;
        const video = media;
        if (!audio || !video || !isUsingSeparateAudio) return;

        if (isPlaying) {
            audio.play().catch(e => console.error("Audio play failed:", e));
        } else {
            audio.pause();
        }
    }, [isPlaying, isUsingSeparateAudio, media]);

    useEffect(() => {
        const audio = audioRef.current;
        const video = media;
        if (!audio || !video || !isUsingSeparateAudio) return;

        if (Math.abs(audio.currentTime - currentTime) > 0.3) {
            audio.currentTime = currentTime;
        }
    }, [currentTime, isUsingSeparateAudio, media]);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
            audioRef.current.muted = isMuted;
        }
        if (media && isUsingSeparateAudio) {
            media.muted = true; // Mute video if using separate audio
        }
    }, [volume, isMuted, isUsingSeparateAudio, media]);

    if (!isUsingSeparateAudio || !currentAudioTrack) return null;

    return <audio ref={audioRef} src={currentAudioTrack.src} preload="auto" />;
};

const SubtitleSelector: React.FC<{
    subtitles: Subtitle[];
    selectedSubtitle: string;
    onSubtitleChange: (lang: string) => void;
}> = ({ subtitles, selectedSubtitle, onSubtitleChange }) => {
    const media = Player.useMedia() as unknown as HTMLVideoElement | null;

    const handleSubtitleChange = (lang: string) => {
        onSubtitleChange(lang);
        if (media) {
            const tracks = media.textTracks;
            for (let i = 0; i < tracks.length; i++) {
                tracks[i].mode = tracks[i].language === lang ? 'showing' : 'hidden';
            }
        }
    };

    return (
        <div className="relative group/sub">
            <button className="text-white" aria-label="Subtitles">
                <Subtitles size={24} />
            </button>
            <div className="absolute bottom-full right-0 mb-2 bg-black/90 rounded-lg p-2 min-w-[120px] hidden group-hover/sub:block border border-white/10">
                <button 
                    onClick={() => handleSubtitleChange('none')}
                    className={`w-full text-left px-3 py-1 text-sm rounded transition-colors ${selectedSubtitle === 'none' ? 'palette-primary text-white' : 'text-gray-300 pointer-events-auto hover:bg-white/10'}`}
                >
                    Off
                </button>
                {subtitles.map((sub, idx) => (
                    <button 
                        key={idx}
                        onClick={() => handleSubtitleChange(sub.srcLang)}
                        className={`w-full text-left px-3 py-1 text-sm rounded transition-colors ${selectedSubtitle === sub.srcLang ? 'palette-primary text-white' : 'text-gray-300 pointer-events-auto hover:bg-white/10'}`}
                    >
                        {sub.label}
                    </button>
                ))}
            </div>
        </div>
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
    const volume = Player.usePlayer(state => state.volume as number);
    const setMedia = useMediaAttach();
    const containerRef = useRef<HTMLDivElement>(null);

    return (
        <Player.Container 
            ref={containerRef} 
            className="relative w-full h-full outline-none"
            tabIndex={0}
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

            <AudioTrackSync 
                selectedAudio={selectedAudio} 
                audio_tracks={audio_tracks}
            />

            {/* Big Play Button Overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <PlayButton 
                    render={(props, { paused }) => (
                        <button 
                            {...props} 
                            className={`p-6 rounded-full bg-palette-primary/80 text-white transition-all duration-300 hover:scale-110 pointer-events-auto ${!paused ? 'opacity-0 scale-50 invisible' : 'opacity-100 scale-100 visible'}`}
                            aria-label={paused ? "Play" : "Pause"}
                        >
                            <Play size={48} fill="currentColor" />
                        </button>
                    )}
                />
            </div>

            <Controls.Root className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-transparent to-transparent transition-all duration-300 opacity-0 invisible pointer-events-none group-hover:opacity-100 group-hover:visible group-hover:pointer-events-auto data-[active=true]:opacity-100 data-[active=true]:visible data-[active=true]:pointer-events-auto">
                <div className="px-4 py-2">
                    <TimeSlider.Root className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-palette-primary relative flex items-center">
                        <TimeSlider.Track className="w-full h-1 bg-white/30 rounded-lg absolute" />
                        <TimeSlider.Fill className="h-1 bg-palette-primary rounded-lg absolute" />
                        <TimeSlider.Thumb className="w-3 h-3 bg-white rounded-full absolute shadow-lg" />
                    </TimeSlider.Root>
                </div>

                <div className="flex items-center justify-between px-4 pb-4">
                    <div className="flex items-center gap-4">
                        <PlayButton 
                            render={(props, { paused }) => (
                                <button {...props} className="text-white hover:scale-110 transition-transform">
                                    {!paused ? <Pause size={24} /> : <Play size={24} />}
                                </button>
                            )}
                        />

                        <div className="flex items-center gap-2 group/volume">
                            <MuteButton 
                                render={(props, { muted }) => (
                                    <button {...props} className="text-white">
                                        {(muted || volume === 0) ? <VolumeX size={24} /> : <Volume2 size={24} />}
                                    </button>
                                )}
                            />
                            <VolumeSlider.Root className="w-0 group-hover/volume:w-20 transition-all h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-palette-primary relative flex items-center">
                                <VolumeSlider.Track className="w-full h-1 bg-white/30 rounded-lg absolute" />
                                <VolumeSlider.Fill className="h-1 bg-palette-primary rounded-lg absolute" />
                                <VolumeSlider.Thumb className="w-3 h-3 bg-white rounded-full absolute shadow-lg" />
                            </VolumeSlider.Root>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {subtitles.length > 0 && (
                            <SubtitleSelector 
                                subtitles={subtitles} 
                                selectedSubtitle={selectedSubtitle}
                                onSubtitleChange={setSelectedSubtitle}
                            />
                        )}

                        {audio_tracks.length > 0 && (
                            <div className="relative group/audio">
                                <button className="text-white" aria-label="Audio Tracks">
                                    <Volume2 size={24} />
                                </button>
                                <div className="absolute bottom-full right-0 mb-2 bg-black/90 rounded-lg p-2 min-w-[120px] hidden group-hover/audio:block border border-white/10">
                                    <button 
                                        onClick={() => setSelectedAudio('default')}
                                        className={`w-full text-left px-3 py-1 text-sm rounded transition-colors ${selectedAudio === 'default' ? 'palette-primary text-white' : 'text-gray-300 pointer-events-auto hover:bg-white/10'}`}
                                    >
                                        Original
                                    </button>
                                    {audio_tracks.map((track, idx) => (
                                        <button 
                                            key={idx}
                                            onClick={() => setSelectedAudio(track.lang)}
                                            className={`w-full text-left px-3 py-1 text-sm rounded transition-colors ${selectedAudio === track.lang ? 'palette-primary text-white' : 'text-gray-300 pointer-events-auto hover:bg-white/10'}`}
                                        >
                                            {track.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <FullscreenButton className="text-white">
                            <Maximize size={24} />
                        </FullscreenButton>
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
    const [selectedAudio, setSelectedAudio] = useState<string>('default');

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
