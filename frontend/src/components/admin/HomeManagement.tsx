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
import { useTheme } from '../../contexts/ThemeContext';
import { ImageCropper } from '../common/ImageCropper';

interface Subtitle {
    label: string;
    src: string;
    srcLang: string;
    default: boolean;
}

interface VideoConfig {
    enabled: boolean;
    url: string;
    title: string;
    description: string;
    autoplay: boolean;
    subtitles: Subtitle[];
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
    const { activeTheme, currentMode } = useTheme();
    const [config, setConfig] = useState<HomeConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'video' | 'carousel'>('video');
    
    // Cropper state
    const [cropperOpen, setCropperOpen] = useState(false);
    const [currentImageToCrop, setCurrentImageToCrop] = useState<string | null>(null);
    const [pendingSlideId, setPendingSlideId] = useState<string | null>(null);

    const colors = activeTheme?.config[currentMode]?.colors as any || {};
    const primaryColor = colors.primary || '#000';
    const textColor = colors.text || '#000';
    const cardColor = currentMode === 'dark' ? '#1f2937' : '#f3f4f6';

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const response = await axios.get('/api/v1/home-config');
            setConfig(response.data.config);
        } catch (error) {
            console.error('Error fetching home config:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!config) return;
        setSaving(true);
        try {
            await axios.put('/api/v1/home-config', { config });
            alert('Settings saved successfully!');
        } catch (error) {
            console.error('Error saving home config:', error);
            alert('Error saving settings');
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
            const response = await axios.post('/api/v1/home-config/upload/video', formData);
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
            const response = await axios.post('/api/v1/home-config/upload/subtitle', formData);
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

    const handleSlideImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, slideId: string) => {
        const file = e.target.files?.[0];
        if (!file || !config) return;

        // Check dimensions
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                if (img.width > config.carousel.max_width || img.height > config.carousel.max_height) {
                    if (window.confirm(`Image exceeds max size (${config.carousel.max_width}x${config.carousel.max_height}). Do you want to crop it?`)) {
                        setCurrentImageToCrop(event.target?.result as string);
                        setPendingSlideId(slideId);
                        setCropperOpen(true);
                    }
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
            const response = await axios.post('/api/v1/home-config/upload/carousel', formData);
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

    if (loading) return <div className="flex h-64 items-center justify-center">Loading...</div>;
    if (!config) return <div>Error loading configuration</div>;

    return (
        <div className="w-full">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-4xl font-bold mb-2" style={{ color: textColor }}>Home Management</h1>
                    <p style={{ color: textColor, opacity: 0.7 }}>Manage your promotional video and carousel slides.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold transition-transform hover:scale-105 disabled:opacity-50"
                    style={{ backgroundColor: primaryColor }}
                >
                    <Save size={20} />
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-8 border-b border-gray-200 dark:border-gray-700">
                <button
                    onClick={() => setActiveTab('video')}
                    className={`flex items-center gap-2 px-6 py-3 font-semibold transition-colors border-b-2 ${activeTab === 'video' ? 'border-primary' : 'border-transparent text-gray-500'}`}
                    style={activeTab === 'video' ? { borderColor: primaryColor, color: primaryColor } : {}}
                >
                    <Video size={20} />
                    Promotional Video
                </button>
                <button
                    onClick={() => setActiveTab('carousel')}
                    className={`flex items-center gap-2 px-6 py-3 font-semibold transition-colors border-b-2 ${activeTab === 'carousel' ? 'border-primary' : 'border-transparent text-gray-500'}`}
                    style={activeTab === 'carousel' ? { borderColor: primaryColor, color: primaryColor } : {}}
                >
                    <Layout size={20} />
                    Carousel Slides
                </button>
            </div>

            {/* Video Tab */}
            {activeTab === 'video' && (
                <div className="space-y-8 animate-fadeIn">
                    <div className="p-6 rounded-2xl shadow-sm" style={{ backgroundColor: cardColor }}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold" style={{ color: textColor }}>Video Settings</h3>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <span style={{ color: textColor }}>{config.video.enabled ? 'Enabled' : 'Disabled'}</span>
                                <input
                                    type="checkbox"
                                    checked={config.video.enabled}
                                    onChange={(e) => setConfig({
                                        ...config,
                                        video: { ...config.video, enabled: e.target.checked }
                                    })}
                                    className="sr-only peer"
                                />
                                <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary" style={config.video.enabled ? { backgroundColor: primaryColor } : {}}></div>
                            </label>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1" style={{ color: textColor }}>Video Title</label>
                                    <input
                                        type="text"
                                        value={config.video.title}
                                        onChange={(e) => setConfig({ ...config, video: { ...config.video, title: e.target.value } })}
                                        className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-transparent"
                                        style={{ color: textColor }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1" style={{ color: textColor }}>Description</label>
                                    <textarea
                                        value={config.video.description}
                                        onChange={(e) => setConfig({ ...config, video: { ...config.video, description: e.target.value } })}
                                        className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-transparent h-24"
                                        style={{ color: textColor }}
                                    />
                                </div>
                                <div className="flex items-center gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={config.video.autoplay}
                                            onChange={(e) => setConfig({ ...config, video: { ...config.video, autoplay: e.target.checked } })}
                                            className="w-4 h-4 rounded text-primary"
                                            style={{ accentColor: primaryColor }}
                                        />
                                        <span style={{ color: textColor }}>Autoplay</span>
                                    </label>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="block text-sm font-medium mb-1" style={{ color: textColor }}>Video File</label>
                                <div className="relative border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-8 flex flex-col items-center justify-center gap-2">
                                    {config.video.url ? (
                                        <div className="text-center">
                                            <FileVideo size={48} className="mx-auto mb-2 opacity-50" />
                                            <p className="text-sm truncate max-w-[200px] mb-4" style={{ color: textColor }}>{config.video.url}</p>
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
                                    <p style={{ color: textColor, opacity: 0.6 }}>Click or drag video to upload</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Subtitles Section */}
                    <div className="p-6 rounded-2xl shadow-sm" style={{ backgroundColor: cardColor }}>
                        <h3 className="text-xl font-bold mb-6" style={{ color: textColor }}>Subtitles</h3>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {config.video.subtitles.map((sub, idx) => (
                                <div key={idx} className="p-4 rounded-xl border border-gray-300 dark:border-gray-600 flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold" style={{ color: textColor }}>{sub.label}</p>
                                        <p className="text-xs opacity-60" style={{ color: textColor }}>{sub.srcLang}</p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            const newSubs = config.video.subtitles.filter((_, i) => i !== idx);
                                            setConfig({ ...config, video: { ...config.video, subtitles: newSubs } });
                                        }}
                                        className="text-red-500 hover:bg-red-500/10 p-2 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                            <div className="p-4 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col gap-2">
                                <input 
                                    type="text" 
                                    placeholder="Label (e.g. Spanish)" 
                                    className="text-sm p-2 bg-transparent border-b border-gray-300 dark:border-gray-600"
                                    style={{ color: textColor }}
                                    id="sub-label"
                                />
                                <input 
                                    type="text" 
                                    placeholder="Lang (e.g. es)" 
                                    className="text-sm p-2 bg-transparent border-b border-gray-300 dark:border-gray-600"
                                    style={{ color: textColor }}
                                    id="sub-lang"
                                />
                                <div className="relative">
                                    <button className="w-full py-2 bg-primary/10 text-primary rounded-lg text-sm font-semibold" style={{ color: primaryColor }}>
                                        Upload .vtt
                                    </button>
                                    <input
                                        type="file"
                                        accept=".vtt,.srt"
                                        onChange={(e) => {
                                            const label = (document.getElementById('sub-label') as HTMLInputElement).value;
                                            const lang = (document.getElementById('sub-lang') as HTMLInputElement).value;
                                            if (!label || !lang) {
                                                alert('Please provide label and lang first');
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
                </div>
            )}

            {/* Carousel Tab */}
            {activeTab === 'carousel' && (
                <div className="space-y-6 animate-fadeIn">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-bold" style={{ color: textColor }}>Slides</h3>
                        <button
                            onClick={addNewSlide}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-white font-semibold transition-transform hover:scale-105"
                            style={{ backgroundColor: primaryColor }}
                        >
                            <Plus size={20} />
                            Add Slide
                        </button>
                    </div>

                    <div className="grid gap-6">
                        {config.carousel.slides.map((slide, index) => (
                            <div 
                                key={slide.id} 
                                className="p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col lg:flex-row gap-6"
                                style={{ backgroundColor: cardColor }}
                            >
                                <div className="w-full lg:w-72 h-40 relative rounded-xl overflow-hidden group">
                                    {slide.image_url ? (
                                        <img src={slide.image_url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
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

                                <div className="flex-1 grid md:grid-cols-2 gap-4">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-medium mb-1 opacity-60" style={{ color: textColor }}>Title</label>
                                            <input
                                                type="text"
                                                value={slide.title}
                                                onChange={(e) => {
                                                    const updated = config.carousel.slides.map(s => s.id === slide.id ? { ...s, title: e.target.value } : s);
                                                    setConfig({ ...config, carousel: { ...config.carousel, slides: updated } });
                                                }}
                                                className="w-full p-2 bg-transparent border-b border-gray-300 dark:border-gray-600"
                                                style={{ color: textColor }}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium mb-1 opacity-60" style={{ color: textColor }}>Description</label>
                                            <input
                                                type="text"
                                                value={slide.description}
                                                onChange={(e) => {
                                                    const updated = config.carousel.slides.map(s => s.id === slide.id ? { ...s, description: e.target.value } : s);
                                                    setConfig({ ...config, carousel: { ...config.carousel, slides: updated } });
                                                }}
                                                className="w-full p-2 bg-transparent border-b border-gray-300 dark:border-gray-600"
                                                style={{ color: textColor }}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-medium mb-1 opacity-60" style={{ color: textColor }}>Link URL</label>
                                            <input
                                                type="text"
                                                value={slide.link_url}
                                                onChange={(e) => {
                                                    const updated = config.carousel.slides.map(s => s.id === slide.id ? { ...s, link_url: e.target.value } : s);
                                                    setConfig({ ...config, carousel: { ...config.carousel, slides: updated } });
                                                }}
                                                className="w-full p-2 bg-transparent border-b border-gray-300 dark:border-gray-600"
                                                style={{ color: textColor }}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <button
                                                onClick={() => {
                                                    const updated = config.carousel.slides.map(s => s.id === slide.id ? { ...s, is_active: !s.is_active } : s);
                                                    setConfig({ ...config, carousel: { ...config.carousel, slides: updated } });
                                                }}
                                                className={`flex items-center gap-2 text-sm font-semibold ${slide.is_active ? 'text-green-500' : 'text-gray-500'}`}
                                            >
                                                {slide.is_active ? <Eye size={18} /> : <EyeOff size={18} />}
                                                {slide.is_active ? 'Visible' : 'Hidden'}
                                            </button>
                                            
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => moveSlide(index, 'up')} className="p-2 hover:bg-black/5 rounded-lg"><ChevronUp size={20} /></button>
                                                <button onClick={() => moveSlide(index, 'down')} className="p-2 hover:bg-black/5 rounded-lg"><ChevronDown size={20} /></button>
                                                <button onClick={() => removeSlide(slide.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg ml-2"><Trash2 size={20} /></button>
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

            <style>{`
                .animate-fadeIn {
                    animation: fadeIn 0.4s ease-out;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
