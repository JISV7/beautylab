import React from 'react';
import { Plus, Minus, Trash2 } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';
import type { CartItemData } from './CartPage.types';

interface CartItemListProps {
    items: CartItemData[];
    onRemove: (id: string) => void;
    onUpdateQuantity: (id: string, quantity: number) => void;
}

export const CartItemList: React.FC<CartItemListProps> = ({
    items,
    onRemove,
    onUpdateQuantity,
}) => {
    return (
        <div className="space-y-4">
            {items.map((item) => (
                <div
                    key={item.id}
                    className="palette-surface palette-border border rounded-xl p-4 flex gap-4"
                >
                    <div className="flex-1">
                        <h3 className="text-h3 mb-1">
                            {item.product_name || 'Course'}
                        </h3>
                        <p className="text-paragraph opacity-60">
                            SKU: {item.product_sku || 'N/A'}
                        </p>
                        <h4 className="text-h4 text-[var(--palette-primary)] mt-2">
                            {formatCurrency(item.product_price || '0')}
                        </h4>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => {
                                    if (item.quantity > 1) {
                                        onUpdateQuantity(item.id, item.quantity - 1);
                                    } else {
                                        onRemove(item.id);
                                    }
                                }}
                                className="p-1.5 hover:bg-[var(--palette-border)] rounded transition-colors"
                            >
                                <Minus className="w-4 h-4 text-paragraph" />
                            </button>
                            <span className="w-10 text-center text-paragraph font-semibold">
                                {item.quantity}
                            </span>
                            <button
                                onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                                className="p-1.5 hover:bg-[var(--palette-border)] rounded transition-colors"
                            >
                                <Plus className="w-4 h-4 text-paragraph" />
                            </button>
                        </div>
                        <button
                            onClick={() => onRemove(item.id)}
                            className="flex items-center gap-1 text-red-500 hover:text-red-600 text-paragraph transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                            Remove
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};
