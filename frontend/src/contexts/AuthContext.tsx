import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:8000';

export interface User {
    id?: string;
    email: string;
    full_name?: string;
    name?: string;
    isAdmin?: boolean;
    roles?: string[];
}

interface AuthContextType {
    isAuthenticated: boolean;
    user: User | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string) => Promise<void>;
    logout: () => void;
    resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchUser = async (token: string) => {
        try {
            const response = await axios.get(`${API_URL}/users/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const userData = response.data;
            const isAdmin = userData.roles?.some((roleName: string) => ['admin', 'root'].includes(roleName));
            setUser({
                id: userData.id,
                email: userData.email,
                full_name: userData.full_name,
                name: userData.full_name,
                roles: userData.roles,
                isAdmin
            });
            setIsAuthenticated(true);
        } catch (error) {
            console.error('Failed to fetch user:', error);
            logout();
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (token) {
            fetchUser(token);
            // Restore dashboard page for authenticated users
            const savedPage = localStorage.getItem('currentPage');
            if (!savedPage || savedPage === 'home') {
                localStorage.setItem('currentPage', 'dashboard');
            }
        } else {
            setIsLoading(false);
        }
    }, []);

    const login = async (email: string, password: string) => {
        const formData = new URLSearchParams();
        formData.append('username', email);
        formData.append('password', password);

        try {
            const response = await axios.post(`${API_URL}/auth/login`, formData, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });
            const data = response.data;
            localStorage.setItem('access_token', data.access_token);
            if (data.refresh_token) {
                localStorage.setItem('refresh_token', data.refresh_token);
            }
            // Navigate to dashboard after login
            localStorage.setItem('currentPage', 'dashboard');

            await fetchUser(data.access_token);
        } catch (error: any) {
            if (axios.isAxiosError(error) && error.response) {
                throw new Error(error.response.data.detail || 'Login failed');
            }
            throw new Error('Login failed');
        }
    };

    const register = async (name: string, email: string, password: string) => {
        try {
            await axios.post(`${API_URL}/auth/register`, {
                full_name: name,
                email,
                password
            });
            // Auto login after successful registration
            await login(email, password);
        } catch (error: any) {
            if (axios.isAxiosError(error) && error.response) {
                const detail = error.response.data.detail;
                if (typeof detail === 'string') {
                    throw new Error(detail);
                } else if (Array.isArray(detail)) {
                    throw new Error(detail[0]?.msg || 'Registration failed');
                }
            }
            throw new Error('Registration failed');
        }
    };

    const logout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.setItem('currentPage', 'home');
        setIsAuthenticated(false);
        setUser(null);
    };

    const resetPassword = async (email: string) => {
        console.log('Password reset requested for:', email);
        // Implement API call for password reset if needed
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, user, isLoading, login, register, logout, resetPassword }}>
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
