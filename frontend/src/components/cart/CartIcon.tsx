import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';

interface CartIconProps {
    onClick?: () => void;
}

export const CartIcon: React.FC<CartIconProps> = ({ onClick }) => {
    const { cart } = useCart();
    const totalItems = cart?.total_items || 0;

    return (
        <button
            type="button"
            onClick={onClick}
            className="relative w-10 h-10 inline-flex items-center justify-center rounded-lg hover:bg-[var(--palette-border)] transition-colors"
            aria-label={`Carrito de compras${totalItems > 0 ? `, ${totalItems} artículo${totalItems === 1 ? '' : 's'}` : ''}`}
            title="Carrito de compras"
        >
            <ShoppingCart className="w-5 h-5 text-paragraph" aria-hidden="true" />
            {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-5 h-5 px-1 bg-[var(--palette-primary)] text-on-primary text-[10px] font-bold rounded-full flex items-center justify-center leading-none" aria-hidden="true">
                    {totalItems > 99 ? '99+' : totalItems}
                </span>
            )}
        </button>
    );
};
