import React, { createContext, useContext, useState } from 'react';

export interface User {
    email: string;
    name?: string;
    isAdmin?: boolean;
}

interface AuthContextType {
    isAuthenticated: boolean;
    user: User | null;
    login: (email: string, password: string) => void;
    register: (name: string, email: string, password: string) => void;
    logout: () => void;
    resetPassword: (email: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<User | null>(null);

    const login = (email: string, password: string) => {
        console.log('Login attempt:', { email, password });
        setIsAuthenticated(true);
        // Admin login simulation: admin@example.com with any password
        const isAdmin = email === 'admin@example.com' || email.endsWith('.admin');
        setUser({ email, isAdmin });
    };

    const register = (name: string, email: string, password: string) => {
        console.log('Register attempt:', { name, email, password });
        setIsAuthenticated(true);
        setUser({ email, name, isAdmin: false });
    };

    const logout = () => {
        setIsAuthenticated(false);
        setUser(null);
    };

    const resetPassword = (email: string) => {
        console.log('Password reset requested for:', email);
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, user, login, register, logout, resetPassword }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
