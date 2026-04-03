import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:8000';

export interface CartItem {
    id: string;
    user_id: string;
    product_id: string;
    quantity: number;
    created_at: string;
    updated_at: string;
    product_name: string | null;
    product_price: string | null;
    product_sku: string | null;
}

export interface CartSummary {
    items: CartItem[];
    total_items: number;
    subtotal: string;
    tax_total: string;
    total: string;
}

interface CartContextType {
    cart: CartSummary | null;
    isLoading: boolean;
    addToCart: (productId: string, quantity: number) => Promise<void>;
    removeFromCart: (itemId: string) => Promise<void>;
    updateQuantity: (itemId: string, quantity: number) => Promise<void>;
    clearCart: () => Promise<void>;
    refreshCart: () => Promise<void>;
    isInCart: (productId: string) => boolean;
    getQuantityInCart: (productId: string) => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const getAuthToken = (): string | null => {
    return localStorage.getItem('access_token');
};

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const token = getAuthToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [cart, setCart] = useState<CartSummary | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const refreshCart = useCallback(async () => {
        const token = getAuthToken();
        if (!token) {
            setCart(null);
            return;
        }

        try {
            setIsLoading(true);
            const response = await api.get<CartSummary>('/cart/');
            setCart(response.data);
        } catch (error) {
            console.error('Failed to fetch cart:', error);
            setCart(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshCart();
    }, [refreshCart]);

    const addToCart = async (productId: string, quantity: number) => {
        try {
            await api.post('/cart/items', { product_id: productId, quantity });
            await refreshCart();
        } catch (error) {
            console.error('Failed to add to cart:', error);
            throw error;
        }
    };

    const removeFromCart = async (itemId: string) => {
        try {
            await api.delete(`/cart/items/${itemId}`);
            await refreshCart();
        } catch (error) {
            console.error('Failed to remove from cart:', error);
            throw error;
        }
    };

    const updateQuantity = async (itemId: string, quantity: number) => {
        try {
            await api.put(`/cart/items/${itemId}`, { quantity });
            await refreshCart();
        } catch (error) {
            console.error('Failed to update quantity:', error);
            throw error;
        }
    };

    const clearCart = async () => {
        try {
            await api.delete('/cart/');
            setCart(null);
        } catch (error) {
            console.error('Failed to clear cart:', error);
            throw error;
        }
    };

    const isInCart = (productId: string): boolean => {
        if (!cart) return false;
        return cart.items.some(item => item.product_id === productId);
    };

    const getQuantityInCart = (productId: string): number => {
        if (!cart) return 0;
        const item = cart.items.find(item => item.product_id === productId);
        return item?.quantity || 0;
    };

    return (
        <CartContext.Provider
            value={{
                cart,
                isLoading,
                addToCart,
                removeFromCart,
                updateQuantity,
                clearCart,
                refreshCart,
                isInCart,
                getQuantityInCart,
            }}
        >
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};
