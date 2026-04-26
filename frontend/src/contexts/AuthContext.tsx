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
    // Fiscal fields
    document_type?: string;
    document_number?: string;
    rif?: string;
    business_name?: string;
    fiscal_address?: string;
    phone?: string;
    is_contributor?: boolean;
}

interface AuthContextType {
    isAuthenticated: boolean;
    user: User | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (
        name: string,
        email: string,
        password: string,
        document_type: string,
        document_number: string,
        rif: string,
        fiscal_address: string,
        phone: string,
        business_name?: string,
        is_contributor?: boolean,
    ) => Promise<void>;
    logout: () => void;
    updateProfile: (profileData: { full_name?: string; fiscal_address?: string; rif?: string }) => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Utility to check if JWT token is expired
const isTokenExpired = (token: string): boolean => {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.exp * 1000 < Date.now();
    } catch {
        return true;
    }
};

// Function to refresh access token using refresh token
const refreshAccessToken = async (): Promise<string | null> => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) return null;
    
    try {
        const formData = new URLSearchParams();
        formData.append('refresh_token', refreshToken);
        
        const response = await axios.post(`${API_URL}/auth/refresh`, formData, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });
        const data = response.data;
        localStorage.setItem('access_token', data.access_token);
        if (data.refresh_token) {
            localStorage.setItem('refresh_token', data.refresh_token);
        }
        return data.access_token;
    } catch (error) {
        console.error('Failed to refresh token:', error);
        return null;
    }
};

// Axios response interceptor to handle 401 errors and auto-refresh
axios.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If error is 401 and we haven't retried yet
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            // Try to refresh the token
            const newToken = await refreshAccessToken();

            if (newToken) {
                // Retry original request with new token
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return axios(originalRequest);
            }
        }

        // Only logout and redirect on 401 errors (authentication failures)
        // Don't redirect on 400 (validation errors) or other errors
        if (error.response?.status === 401) {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.setItem('currentPage', 'home');
            window.location.href = '/';
        }

        return Promise.reject(error);
    }
);

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
                isAdmin,
                rif: userData.rif,
                document_type: userData.document_type,
                document_number: userData.document_number,
                business_name: userData.business_name,
                fiscal_address: userData.fiscal_address,
                phone: userData.phone,
                is_contributor: userData.is_contributor,
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
            // Check if token is expired
            if (isTokenExpired(token)) {
                // Token expired, try to refresh
                refreshAccessToken().then((newToken) => {
                    if (newToken) {
                        fetchUser(newToken);
                    } else {
                        logout();
                        window.location.href = '/';
                    }
                });
            } else {
                fetchUser(token);
            }
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
            // Flag to add delay to tangram loader on redirect
            sessionStorage.setItem('redirectAfterLogin', 'true');

            await fetchUser(data.access_token);

            // Notify cart to refresh after login
            window.dispatchEvent(new CustomEvent('cart:refresh'));
        } catch (error: any) {
            if (axios.isAxiosError(error) && error.response) {
                throw new Error(error.response.data.detail || 'Login failed');
            }
            throw new Error('Login failed');
        }
    };

    const register = async (
        name: string,
        email: string,
        password: string,
        document_type: string,
        document_number: string,
        rif: string,
        fiscal_address: string,
        phone: string,
        business_name?: string,
        is_contributor?: boolean,
    ) => {
        try {
            await axios.post(`${API_URL}/auth/register`, {
                full_name: name,
                email,
                password,
                document_type,
                document_number,
                rif,
                fiscal_address,
                phone,
                business_name,
                is_contributor: is_contributor || false,
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

    const updateProfile = async (profileData: { full_name?: string; fiscal_address?: string; rif?: string }) => {
        if (!user) {
            throw new Error('No active user');
        }

        const token = localStorage.getItem('access_token');
        if (!token) {
            throw new Error('No access token available');
        }

        const updatedUser: Partial<User> = {};
        const authHeaders = {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        };

        if (profileData.full_name !== undefined) {
            const response = await axios.patch(
                `${API_URL}/users/me`,
                { full_name: profileData.full_name },
                authHeaders,
            );
            updatedUser.full_name = response.data.full_name;
            updatedUser.name = response.data.full_name;
        }

        if (profileData.fiscal_address !== undefined || profileData.rif !== undefined) {
            const response = await axios.patch(
                `${API_URL}/users/me/fiscal`,
                {
                    fiscal_address: profileData.fiscal_address,
                    rif: profileData.rif,
                },
                authHeaders,
            );
            if (response.data.fiscal_address !== undefined) {
                updatedUser.fiscal_address = response.data.fiscal_address;
            }
            if (response.data.rif !== undefined) {
                updatedUser.rif = response.data.rif;
            }
        }

        setUser((prev) => prev ? { ...prev, ...updatedUser } : prev);
    };

    const resetPassword = async (email: string) => {
        console.log('Password reset requested for:', email);
        // Implement API call for password reset if needed
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, user, isLoading, login, register, logout, updateProfile, resetPassword }}>
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
