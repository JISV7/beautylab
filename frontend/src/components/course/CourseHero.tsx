import React from 'react';
import { Clock, PlayCircle, ExternalLink } from 'lucide-react';

export interface CourseHeroProps {
    title: string;
    description: string | null;
    image_url: string | null;
    duration_hours: number | null;
    level_name: string | null;
    category_name: string | null;
    product_name: string | null;
    product_sku: string | null;
    price: string | null;
    video_url: string | null;
    onBuy?: () => void;
}

export const CourseHero: React.FC<CourseHeroProps> = ({
    title,
    description,
    image_url,
    duration_hours,
    level_name,
    category_name,
    product_name,
    product_sku,
    price,
    video_url,
    onBuy,
}) => {
    const formatPrice = (priceStr: string | null) => {
        if (!priceStr) return 'Bs. 0,00';
        const numericPrice = parseFloat(priceStr);
        if (isNaN(numericPrice)) return 'Bs. 0,00';
        return `Bs. ${numericPrice.toLocaleString('es-VE', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;
    };

    return (
        <div className="palette-surface palette-border border rounded-xl overflow-hidden mb-8">
            {/* Course Banner Image */}
            <div className="w-full overflow-hidden bg-[var(--palette-background)]">
                {image_url ? (
                    <img
                        src={image_url}
                        alt={title}
                        className="w-full h-auto object-contain max-h-64 md:max-h-80 lg:max-h-96 mx-auto"
                        onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                        }}
                    />
                ) : (
                    <div className="w-full h-48 flex items-center justify-center text-p-color opacity-40">
                        <span className="text-p-color">No image available</span>
                    </div>
                )}
            </div>

            {/* Course Info */}
            <div className="p-6">
                {/* Category and Level Badges */}
                <div className="flex flex-wrap items-center gap-3 mb-4">
                    {category_name && (
                        <span className="text-[var(--palette-primary)] text-xs font-black uppercase tracking-widest">
                            {category_name}
                        </span>
                    )}
                    {level_name && (
                        <span className="bg-[var(--palette-primary)]/10 text-[var(--palette-primary)] font-bold px-3 py-1 rounded-lg text-xs">
                            {level_name}
                        </span>
                    )}
                    {duration_hours && (
                        <div className="flex items-center gap-1.5 text-p-color opacity-60">
                            <Clock size={14} />
                            <span className="text-sm">{duration_hours}h</span>
                        </div>
                    )}
                </div>

                {/* Title */}
                <h1 className="text-h2-font text-h2-size text-h2-color mb-4">
                    {title}
                </h1>

                {/* Description */}
                {description && (
                    <p className="text-p-font text-p-size text-p-color mb-6 leading-relaxed">
                        {description}
                    </p>
                )}

                {/* Video Link (if available) */}
                {video_url && (
                    <a
                        href={video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-[var(--palette-primary)] hover:opacity-80 transition-opacity mb-6"
                    >
                        <PlayCircle size={18} />
                        <span className="text-p-font text-p-size">Watch Course Video</span>
                        <ExternalLink size={14} />
                    </a>
                )}

                {/* Price and Buy Button */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-6 border-t border-[var(--palette-border)]">
                    <div className="space-y-2">
                        {/* Product Name */}
                        {product_name && (
                            <div>
                                <p className="text-[10px] font-bold text-p-color opacity-40 uppercase tracking-wider mb-1">
                                    Product Name
                                </p>
                                <p className="text-sm font-semibold text-p-color">
                                    {product_name}
                                </p>
                            </div>
                        )}
                        {/* Product SKU */}
                        {product_sku && (
                            <div>
                                <p className="text-[10px] font-bold text-p-color opacity-40 uppercase tracking-wider mb-1">
                                    SKU
                                </p>
                                <p className="text-sm font-mono text-p-color opacity-80">
                                    {product_sku}
                                </p>
                            </div>
                        )}
                        {/* Price */}
                        <div>
                            <p className="text-[10px] font-bold text-p-color opacity-40 uppercase tracking-wider mb-1">
                                Enrollment Price
                            </p>
                            <p className="text-2xl font-black text-p-color">
                                {formatPrice(price)}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onBuy}
                        className="theme-button theme-button-primary w-full sm:w-auto"
                    >
                        Buy Now
                    </button>
                </div>
            </div>
        </div>
    );
};
