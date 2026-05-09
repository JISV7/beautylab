import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Subtitles } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

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
    audioTracks?: AudioTrack[];
    title?: string;
    description?: string;
    autoplay?: boolean;
}

export const PromotionalVideo: React.FC<VideoProps> = ({
    url,
    subtitles = [],
    audioTracks = [],
    title,
    description,
    autoplay = false
}) => {
    const { activeTheme, currentMode } = useTheme();
    const videoRef = useRef<HTMLVideoElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);
    
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [showControls, setShowControls] = useState(true);
    
    const [selectedSubtitle, setSelectedSubtitle] = useState<string>(
        subtitles.find(s => s.default)?.srcLang || 'none'
    );
    
    // 'default' means we use the video's embedded audio.
    const [selectedAudio, setSelectedAudio] = useState<string>('default');
    
    const controlsTimeoutRef = useRef<any>(null);

    const colors = activeTheme?.config[currentMode]?.colors as any || {};
    const primaryColor = colors.primary || '#000';
    const backgroundColor = colors.background || '#fff';
    const textColor = colors.text || '#000';

    const isUsingSeparateAudio = selectedAudio !== 'default';
    const currentAudioTrack = audioTracks.find(a => a.lang === selectedAudio);

    useEffect(() => {
        const video = videoRef.current;
        const audio = audioRef.current;
        if (!video) return;

        const handleTimeUpdate = () => {
            setProgress((video.currentTime / video.duration) * 100);
            
            // Sync audio with video if needed
            if (isUsingSeparateAudio && audio) {
                if (Math.abs(audio.currentTime - video.currentTime) > 0.3) {
                    audio.currentTime = video.currentTime;
                }
            }
        };

        const handleEnded = () => {
            setIsPlaying(false);
        };

        const handlePlay = () => {
            setIsPlaying(true);
            if (isUsingSeparateAudio && audio) audio.play();
        };

        const handlePause = () => {
            setIsPlaying(false);
            if (audio) audio.pause();
        };

        const handleSeeking = () => {
            if (isUsingSeparateAudio && audio) {
                audio.currentTime = video.currentTime;
            }
        };

        video.addEventListener('timeupdate', handleTimeUpdate);
        video.addEventListener('ended', handleEnded);
        video.addEventListener('play', handlePlay);
        video.addEventListener('pause', handlePause);
        video.addEventListener('seeking', handleSeeking);

        return () => {
            video.removeEventListener('timeupdate', handleTimeUpdate);
            video.removeEventListener('ended', handleEnded);
            video.removeEventListener('play', handlePlay);
            video.removeEventListener('pause', handlePause);
            video.removeEventListener('seeking', handleSeeking);
        };
    }, [isUsingSeparateAudio]);

    // Handle Volume & Mute across both elements
    useEffect(() => {
        if (videoRef.current) {
            // If using separate audio, video itself is always muted
            videoRef.current.muted = isMuted || isUsingSeparateAudio;
            videoRef.current.volume = volume;
        }
        if (audioRef.current) {
            audioRef.current.muted = isMuted;
            audioRef.current.volume = volume;
        }
    }, [volume, isMuted, isUsingSeparateAudio]);

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
        }
    };

    const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newProgress = parseFloat(e.target.value);
        if (videoRef.current) {
            const newTime = (newProgress / 100) * videoRef.current.duration;
            videoRef.current.currentTime = newTime;
            if (audioRef.current) audioRef.current.currentTime = newTime;
            setProgress(newProgress);
        }
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
        setIsMuted(newVolume === 0);
    };

    const toggleMute = () => {
        setIsMuted(!isMuted);
    };

    const toggleFullscreen = () => {
        if (videoRef.current) {
            if (document.fullscreenElement) {
                document.exitFullscreen();
            } else {
                videoRef.current.parentElement?.requestFullscreen();
            }
        }
    };

    const handleSubtitleChange = (lang: string) => {
        setSelectedSubtitle(lang);
        if (videoRef.current) {
            const tracks = videoRef.current.textTracks;
            for (let i = 0; i < tracks.length; i++) {
                tracks[i].mode = tracks[i].language === lang ? 'showing' : 'hidden';
            }
        }
    };

    const handleAudioChange = (lang: string) => {
        const wasPlaying = isPlaying;
        setSelectedAudio(lang);
        
        // Reset and play new track if it was playing
        setTimeout(() => {
            if (videoRef.current && audioRef.current) {
                audioRef.current.currentTime = videoRef.current.currentTime;
                if (wasPlaying) audioRef.current.play();
            }
        }, 100);
    };

    const handleMouseMove = () => {
        setShowControls(true);
        if (controlsTimeoutRef.current) {
            clearTimeout(controlsTimeoutRef.current);
        }
        controlsTimeoutRef.current = setTimeout(() => {
            if (isPlaying) setShowControls(false);
        }, 3000);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        switch (e.key) {
            case ' ':
            case 'Enter':
                e.preventDefault();
                togglePlay();
                break;
            case 'ArrowUp':
                e.preventDefault();
                setVolume(prev => Math.min(prev + 0.1, 1));
                break;
            case 'ArrowDown':
                e.preventDefault();
                setVolume(prev => Math.max(prev - 0.1, 0));
                break;
            case 'ArrowLeft':
                if (videoRef.current) videoRef.current.currentTime -= 5;
                break;
            case 'ArrowRight':
                if (videoRef.current) videoRef.current.currentTime += 5;
                break;
            case 'f':
            case 'F':
                toggleFullscreen();
                break;
            case 'm':
            case 'M':
                toggleMute();
                break;
        }
    };

    return (
        <section className="py-12 px-4 md:px-8" style={{ backgroundColor }}>
            <div className="max-w-6xl mx-auto">
                {title && (
                    <h2 
                        className="text-3xl font-bold mb-4 text-center"
                        style={{ color: textColor }}
                    >
                        {title}
                    </h2>
                )}
                {description && (
                    <p 
                        className="text-lg mb-8 text-center opacity-80"
                        style={{ color: textColor }}
                    >
                        {description}
                    </p>
                )}
                
                <div 
                    className="relative group aspect-video bg-black rounded-xl overflow-hidden shadow-2xl"
                    onMouseMove={handleMouseMove}
                    onMouseLeave={() => isPlaying && setShowControls(false)}
                    tabIndex={0}
                    onKeyDown={handleKeyDown}
                    aria-label="Video Player"
                >
                    <video
                        ref={videoRef}
                        className="w-full h-full"
                        src={url}
                        autoPlay={autoplay}
                        onClick={togglePlay}
                        playsInline
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

                    {/* Separate Audio Track Element */}
                    {isUsingSeparateAudio && currentAudioTrack && (
                        <audio 
                            ref={audioRef}
                            src={currentAudioTrack.src}
                            preload="auto"
                        />
                    )}

                    {/* Custom Controls */}
                    <div 
                        className={`absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 to-transparent transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}
                    >
                        {/* Progress Bar */}
                        <div className="px-4 py-2">
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={progress}
                                onChange={handleProgressChange}
                                className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-primary"
                                style={{ accentColor: primaryColor }}
                                aria-label="Seek bar"
                            />
                        </div>

                        {/* Control Buttons */}
                        <div className="flex items-center justify-between px-4 pb-4">
                            <div className="flex items-center gap-4">
                                <button 
                                    onClick={togglePlay}
                                    className="text-white hover:scale-110 transition-transform"
                                    aria-label={isPlaying ? "Pause" : "Play"}
                                >
                                    {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                                </button>

                                <div className="flex items-center gap-2 group/volume">
                                    <button 
                                        onClick={toggleMute}
                                        className="text-white"
                                        aria-label={isMuted ? "Unmute" : "Mute"}
                                    >
                                        {isMuted || volume === 0 ? <VolumeX size={24} /> : <Volume2 size={24} />}
                                    </button>
                                    <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.1"
                                        value={isMuted ? 0 : volume}
                                        onChange={handleVolumeChange}
                                        className="w-0 group-hover/volume:w-20 transition-all h-1 bg-white/30 rounded-lg appearance-none cursor-pointer"
                                        style={{ accentColor: primaryColor }}
                                        aria-label="Volume bar"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                {/* Subtitle Selector */}
                                {subtitles.length > 0 && (
                                    <div className="relative group/sub">
                                        <button className="text-white" aria-label="Subtitles">
                                            <Subtitles size={24} />
                                        </button>
                                        <div className="absolute bottom-full right-0 mb-2 bg-black/90 rounded-lg p-2 min-w-[120px] hidden group-hover/sub:block border border-white/10">
                                            <button 
                                                onClick={() => handleSubtitleChange('none')}
                                                className={`w-full text-left px-3 py-1 text-sm rounded ${selectedSubtitle === 'none' ? 'bg-primary text-white' : 'text-gray-300 hover:bg-white/10'}`}
                                                style={selectedSubtitle === 'none' ? { backgroundColor: primaryColor } : {}}
                                            >
                                                Off
                                            </button>
                                            {subtitles.map((sub, idx) => (
                                                <button 
                                                    key={idx}
                                                    onClick={() => handleSubtitleChange(sub.srcLang)}
                                                    className={`w-full text-left px-3 py-1 text-sm rounded ${selectedSubtitle === sub.srcLang ? 'bg-primary text-white' : 'text-gray-300 hover:bg-white/10'}`}
                                                    style={selectedSubtitle === sub.srcLang ? { backgroundColor: primaryColor } : {}}
                                                >
                                                    {sub.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Audio Track Selector */}
                                {audioTracks.length > 0 && (
                                    <div className="relative group/audio">
                                        <button className="text-white" aria-label="Audio Tracks">
                                            <Volume2 size={24} />
                                        </button>
                                        <div className="absolute bottom-full right-0 mb-2 bg-black/90 rounded-lg p-2 min-w-[120px] hidden group-hover/audio:block border border-white/10">
                                            <button 
                                                onClick={() => handleAudioChange('default')}
                                                className={`w-full text-left px-3 py-1 text-sm rounded ${selectedAudio === 'default' ? 'bg-primary text-white' : 'text-gray-300 hover:bg-white/10'}`}
                                                style={selectedAudio === 'default' ? { backgroundColor: primaryColor } : {}}
                                            >
                                                Original
                                            </button>
                                            {audioTracks.map((track, idx) => (
                                                <button 
                                                    key={idx}
                                                    onClick={() => handleAudioChange(track.lang)}
                                                    className={`w-full text-left px-3 py-1 text-sm rounded ${selectedAudio === track.lang ? 'bg-primary text-white' : 'text-gray-300 hover:bg-white/10'}`}
                                                    style={selectedAudio === track.lang ? { backgroundColor: primaryColor } : {}}
                                                >
                                                    {track.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <button 
                                    onClick={toggleFullscreen}
                                    className="text-white"
                                    aria-label="Fullscreen"
                                >
                                    <Maximize size={24} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
