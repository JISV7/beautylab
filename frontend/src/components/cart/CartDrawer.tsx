import React from 'react';
import { X, Trash2, Plus, Minus, ShoppingCart } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';

interface CartDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    onCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose, onCheckout }) => {
    const { cart, removeFromCart, updateQuantity, isLoading } = useCart();

    const formatPrice = (price: string) => {
        const numericPrice = parseFloat(price);
        if (isNaN(numericPrice)) return 'Bs. 0,00';
        return `Bs. ${numericPrice.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black/50 z-40"
                onClick={onClose}
            />

            {/* Drawer */}
            <div className="fixed right-0 top-0 h-full w-full max-w-md palette-surface z-50 shadow-xl flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b palette-border">
                    <div className="flex items-center gap-2">
                        <ShoppingCart className="w-5 h-5 text-[var(--palette-primary)]" />
                        <h2 className="text-lg font-bold text-p-color">Shopping Cart</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-[var(--palette-border)] rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-p-color" />
                    </button>
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto p-4">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--palette-primary)]"></div>
                        </div>
                    ) : !cart || cart.items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <ShoppingCart className="w-16 h-16 text-p-color opacity-20 mb-4" />
                            <p className="text-p-color font-semibold">Your cart is empty</p>
                            <p className="text-p-color opacity-60 text-sm mt-1">
                                Add courses to get started
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {cart.items.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex gap-3 p-3 bg-[var(--palette-background)] rounded-lg"
                                >
                                    {/* Product Info */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-p-color truncate">
                                            {item.product_name || 'Course'}
                                        </h3>
                                        <p className="text-xs text-p-color opacity-60">
                                            SKU: {item.product_sku || 'N/A'}
                                        </p>
                                        <p className="text-sm font-bold text-[var(--palette-primary)] mt-1">
                                            {formatPrice(item.product_price || '0')}
                                        </p>
                                    </div>

                                    {/* Quantity Controls */}
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => {
                                                    if (item.quantity > 1) {
                                                        updateQuantity(item.id, item.quantity - 1);
                                                    } else {
                                                        removeFromCart(item.id);
                                                    }
                                                }}
                                                className="p-1 hover:bg-[var(--palette-border)] rounded transition-colors"
                                            >
                                                <Minus className="w-4 h-4 text-p-color" />
                                            </button>
                                            <span className="w-8 text-center text-sm font-semibold text-p-color">
                                                {item.quantity}
                                            </span>
                                            <button
                                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                className="p-1 hover:bg-[var(--palette-border)] rounded transition-colors"
                                            >
                                                <Plus className="w-4 h-4 text-p-color" />
                                            </button>
                                        </div>
                                        <button
                                            onClick={() => removeFromCart(item.id)}
                                            className="p-1 text-red-500 hover:bg-red-500/10 rounded transition-colors"
                                            title="Remove item"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer with Totals */}
                {cart && cart.items.length > 0 && (
                    <div className="border-t palette-border p-4 space-y-3">
                        <div className="flex justify-between text-sm text-p-color opacity-75">
                            <span>Subtotal</span>
                            <span>{formatPrice(cart.subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-p-color opacity-75">
                            <span>IVA ({cart.tax_total !== '0.00' ? '16%' : '0%'})</span>
                            <span>{formatPrice(cart.tax_total)}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold text-p-color pt-2 border-t palette-border">
                            <span>Total</span>
                            <span className="text-[var(--palette-primary)]">
                                {formatPrice(cart.total)}
                            </span>
                        </div>
                        <button
                            onClick={onCheckout}
                            className="w-full py-3 bg-[var(--palette-primary)] text-white font-bold rounded-lg hover:opacity-90 transition-opacity"
                        >
                            Proceed to Checkout
                        </button>
                    </div>
                )}
            </div>
        </>
    );
};
