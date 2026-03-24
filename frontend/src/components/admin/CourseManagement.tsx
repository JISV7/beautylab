import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Save, Upload, HelpCircle, Rocket, Star, Eye as EyeIcon } from 'lucide-react';
import type { Course, Category, Level, CourseFormData } from './types';
import { MessageModal } from './MessageModal';
import { ConfirmModal } from './ConfirmModal';

const API_URL = 'http://localhost:8000';

// Get auth token from localStorage
const getAuthToken = (): string | null => {
    return localStorage.getItem('access_token');
};

// Axios instance with auth
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
    const token = getAuthToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

interface CourseManagementProps {
    courseId?: string;
    onBack?: () => void;
}

const emptyFormData: CourseFormData = {
    title: '',
    slug: '',
    description: '',
    image_url: '',
    duration_hours: '',
    level_id: '',
    category_id: '',
    published: false,
    product_name: '',
    sku: '',
    price: '',
    tax_rate: '16.00',
    tax_type: 'taxed',
};

export const CourseManagement: React.FC<CourseManagementProps> = ({ courseId, onBack }) => {
    const [formData, setFormData] = useState<CourseFormData>(emptyFormData);
    const [categories, setCategories] = useState<Category[]>([]);
    const [levels, setLevels] = useState<Level[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);

    const [messageModal, setMessageModal] = useState<{
        isOpen: boolean;
        type: 'success' | 'error';
        message: string;
    }>({ isOpen: false, type: 'success', message: '' });

    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        type: 'danger' | 'primary' | 'success';
        title: string;
        message: string | React.ReactNode;
        confirmText: string;
        onConfirm: (() => void) | null;
    }>({
        isOpen: false,
        type: 'primary',
        title: '',
        message: '',
        confirmText: 'Confirm',
        onConfirm: null,
    });

    // Fetch categories, levels, and course data if editing
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [categoriesRes, levelsRes] = await Promise.all([
                    api.get('/api/catalog/categories'),
                    api.get('/api/catalog/levels'),
                ]);

                setCategories(categoriesRes.data.categories || []);
                setLevels(levelsRes.data.levels || []);

                if (courseId) {
                    // Fetch course data for editing
                    const courseRes = await api.get(`/api/catalog/courses/${courseId}`);
                    const course: Course = courseRes.data;

                    setFormData({
                        title: course.title,
                        slug: course.slug,
                        description: course.description || '',
                        image_url: course.image_url || '',
                        duration_hours: course.duration_hours?.toString() || '',
                        level_id: course.level_id?.toString() || '',
                        category_id: course.category_id?.toString() || '',
                        published: course.published,
                        product_name: course.product_name || '',
                        sku: '', // SKU not returned in course details
                        price: course.product_price || '',
                        tax_rate: '16.00',
                        tax_type: 'taxed',
                    });
                }
            } catch (error: any) {
                console.error('Failed to fetch data:', error);
                setMessageModal({
                    isOpen: true,
                    type: 'error',
                    message: error.response?.data?.detail || 'Failed to load course data.',
                });
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [courseId]);

    // Auto-generate slug from title
    useEffect(() => {
        if (formData.title && !courseId) {
            const slug = formData.title
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '');
            setFormData(prev => ({ ...prev, slug }));
        }
    }, [formData.title, courseId]);

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) || '' : value,
        }));
    };

    const handleNextStep = () => {
        if (currentStep < 3) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handlePrevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const validateStep = (step: number): boolean => {
        switch (step) {
            case 1:
                if (!formData.title.trim()) {
                    setMessageModal({ isOpen: true, type: 'error', message: 'Course title is required.' });
                    return false;
                }
                if (!formData.slug.trim()) {
                    setMessageModal({ isOpen: true, type: 'error', message: 'Course slug is required.' });
                    return false;
                }
                if (!formData.description.trim()) {
                    setMessageModal({ isOpen: true, type: 'error', message: 'Course description is required.' });
                    return false;
                }
                break;
            case 2:
                if (!formData.product_name.trim()) {
                    setMessageModal({ isOpen: true, type: 'error', message: 'Product name is required.' });
                    return false;
                }
                if (!formData.sku.trim()) {
                    setMessageModal({ isOpen: true, type: 'error', message: 'SKU is required.' });
                    return false;
                }
                if (!formData.price || parseFloat(formData.price) < 0) {
                    setMessageModal({ isOpen: true, type: 'error', message: 'Valid price is required (must be >= 0).' });
                    return false;
                }
                break;
        }
        return true;
    };

    const handleSave = () => {
        if (!validateStep(1) || !validateStep(2)) {
            setCurrentStep(1);
            return;
        }

        setConfirmModal({
            isOpen: true,
            type: 'success',
            title: formData.published ? 'Publish Course' : 'Save Course',
            message: formData.published
                ? 'Are you sure you want to publish this course? It will be visible to all users.'
                : 'Save this course as draft? You can publish it later.',
            confirmText: formData.published ? 'Publish' : 'Save Draft',
            onConfirm: () => {
                submitForm();
            },
        });
    };

    const submitForm = async () => {
        try {
            setSaving(true);

            // First, create the product
            const productData = {
                name: formData.product_name,
                description: formData.description,
                sku: formData.sku.toUpperCase(),
                price: parseFloat(formData.price),
                tax_rate: 16.00, // Fixed IVA rate for Venezuela
                tax_type: 'taxed', // Always taxed for courses
                is_active: true,
            };

            let productId: string;

            if (courseId) {
                // For editing, we'd need to update the product separately
                // For now, we'll create a new product (simplified approach)
                const productRes = await api.post('/api/products', productData);
                productId = productRes.data.id;

                // Update the course
                const courseData = {
                    title: formData.title,
                    slug: formData.slug,
                    description: formData.description,
                    image_url: formData.image_url || null,
                    duration_hours: formData.duration_hours ? parseInt(formData.duration_hours) : null,
                    level_id: formData.level_id ? parseInt(formData.level_id) : null,
                    category_id: formData.category_id ? parseInt(formData.category_id) : null,
                    product_id: productId,
                    published: formData.published,
                };

                await api.put(`/api/catalog/courses/${courseId}`, courseData);
            } else {
                // Create new product
                const productRes = await api.post('/api/products', productData);
                productId = productRes.data.id;

                // Create the course
                const courseData = {
                    title: formData.title,
                    slug: formData.slug,
                    description: formData.description,
                    image_url: formData.image_url || null,
                    duration_hours: formData.duration_hours ? parseInt(formData.duration_hours) : null,
                    level_id: formData.level_id ? parseInt(formData.level_id) : null,
                    category_id: formData.category_id ? parseInt(formData.category_id) : null,
                    product_id: productId,
                    published: formData.published,
                };

                await api.post('/api/catalog/courses', courseData);
            }

            setMessageModal({
                isOpen: true,
                type: 'success',
                message: courseId ? 'Course updated successfully!' : 'Course created successfully!',
            });

            // Navigate back after successful save
            setTimeout(() => {
                onBack?.();
            }, 1500);
        } catch (error: any) {
            console.error('Failed to save course:', error);
            setMessageModal({
                isOpen: true,
                type: 'error',
                message: error.response?.data?.detail || 'Failed to save course. Please check all fields.',
            });
        } finally {
            setSaving(false);
        }
    };

    const handleDiscard = () => {
        setConfirmModal({
            isOpen: true,
            type: 'danger',
            title: 'Discard Changes',
            message: 'Are you sure you want to discard all changes?',
            confirmText: 'Discard',
            onConfirm: () => {
                onBack?.();
            },
        });
    };

    // Format price for preview
    const formatPrice = (price: string) => {
        if (!price) return 'Bs. 0,00';
        return `Bs. ${parseFloat(price).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    // Get level name
    const getLevelName = () => {
        if (!formData.level_id) return 'Not set';
        const level = levels.find(l => l.id.toString() === formData.level_id);
        return level?.name || 'Not set';
    };

    // Get category name
    const getCategoryName = () => {
        if (!formData.category_id) return 'Not set';
        const category = categories.find(c => c.id.toString() === formData.category_id);
        return category?.name || 'Not set';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--palette-primary)]"></div>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <nav className="flex text-xs font-bold text-p-color opacity-60 mb-2 gap-2 uppercase tracking-widest">
                            <span>Courses</span>
                            <span>/</span>
                            <span className="text-[var(--palette-primary)]">
                                {courseId ? 'Edit' : 'Create New'}
                            </span>
                        </nav>
                        <h2 className="text-h2-size text-h2-color text-h2-font text-h2-weight">
                            {courseId ? 'Edit Course' : 'Course Creation'}
                        </h2>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleDiscard}
                            className="theme-button"
                            style={{
                                backgroundColor: 'transparent',
                                color: 'var(--text-p-color)',
                                border: '1px solid var(--palette-border)',
                            }}
                        >
                            Discard
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="theme-button theme-button-primary"
                        >
                            <Save size={18} />
                            {saving ? 'Saving...' : (formData.published ? 'Publish' : 'Save Draft')}
                        </button>
                    </div>
                </div>

                {/* Stepper */}
                <div className="theme-card flex justify-between items-center flex-wrap gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-[200px]">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold transition-colors ${
                            currentStep === 1
                                ? 'bg-[var(--palette-primary)]'
                                : currentStep > 1
                                    ? 'bg-[var(--palette-primary)]/30'
                                    : 'bg-[var(--palette-surface)]'
                        }`}>
                            <span className={currentStep === 1 || currentStep > 1 ? 'decorator-color' : 'text-p-color'}>1</span>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-p-color">Course Info</p>
                            <p className="text-xs text-p-color opacity-60">Identity and metadata</p>
                        </div>
                    </div>
                    <div className="h-px bg-[var(--palette-border)] flex-1 mx-4 hidden lg:block"></div>
                    <div className="flex items-center gap-4 flex-1 min-w-[200px]">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold transition-colors ${
                            currentStep === 2
                                ? 'bg-[var(--palette-primary)]'
                                : currentStep > 2
                                    ? 'bg-[var(--palette-primary)]/30'
                                    : 'bg-[var(--palette-surface)]'
                        }`}>
                            <span className={currentStep === 2 || currentStep > 2 ? 'decorator-color' : 'text-p-color'}>2</span>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-p-color">Commercial</p>
                            <p className="text-xs text-p-color opacity-60">Pricing and SKU</p>
                        </div>
                    </div>
                    <div className="h-px bg-[var(--palette-border)] flex-1 mx-4 hidden lg:block"></div>
                    <div className="flex items-center gap-4 flex-1 min-w-[200px]">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold transition-colors ${
                            currentStep === 3
                                ? 'bg-[var(--palette-primary)]'
                                : currentStep > 3
                                    ? 'bg-[var(--palette-primary)]/30'
                                    : 'bg-[var(--palette-surface)]'
                        }`}>
                            <span className={currentStep === 3 || currentStep > 3 ? 'decorator-color' : 'text-p-color'}>3</span>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-p-color">Publishing</p>
                            <p className="text-xs text-p-color opacity-60">Review & Launch</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Form Section */}
                    <div className="lg:col-span-8 space-y-6">
                        {/* Step 1: Course Info */}
                        {currentStep === 1 && (
                            <div className="theme-card p-6 space-y-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <h3 className="text-h3-size text-h3-color text-h3-font text-h3-weight">
                                        Step 1: Course Info
                                    </h3>
                                    <HelpCircle size={20} className="text-p-color opacity-40 cursor-help" />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-bold mb-2 text-p-color">
                                            Course Title
                                        </label>
                                        <input
                                            type="text"
                                            name="title"
                                            className="theme-input w-full"
                                            placeholder="e.g. Python for Data Science"
                                            value={formData.title}
                                            onChange={handleInputChange}
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-bold mb-2 text-p-color">
                                            Slug
                                        </label>
                                        <div className="flex">
                                            <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-[var(--palette-border)] bg-[var(--palette-surface)] text-p-color opacity-60 text-xs">
                                                beautylab.com/c/
                                            </span>
                                            <input
                                                type="text"
                                                name="slug"
                                                className="theme-input rounded-l-none flex-1"
                                                placeholder="python-ds-101"
                                                value={formData.slug}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-bold mb-2 text-p-color">
                                            Category Selection
                                        </label>
                                        <select
                                            name="category_id"
                                            className="theme-input w-full"
                                            value={formData.category_id}
                                            onChange={handleInputChange}
                                        >
                                            <option value="">Select a category</option>
                                            {categories.map(cat => (
                                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-bold mb-2 text-p-color">
                                            Level Selection
                                        </label>
                                        <select
                                            name="level_id"
                                            className="theme-input w-full"
                                            value={formData.level_id}
                                            onChange={handleInputChange}
                                        >
                                            <option value="">Select a level</option>
                                            {levels.map(level => (
                                                <option key={level.id} value={level.id}>{level.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold mb-2 text-p-color">
                                            Duration (Hours)
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                name="duration_hours"
                                                className="theme-input w-full pl-4 pr-10"
                                                value={formData.duration_hours}
                                                onChange={handleInputChange}
                                                placeholder="40"
                                                min="0"
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-p-color opacity-40 text-xs font-bold">
                                                hrs
                                            </span>
                                        </div>
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-bold mb-2 text-p-color">
                                            Description
                                        </label>
                                        <textarea
                                            name="description"
                                            className="theme-input w-full min-h-[120px]"
                                            placeholder="Briefly describe what students will learn..."
                                            value={formData.description}
                                            onChange={handleInputChange}
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-bold mb-2 text-p-color">
                                            Image URL Input
                                        </label>
                                        <div className="flex gap-3">
                                            <input
                                                type="url"
                                                name="image_url"
                                                className="theme-input flex-1"
                                                placeholder="https://cdn.beautylab.com/images/..."
                                                value={formData.image_url}
                                                onChange={handleInputChange}
                                            />
                                            <button
                                                type="button"
                                                className="px-4 border border-[var(--palette-border)] rounded-lg hover:bg-[var(--palette-surface)] transition-colors flex items-center gap-2"
                                            >
                                                <Upload size={18} className="text-p-color opacity-60" />
                                                <span className="text-sm font-bold text-p-color">Browse</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-4">
                                    <button
                                        onClick={handleNextStep}
                                        className="theme-button theme-button-primary"
                                    >
                                        Next: Commercial Info
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Commercial Info */}
                        {currentStep === 2 && (
                            <div className="theme-card p-6 space-y-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <h3 className="text-h3-size text-h3-color text-h3-font text-h3-weight">
                                        Step 2: Commercial Info
                                    </h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold mb-2 text-p-color">
                                            Product Name
                                        </label>
                                        <input
                                            type="text"
                                            name="product_name"
                                            className="theme-input w-full"
                                            placeholder="Subscription Access: Python DS"
                                            value={formData.product_name}
                                            onChange={handleInputChange}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold mb-2 text-p-color">
                                            SKU
                                        </label>
                                        <input
                                            type="text"
                                            name="sku"
                                            className="theme-input w-full uppercase"
                                            placeholder="SLT-PY-001"
                                            value={formData.sku}
                                            onChange={handleInputChange}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold mb-2 text-p-color">
                                            Price (Bs.)
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-p-color opacity-40 font-bold">
                                                Bs.
                                            </span>
                                            <input
                                                type="number"
                                                name="price"
                                                className="theme-input w-full pl-12 pr-4"
                                                step="0.01"
                                                min="0"
                                                placeholder="2500.00"
                                                value={formData.price}
                                                onChange={handleInputChange}
                                                style={{ paddingLeft: '2.5rem' }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-between pt-4">
                                    <button
                                        onClick={handlePrevStep}
                                        className="theme-button"
                                        style={{
                                            backgroundColor: 'transparent',
                                            color: 'var(--text-p-color)',
                                            border: '1px solid var(--palette-border)',
                                        }}
                                    >
                                        Back
                                    </button>
                                    <button
                                        onClick={handleNextStep}
                                        className="theme-button theme-button-primary"
                                    >
                                        Next: Review
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Review & Publish */}
                        {currentStep === 3 && (
                            <div className="theme-card p-6 space-y-6">
                                <div className="flex items-center justify-between bg-[var(--palette-surface)] p-6 rounded-xl border border-[var(--palette-border)]">
                                    <div className="flex gap-4">
                                        <div className="h-12 w-12 rounded-lg bg-[var(--palette-primary)]/10 flex items-center justify-center">
                                            <Rocket size={24} className="text-[var(--palette-primary)]" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-p-color">
                                                Step 3: Review & Publish
                                            </h3>
                                            <p className="text-xs text-p-color opacity-60">
                                                Ready to go live? Toggle the status below.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-sm font-bold text-p-color uppercase tracking-tighter">
                                            Published Status
                                        </span>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={formData.published}
                                                onChange={(e) => setFormData(prev => ({ ...prev, published: e.target.checked }))}
                                            />
                                            <div className="w-11 h-6 bg-[var(--palette-border)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--palette-primary)]"></div>
                                        </label>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="font-bold text-p-color">Summary</h4>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-p-color opacity-60">Title:</span>
                                            <p className="font-semibold text-p-color">{formData.title || '-'}</p>
                                        </div>
                                        <div>
                                            <span className="text-p-color opacity-60">Category:</span>
                                            <p className="font-semibold text-p-color">{getCategoryName()}</p>
                                        </div>
                                        <div>
                                            <span className="text-p-color opacity-60">Level:</span>
                                            <p className="font-semibold text-p-color">{getLevelName()}</p>
                                        </div>
                                        <div>
                                            <span className="text-p-color opacity-60">Duration:</span>
                                            <p className="font-semibold text-p-color">{formData.duration_hours ? `${formData.duration_hours} hrs` : '-'}</p>
                                        </div>
                                        <div>
                                            <span className="text-p-color opacity-60">Price:</span>
                                            <p className="font-semibold text-p-color">{formatPrice(formData.price)}</p>
                                        </div>
                                        <div>
                                            <span className="text-p-color opacity-60">SKU:</span>
                                            <p className="font-semibold text-p-color">{formData.sku.toUpperCase() || '-'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-between pt-4">
                                    <button
                                        onClick={handlePrevStep}
                                        className="theme-button"
                                        style={{
                                            backgroundColor: 'transparent',
                                            color: 'var(--text-p-color)',
                                            border: '1px solid var(--palette-border)',
                                        }}
                                    >
                                        Back
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="theme-button theme-button-primary"
                                    >
                                        {saving ? 'Saving...' : (formData.published ? 'Publish Course' : 'Save as Draft')}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Live Preview Section */}
                    <div className="lg:col-span-4">
                        <div className="sticky top-24">
                            <div className="flex items-center gap-2 mb-4">
                                <EyeIcon size={20} className="text-p-color opacity-40" />
                                <span className="text-xs font-black text-p-color opacity-60 uppercase tracking-widest">
                                    Live Preview
                                </span>
                            </div>

                            {/* Course Card Preview */}
                            <article className="bg-[var(--palette-surface)] rounded-xl shadow-lg overflow-hidden group">
                                <div className="relative h-48 w-full overflow-hidden bg-[var(--palette-border)]">
                                    {formData.image_url ? (
                                        <img
                                            src={formData.image_url}
                                            alt={formData.title || 'Course preview'}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = 'none';
                                            }}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-p-color opacity-40">
                                            <span className="text-sm">No image</span>
                                        </div>
                                    )}
                                    <div className="absolute top-4 left-4 flex gap-2">
                                        {formData.published && (
                                            <span className="bg-[var(--palette-primary)]/90 text-white text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest">
                                                Featured
                                            </span>
                                        )}
                                        {formData.duration_hours && (
                                            <span className="bg-black/80 text-white text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest">
                                                {formData.duration_hours}h
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="p-6">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-[var(--palette-primary)] text-[10px] font-black uppercase tracking-widest">
                                            {getCategoryName()}
                                        </span>
                                        <div className="flex items-center text-amber-400 gap-0.5">
                                            <Star size={14} fill="currentColor" />
                                            <Star size={14} fill="currentColor" />
                                            <Star size={14} fill="currentColor" />
                                            <Star size={14} fill="currentColor" />
                                            <Star size={14} />
                                            <span className="text-xs font-bold text-p-color opacity-60 ml-1">(4.8)</span>
                                        </div>
                                    </div>
                                    <h4 className="text-xl font-black text-p-color leading-tight mb-2">
                                        {formData.title || 'Course Title'}
                                    </h4>
                                    <p className="text-sm text-p-color opacity-60 line-clamp-2 mb-6 leading-relaxed">
                                        {formData.description || 'Course description will appear here...'}
                                    </p>
                                    <div className="flex items-center justify-between pt-4 border-t border-[var(--palette-border)]">
                                        <div>
                                            <p className="text-[10px] font-bold text-p-color opacity-40 uppercase">
                                                Enrollment Price
                                            </p>
                                            <p className="text-lg font-black text-p-color">
                                                {formatPrice(formData.price)}
                                            </p>
                                        </div>
                                        <span className="bg-[var(--palette-primary)]/10 text-[var(--palette-primary)] font-bold px-3 py-1 rounded-lg text-xs">
                                            {getLevelName()}
                                        </span>
                                    </div>
                                </div>
                            </article>

                            {/* Tip Card */}
                            <div className="mt-6 bg-[var(--palette-primary)] text-white p-6 rounded-xl relative overflow-hidden">
                                <div className="relative z-10">
                                    <p className="text-[10px] font-black opacity-80 uppercase tracking-widest mb-2">
                                        Editor's Tip
                                    </p>
                                    <h5 className="text-sm font-bold mb-2">Engagement Matters</h5>
                                    <p className="text-xs opacity-80 leading-relaxed">
                                        Courses with detailed descriptions and professional images see a 40% higher conversion rate.
                                    </p>
                                </div>
                                <div className="absolute -right-4 -bottom-4 opacity-10">
                                    <EyeIcon size={64} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <MessageModal
                isOpen={messageModal.isOpen}
                type={messageModal.type}
                message={messageModal.message}
                onClose={() => setMessageModal(prev => ({ ...prev, isOpen: false }))}
            />
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmModal.onConfirm || (() => {})}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmText={confirmModal.confirmText}
                type={confirmModal.type}
            />
        </>
    );
};
