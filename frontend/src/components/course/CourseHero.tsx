import React, { useState } from 'react';
import { Clock, PlayCircle, ExternalLink, Plus, Minus, ShoppingCart } from 'lucide-react';

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
    onAddToCart?: (quantity: number) => void;
    isInCart?: boolean;
    cartQuantity?: number;
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
    onAddToCart,
    isInCart = false,
    cartQuantity = 0,
}) => {
    const [quantity, setQuantity] = useState(1);

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
                    <div className="w-full h-48 flex items-center justify-center text-paragraph opacity-40">
                        <span className="text-paragraph">No image available</span>
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
                        <div className="flex items-center gap-1.5 text-paragraph opacity-60">
                            <Clock size={14} />
                            <span className="text-sm">{duration_hours}h</span>
                        </div>
                    )}
                </div>

                {/* Title */}
                <h1 className="text-h2 mb-4">
                    {title}
                </h1>

                {/* Description */}
                {description && (
                    <p className="text-paragraph mb-6 leading-relaxed">
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
                        <span className="text-paragraph">Watch Course Video</span>
                        <ExternalLink size={14} />
                    </a>
                )}

                {/* Price and Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-6 border-t border-[var(--palette-border)]">
                    <div className="space-y-2">
                        {/* Product Name */}
                        {product_name && (
                            <div>
                                <p className="text-[10px] font-bold text-paragraph opacity-40 uppercase tracking-wider mb-1">
                                    Product Name
                                </p>
                                <p className="text-sm font-semibold text-paragraph">
                                    {product_name}
                                </p>
                            </div>
                        )}
                        {/* Product SKU */}
                        {product_sku && (
                            <div>
                                <p className="text-[10px] font-bold text-paragraph opacity-40 uppercase tracking-wider mb-1">
                                    SKU
                                </p>
                                <p className="text-sm font-mono text-paragraph opacity-80">
                                    {product_sku}
                                </p>
                            </div>
                        )}
                        {/* Price */}
                        <div>
                            <p className="text-[10px] font-bold text-paragraph opacity-40 uppercase tracking-wider mb-1">
                                Enrollment Price
                            </p>
                            <p className="text-2xl font-black text-paragraph">
                                {formatPrice(price)}
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col gap-3 w-full sm:w-auto">
                        {/* Quantity Selector */}
                        {onAddToCart && (
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-paragraph opacity-75">Qty:</span>
                                <button
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    className="p-1.5 hover:bg-[var(--palette-border)] rounded transition-colors"
                                >
                                    <Minus className="w-4 h-4" />
                                </button>
                                <input
                                    type="number"
                                    min={1}
                                    max={999}
                                    value={quantity}
                                    onChange={(e) => {
                                        const val = parseInt(e.target.value, 10);
                                        if (!isNaN(val) && val >= 1) setQuantity(Math.min(999, val));
                                    }}
                                    onBlur={() => {
                                        if (quantity < 1) setQuantity(1);
                                    }}
                                    className="w-16 text-center font-bold text-paragraph theme-input !py-1 !px-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                                <button
                                    onClick={() => setQuantity(Math.min(999, quantity + 1))}
                                    className="p-1.5 hover:bg-[var(--palette-border)] rounded transition-colors"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                        {/* Action Buttons */}
                        <div className="flex gap-2">
                            {onAddToCart && (
                                <button
                                    onClick={() => onAddToCart(quantity)}
                                    className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-bold transition-colors ${
                                        isInCart
                                            ? 'bg-green-500/10 text-green-600 border border-green-500/20'
                                            : 'bg-[var(--palette-secondary)] text-white hover:opacity-90'
                                    }`}
                                >
                                    <ShoppingCart className="w-4 h-4" />
                                    {isInCart ? `In Cart (${cartQuantity})` : 'Add to Cart'}
                                </button>
                            )}
                            {onBuy && (
                                <button
                                    onClick={onBuy}
                                    className="flex-1 sm:flex-none theme-button theme-button-primary"
                                >
                                    Buy Now
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
