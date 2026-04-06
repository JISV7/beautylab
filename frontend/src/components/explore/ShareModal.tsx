import React, { useState, useEffect } from 'react';
import { Share2, MessageCircle, Phone, X, Copy, Check, Loader2, Clock, Tag, Package, BookOpen } from 'lucide-react';
import axios from 'axios';

const API_URL = 'http://localhost:8000';

const getAuthToken = (): string | null => localStorage.getItem('access_token');

const api = axios.create({
    baseURL: API_URL,
    headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
    const token = getAuthToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

interface CourseDetails {
    id: string;
    title: string;
    slug: string;
    description: string | null;
    image_url: string | null;
    duration_hours: number | null;
    level_name: string | null;
    category_name: string | null;
    product_name: string | null;
    product_sku: string | null;
    product_price: string | null;
    product_tax_rate: string | null;
}

export interface ShareModalProps {
    courseTitle: string;
    courseId: string;
    description?: string | null;
    imageUrl?: string | null;
    durationHours?: number | null;
    levelName?: string | null;
    price?: string;
}

const formatPrice = (priceStr?: string | null) => {
    if (!priceStr) return null;
    const num = parseFloat(priceStr);
    if (isNaN(num)) return null;
    return `Bs. ${num.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const ShareModal: React.FC<ShareModalProps> = ({
    courseTitle,
    courseId,
    description: cardDescription,
    imageUrl,
    durationHours,
    levelName,
    price,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const [details, setDetails] = useState<CourseDetails | null>(null);
    const [loading, setLoading] = useState(false);

    // Fetch full course details when modal opens
    useEffect(() => {
        if (!isOpen || details) return;
        setLoading(true);
        api.get<CourseDetails>(`/catalog/courses/${courseId}/details`)
            .then((res) => setDetails(res.data))
            .catch(() => null)
            .finally(() => setLoading(false));
    }, [isOpen, courseId, details]);

    const course = details || {
        title: courseTitle,
        description: cardDescription,
        image_url: imageUrl,
        duration_hours: durationHours,
        level_name: levelName,
        product_name: null,
        product_sku: null,
        product_price: price,
        product_tax_rate: null,
    };

    const shareUrl = `${window.location.origin}/course/${courseId}`;
    const formattedPrice = formatPrice(course.product_price);

    // Build share message — uses FULL description from API
    const lines = [
        course.title,
        '',
    ];

    // Full description for sharing
    if (course.description) {
        lines.push(course.description);
        lines.push('');
    }

    if (course.product_name) lines.push(`Product Name: ${course.product_name}`);
    if (course.product_sku) lines.push(`SKU: ${course.product_sku}`);
    if (course.duration_hours) lines.push(`Duration: ${course.duration_hours}h`);
    if (course.level_name) lines.push(`Level: ${course.level_name}`);
    if (formattedPrice) lines.push(`Price: ${formattedPrice}`);

    lines.push('');
    lines.push(shareUrl);

    const shareMessage = lines.join('\n');

    // Short description for modal display (2 lines max, ~120 chars)
    const modalDescription = course.description && course.description.length > 120
        ? course.description.slice(0, 120) + '...'
        : course.description;

    // Share URLs
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareMessage)}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(shareMessage);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            const ta = document.createElement('textarea');
            ta.value = shareMessage;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    // Trigger button (always visible)
    const TriggerButton = () => (
        <button
            onClick={() => { setIsOpen(true); setDetails(null); setCopied(false); }}
            className="p-1.5 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full hover:bg-white dark:hover:bg-gray-700 transition-colors shadow-sm border border-[var(--palette-primary)]/40"
            title="Share course"
        >
            <Share2 className="w-4 h-4 text-[var(--palette-primary)]" />
        </button>
    );

    // When modal is NOT open, just render the trigger
    if (!isOpen) return <TriggerButton />;

    return (
        <>
            {/* Modal Overlay */}
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setIsOpen(false)}>
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

                {/* Modal Content — scrollable */}
                <div
                    className="relative z-10 w-full max-w-md palette-surface palette-border border rounded-2xl shadow-2xl overflow-hidden flex flex-col"
                    style={{ maxHeight: '85vh' }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header with course image — fixed */}
                    <div className="relative h-32 w-full overflow-hidden bg-[var(--palette-background)] flex-shrink-0">
                        {course.image_url ? (
                            <img
                                src={course.image_url}
                                alt={course.title}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <span className="text-paragraph opacity-30 text-sm">No image</span>
                            </div>
                        )}
                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                        {/* Close button */}
                        <button
                            onClick={() => setIsOpen(false)}
                            className="absolute top-3 right-3 p-1.5 bg-black/30 hover:bg-black/50 rounded-full transition-colors"
                        >
                            <X size={16} className="text-white" />
                        </button>

                        {/* Course title overlay */}
                        <div className="absolute bottom-3 left-4 right-4">
                            <h3 className="text-white font-bold text-sm truncate">
                                {course.title}
                            </h3>
                        </div>
                    </div>

                    {/* Scrollable Body */}
                    <div className="overflow-y-auto flex-1">
                        <div className="p-5 space-y-4">
                            {loading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="w-6 h-6 text-[var(--palette-primary)] animate-spin" />
                                </div>
                            ) : (
                                <>
                                    {/* Course details — short description */}
                                    <div className="space-y-3">
                                        {/* Short description (2 lines) */}
                                        {modalDescription && (
                                            <p className="text-paragraph opacity-75 text-sm leading-relaxed line-clamp-2">
                                                {modalDescription}
                                            </p>
                                        )}

                                        {/* Meta info */}
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            {course.product_name && (
                                                <div className="flex items-center gap-2 text-paragraph opacity-75">
                                                    <BookOpen className="w-4 h-4 flex-shrink-0" />
                                                    <span className="truncate">{course.product_name}</span>
                                                </div>
                                            )}
                                            {course.product_sku && (
                                                <div className="flex items-center gap-2 text-paragraph opacity-75">
                                                    <Package className="w-4 h-4 flex-shrink-0" />
                                                    <span>{course.product_sku}</span>
                                                </div>
                                            )}
                                            {course.duration_hours && (
                                                <div className="flex items-center gap-2 text-paragraph opacity-75">
                                                    <Clock className="w-4 h-4 flex-shrink-0" />
                                                    <span>{course.duration_hours}h</span>
                                                </div>
                                            )}
                                            {course.level_name && (
                                                <div className="flex items-center gap-2 text-paragraph opacity-75">
                                                    <Tag className="w-4 h-4 flex-shrink-0" />
                                                    <span>{course.level_name}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Price — no IVA text */}
                                        {formattedPrice && (
                                            <div className="pt-2 border-t border-[var(--palette-border)]">
                                                <div className="flex items-baseline justify-between">
                                                    <span className="text-xs text-paragraph opacity-50 uppercase tracking-wider font-bold">
                                                        Price
                                                    </span>
                                                    <span className="text-lg font-black text-[var(--palette-primary)]">
                                                        {formattedPrice}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Share Options */}
                                    <div className="space-y-2 pt-2">
                                        {/* Telegram */}
                                        <a
                                            href={telegramUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#0088cc]/10 hover:bg-[#0088cc]/20 text-[#0088cc] transition-colors"
                                        >
                                            <MessageCircle className="w-5 h-5 flex-shrink-0" />
                                            <span className="text-paragraph font-medium">Share on Telegram</span>
                                        </a>

                                        {/* WhatsApp */}
                                        <a
                                            href={whatsappUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] transition-colors"
                                        >
                                            <Phone className="w-5 h-5 flex-shrink-0" />
                                            <span className="text-paragraph font-medium">Share on WhatsApp</span>
                                        </a>

                                        {/* Copy */}
                                        <button
                                            onClick={handleCopy}
                                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--palette-background)] hover:bg-[var(--palette-border)] transition-colors"
                                        >
                                            {copied ? (
                                                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                                            ) : (
                                                <Copy className="w-5 h-5 text-paragraph opacity-60 flex-shrink-0" />
                                            )}
                                            <span className="text-paragraph font-medium text-paragraph">
                                                {copied ? 'Copied to clipboard!' : 'Copy to clipboard'}
                                            </span>
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
