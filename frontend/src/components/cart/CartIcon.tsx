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
            onClick={onClick}
            className="relative p-2 rounded-lg hover:bg-[var(--palette-border)] transition-colors"
            title="Shopping Cart"
        >
            <ShoppingCart className="w-5 h-5 text-p-color" />
            {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-[var(--palette-primary)] text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                    {totalItems > 99 ? '99+' : totalItems}
                </span>
            )}
        </button>
    );
};
