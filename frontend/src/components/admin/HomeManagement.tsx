import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Video, 
    Layout, 
    Plus, 
    Trash2, 
    Save, 
    Upload, 
    Eye, 
    EyeOff, 
    ChevronUp, 
    ChevronDown,
    Image as ImageIcon,
    FileVideo
} from 'lucide-react';
import { ImageCropper } from '../common/ImageCropper';
import { MessageModal } from './MessageModal';
import { ConfirmModal } from './ConfirmModal';

const API_URL = 'http://localhost:8000';

// Get auth token from localStorage
const getAuthToken = (): string | null => {
    return localStorage.getItem('access_token');
};

// Axios instance with auth
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add request interceptor for auth token
api.interceptors.request.use((config) => {
    const token = getAuthToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

interface Subtitle {
    label: string;
    src: string;
    srcLang: string;
    default: boolean;
}

interface AudioTrack {
    label: string;
    src: string;
    lang: string;
    default: boolean;
}

interface VideoConfig {
    enabled: boolean;
    url: string;
    title: string;
    description: string;
    autoplay: boolean;
    subtitles: Subtitle[];
    audio_tracks: AudioTrack[];
}

interface Slide {
    id: string;
    image_url: string;
    title: string;
    description: string;
    link_url: string;
    order: number;
    is_active: boolean;
}

interface HomeConfig {
    video: VideoConfig;
    carousel: {
        max_width: number;
        max_height: number;
        aspect_ratio: string;
        slides: Slide[];
    };
}

export function HomeManagement() {
    const [config, setConfig] = useState<HomeConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'video' | 'carousel'>('video');
    
    // Notification and Confirmation Modals
    const [messageModal, setMessageModal] = useState<{
        isOpen: boolean;
        type: 'success' | 'error';
        message: string;
    }>({
        isOpen: false,
        type: 'success',
        message: '',
    });

    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {},
    });

    // Cropper state
    const [cropperOpen, setCropperOpen] = useState(false);
    const [currentImageToCrop, setCurrentImageToCrop] = useState<string | null>(null);
    const [pendingSlideId, setPendingSlideId] = useState<string | null>(null);

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const response = await api.get('/home-config');
            if (response.data && response.data.config) {
                setConfig(response.data.config);
            } else {
                throw new Error('Invalid response structure from server');
            }
        } catch (error: any) {
            console.error('Error fetching home config:', error);
            setError(error.message || 'Failed to fetch configuration');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!config) return;
        setSaving(true);
        try {
            await api.put('/home-config', { config });
            setMessageModal({
                isOpen: true,
                type: 'success',
                message: 'Settings saved successfully!',
            });
        } catch (error) {
            console.error('Error saving home config:', error);
            setMessageModal({
                isOpen: true,
                type: 'error',
                message: 'Error saving settings',
            });
        } finally {
            setSaving(false);
        }
    };

    const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !config) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await api.post('/home-config/upload/video', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setConfig({
                ...config,
                video: { ...config.video, url: response.data.url }
            });
        } catch (error) {
            console.error('Error uploading video:', error);
        }
    };

    const handleSubtitleUpload = async (e: React.ChangeEvent<HTMLInputElement>, label: string, lang: string) => {
        const file = e.target.files?.[0];
        if (!file || !config) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await api.post('/home-config/upload/subtitle', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const newSubtitle: Subtitle = {
                label,
                src: response.data.url,
                srcLang: lang,
                default: config.video.subtitles.length === 0
            };
            setConfig({
                ...config,
                video: {
                    ...config.video,
                    subtitles: [...config.video.subtitles, newSubtitle]
                }
            });
        } catch (error) {
            console.error('Error uploading subtitle:', error);
        }
    };

    const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>, label: string, lang: string) => {
        const file = e.target.files?.[0];
        if (!file || !config) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await api.post('/home-config/upload/audio', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const newAudio: AudioTrack = {
                label,
                src: response.data.url,
                lang: lang,
                default: (config.video.audio_tracks || []).length === 0
            };
            setConfig({
                ...config,
                video: {
                    ...config.video,
                    audio_tracks: [...(config.video.audio_tracks || []), newAudio]
                }
            });
        } catch (error) {
            console.error('Error uploading audio track:', error);
        }
    };

    const handleSlideImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, slideId: string) => {
        const file = e.target.files?.[0];
        if (!file || !config) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                if (img.width > config.carousel.max_width || img.height > config.carousel.max_height) {
                    setConfirmModal({
                        isOpen: true,
                        title: 'Image Size Warning',
                        message: `Image exceeds max size (${config.carousel.max_width}x${config.carousel.max_height}). Do you want to crop it?`,
                        onConfirm: () => {
                            setCurrentImageToCrop(event.target?.result as string);
                            setPendingSlideId(slideId);
                            setCropperOpen(true);
                        }
                    });
                } else {
                    uploadImage(file, slideId);
                }
            };
            img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
    };

    const uploadImage = async (blob: Blob | File, slideId: string) => {
        if (!config) return;
        const formData = new FormData();
        formData.append('file', blob);

        try {
            const response = await api.post('/home-config/upload/carousel', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const updatedSlides = config.carousel.slides.map(s => 
                s.id === slideId ? { ...s, image_url: response.data.url } : s
            );
            setConfig({
                ...config,
                carousel: { ...config.carousel, slides: updatedSlides }
            });
            setCropperOpen(false);
        } catch (error) {
            console.error('Error uploading carousel image:', error);
        }
    };

    const addNewSlide = () => {
        if (!config) return;
        const newSlide: Slide = {
            id: crypto.randomUUID(),
            image_url: '',
            title: 'New Slide',
            description: '',
            link_url: '',
            order: config.carousel.slides.length,
            is_active: true
        };
        setConfig({
            ...config,
            carousel: {
                ...config.carousel,
                slides: [...config.carousel.slides, newSlide]
            }
        });
    };

    const removeSlide = (id: string) => {
        if (!config) return;
        setConfig({
            ...config,
            carousel: {
                ...config.carousel,
                slides: config.carousel.slides.filter(s => s.id !== id)
            }
        });
    };

    const moveSlide = (index: number, direction: 'up' | 'down') => {
        if (!config) return;
        const newSlides = [...config.carousel.slides];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= newSlides.length) return;
        
        [newSlides[index], newSlides[targetIndex]] = [newSlides[targetIndex], newSlides[index]];
        
        setConfig({
            ...config,
            carousel: {
                ...config.carousel,
                slides: newSlides.map((s, i) => ({ ...s, order: i }))
            }
        });
    };

    if (loading) return <div className="flex h-64 items-center justify-center text-paragraph">Loading...</div>;
    if (error || !config) return (
        <div className="p-8 text-center theme-card">
            <h2 className="text-h2 text-red-500 mb-4">Error loading configuration</h2>
            <p className="text-paragraph mb-4">{error || 'Configuration data is missing'}</p>
            <button 
                onClick={() => { setError(null); setLoading(true); fetchConfig(); }}
                className="theme-button theme-button-primary"
            >
                Retry
            </button>
        </div>
    );

    return (
        <div className="w-full">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-h1 mb-2">Home Management</h1>
                    <p className="text-paragraph opacity-70">Manage your promotional video and carousel slides.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="theme-button theme-button-primary"
                >
                    <Save size={20} />
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-8 border-b palette-border">
                <button
                    onClick={() => setActiveTab('video')}
                    className={`flex items-center gap-2 px-6 py-3 font-semibold transition-colors border-b-2 ${activeTab === 'video' ? 'border-palette-primary text-palette-primary' : 'border-transparent text-paragraph opacity-60'}`}
                >
                    <Video size={20} />
                    Promotional Video
                </button>
                <button
                    onClick={() => setActiveTab('carousel')}
                    className={`flex items-center gap-2 px-6 py-3 font-semibold transition-colors border-b-2 ${activeTab === 'carousel' ? 'border-palette-primary text-palette-primary' : 'border-transparent text-paragraph opacity-60'}`}
                >
                    <Layout size={20} />
                    Carousel Slides
                </button>
            </div>

            {/* Video Tab */}
            {activeTab === 'video' && (
                <div className="space-y-8">
                    <div className="theme-card">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-h3">Video Settings</h3>
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center gap-3">
                                    <span className="text-paragraph font-medium min-w-[80px]">{config.video.enabled ? 'Enabled' : 'Disabled'}</span>
                                    <button
                                        onClick={() => setConfig({
                                            ...config,
                                            video: { ...config.video, enabled: !config.video.enabled }
                                        })}
                                        className={`w-14 h-8 rounded-full transition-colors relative ${config.video.enabled ? 'bg-palette-primary' : 'bg-slate-300 dark:bg-slate-700'}`}
                                    >
                                        <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${config.video.enabled ? 'translate-x-6' : 'translate-x-0'}`} />
                                    </button>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-paragraph font-medium min-w-[80px]">Autoplay</span>
                                    <button
                                        onClick={() => setConfig({
                                            ...config,
                                            video: { ...config.video, autoplay: !config.video.autoplay }
                                        })}
                                        className={`w-14 h-8 rounded-full transition-colors relative ${config.video.autoplay ? 'bg-palette-primary' : 'bg-slate-300 dark:bg-slate-700'}`}
                                    >
                                        <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${config.video.autoplay ? 'translate-x-6' : 'translate-x-0'}`} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-paragraph block mb-1.5 opacity-60">Video Title</label>
                                    <input
                                        type="text"
                                        value={config.video.title}
                                        onChange={(e) => setConfig({ ...config, video: { ...config.video, title: e.target.value } })}
                                        className="w-full theme-input"
                                    />
                                </div>
                                <div>
                                    <label className="text-paragraph block mb-1.5 opacity-60">Description</label>
                                    <textarea
                                        value={config.video.description}
                                        onChange={(e) => setConfig({ ...config, video: { ...config.video, description: e.target.value } })}
                                        className="w-full theme-input h-24 resize-none"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-paragraph block mb-1.5 opacity-60">Video File</label>
                                <div className="relative border-2 border-dashed palette-border rounded-2xl p-8 flex flex-col items-center justify-center gap-2 hover:bg-palette-surface transition-colors cursor-pointer overflow-hidden">
                                    {config.video.url ? (
                                        <div className="text-center w-full">
                                            <FileVideo size={48} className="mx-auto mb-2 opacity-50 text-palette-primary" />
                                            <p className="text-paragraph text-xs truncate max-w-full px-4">{config.video.url}</p>
                                        </div>
                                    ) : (
                                        <Upload size={48} className="opacity-50" />
                                    )}
                                    <input
                                        type="file"
                                        accept="video/*"
                                        onChange={handleVideoUpload}
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                    />
                                    <p className="text-paragraph text-xs opacity-60">Click or drag video to upload</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Subtitles Section */}
                    <div className="theme-card">
                        <h3 className="text-h3 mb-6">Subtitles</h3>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {config.video.subtitles.map((sub, idx) => (
                                <div key={idx} className="p-4 rounded-xl border palette-border flex justify-between items-center palette-surface">
                                    <div>
                                        <p className="text-paragraph font-semibold">{sub.label}</p>
                                        <p className="text-xs opacity-60">{sub.srcLang}</p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            const newSubs = config.video.subtitles.filter((_, i) => i !== idx);
                                            setConfig({ ...config, video: { ...config.video, subtitles: newSubs } });
                                        }}
                                        className="delete-action p-2 rounded-lg"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                            <div className="p-4 rounded-xl border-2 border-dashed palette-border flex flex-col gap-2">
                                <input 
                                    type="text" 
                                    placeholder="Label (e.g. Spanish)" 
                                    className="theme-input text-sm py-1.5"
                                    id="sub-label"
                                />
                                <input 
                                    type="text" 
                                    placeholder="Lang (e.g. es)" 
                                    className="theme-input text-sm py-1.5"
                                    id="sub-lang"
                                />
                                <div className="relative">
                                    <button className="theme-button theme-button-secondary w-full py-1.5 text-sm">
                                        Upload .vtt
                                    </button>
                                    <input
                                        type="file"
                                        accept=".vtt,.srt"
                                        onChange={(e) => {
                                            const label = (document.getElementById('sub-label') as HTMLInputElement).value;
                                            const lang = (document.getElementById('sub-lang') as HTMLInputElement).value;
                                            if (!label || !lang) {
                                                setMessageModal({
                                                    isOpen: true,
                                                    type: 'error',
                                                    message: 'Please provide label and lang first',
                                                });
                                                return;
                                            }
                                            handleSubtitleUpload(e, label, lang);
                                        }}
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Audio Tracks Section */}
                    <div className="theme-card">
                        <h3 className="text-h3 mb-6">Audio Tracks</h3>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {config.video.audio_tracks?.map((track, idx) => (
                                <div key={idx} className="p-4 rounded-xl border palette-border flex justify-between items-center palette-surface">
                                    <div>
                                        <p className="text-paragraph font-semibold">{track.label}</p>
                                        <p className="text-xs opacity-60">{track.lang}</p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            const newTracks = config.video.audio_tracks.filter((_, i) => i !== idx);
                                            setConfig({ ...config, video: { ...config.video, audio_tracks: newTracks } });
                                        }}
                                        className="delete-action p-2 rounded-lg"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                            <div className="p-4 rounded-xl border-2 border-dashed palette-border flex flex-col gap-2">
                                <input 
                                    type="text" 
                                    placeholder="Label (e.g. French)" 
                                    className="theme-input text-sm py-1.5"
                                    id="audio-label"
                                />
                                <input 
                                    type="text" 
                                    placeholder="Lang (e.g. fr)" 
                                    className="theme-input text-sm py-1.5"
                                    id="audio-lang"
                                />
                                <div className="relative">
                                    <button className="theme-button theme-button-secondary w-full py-1.5 text-sm">
                                        Upload Audio
                                    </button>
                                    <input
                                        type="file"
                                        accept="audio/*"
                                        onChange={(e) => {
                                            const label = (document.getElementById('audio-label') as HTMLInputElement).value;
                                            const lang = (document.getElementById('audio-lang') as HTMLInputElement).value;
                                            if (!label || !lang) {
                                                setMessageModal({
                                                    isOpen: true,
                                                    type: 'error',
                                                    message: 'Please provide label and lang first',
                                                });
                                                return;
                                            }
                                            handleAudioUpload(e, label, lang);
                                        }}
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Carousel Tab */}
            {activeTab === 'carousel' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-h3">Slides</h3>
                        <button
                            onClick={addNewSlide}
                            className="theme-button theme-button-primary"
                        >
                            <Plus size={20} />
                            Add Slide
                        </button>
                    </div>

                    <div className="grid gap-6">
                        {config.carousel.slides.map((slide, index) => (
                            <div 
                                key={slide.id} 
                                className="theme-card flex flex-col lg:flex-row gap-6 items-start"
                            >
                                <div className="w-full lg:w-72 h-40 relative rounded-xl overflow-hidden group palette-background border palette-border">
                                    {slide.image_url ? (
                                        <img src={slide.image_url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <ImageIcon size={48} className="opacity-20" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Upload className="text-white" />
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleSlideImageUpload(e, slide.id)}
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                        />
                                    </div>
                                </div>

                                <div className="flex-1 grid md:grid-cols-2 gap-4 w-full">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-paragraph text-xs font-medium mb-1 opacity-60 block">Title</label>
                                            <input
                                                type="text"
                                                value={slide.title}
                                                onChange={(e) => {
                                                    const updated = config.carousel.slides.map(s => s.id === slide.id ? { ...s, title: e.target.value } : s);
                                                    setConfig({ ...config, carousel: { ...config.carousel, slides: updated } });
                                                }}
                                                className="w-full theme-input py-1.5"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-paragraph text-xs font-medium mb-1 opacity-60 block">Description</label>
                                            <input
                                                type="text"
                                                value={slide.description}
                                                onChange={(e) => {
                                                    const updated = config.carousel.slides.map(s => s.id === slide.id ? { ...s, description: e.target.value } : s);
                                                    setConfig({ ...config, carousel: { ...config.carousel, slides: updated } });
                                                }}
                                                className="w-full theme-input py-1.5"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-paragraph text-xs font-medium mb-1 opacity-60 block">Link URL</label>
                                            <input
                                                type="text"
                                                value={slide.link_url}
                                                onChange={(e) => {
                                                    const updated = config.carousel.slides.map(s => s.id === slide.id ? { ...s, link_url: e.target.value } : s);
                                                    setConfig({ ...config, carousel: { ...config.carousel, slides: updated } });
                                                }}
                                                className="w-full theme-input py-1.5"
                                            />
                                        </div>
                                        <div className="flex items-center justify-between pt-2">
                                            <button
                                                onClick={() => {
                                                    const updated = config.carousel.slides.map(s => s.id === slide.id ? { ...s, is_active: !s.is_active } : s);
                                                    setConfig({ ...config, carousel: { ...config.carousel, slides: updated } });
                                                }}
                                                className={`flex items-center gap-2 text-sm font-semibold transition-colors ${slide.is_active ? 'text-green-500' : 'text-paragraph opacity-50'}`}
                                            >
                                                {slide.is_active ? <Eye size={18} /> : <EyeOff size={18} />}
                                                {slide.is_active ? 'Visible' : 'Hidden'}
                                            </button>
                                            
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => moveSlide(index, 'up')} className="p-2 hover:bg-palette-surface rounded-lg border palette-border transition-colors"><ChevronUp size={20} className="text-paragraph" /></button>
                                                <button onClick={() => moveSlide(index, 'down')} className="p-2 hover:bg-palette-surface rounded-lg border palette-border transition-colors"><ChevronDown size={20} className="text-paragraph" /></button>
                                                <button onClick={() => removeSlide(slide.id)} className="p-2 delete-action rounded-lg ml-2 transition-colors"><Trash2 size={20} /></button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Cropper Modal */}
            {cropperOpen && currentImageToCrop && (
                <ImageCropper
                    image={currentImageToCrop}
                    aspectRatio={16/9}
                    onCropComplete={(blob) => {
                        if (pendingSlideId) uploadImage(blob, pendingSlideId);
                    }}
                    onCancel={() => {
                        setCropperOpen(false);
                        setCurrentImageToCrop(null);
                        setPendingSlideId(null);
                    }}
                />
            )}

            {/* Notification Modals */}
            <MessageModal
                isOpen={messageModal.isOpen}
                type={messageModal.type}
                message={messageModal.message}
                onClose={() => setMessageModal(prev => ({ ...prev, isOpen: false }))}
            />

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                type="primary"
            />
        </div>
    );
}
