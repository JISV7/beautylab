import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Save } from 'lucide-react';
import type { Course, Category, Level, CourseFormData } from './types';
import { MessageModal } from './MessageModal';
import { ConfirmModal } from './ConfirmModal';
import { CourseStepper } from './courses/CourseStepper';
import { CourseFormStep1 } from './courses/CourseFormStep1';
import { CourseFormStep2 } from './courses/CourseFormStep2';
import { CourseFormStep3 } from './courses/CourseFormStep3';
import { CoursePreviewCard } from './courses/CoursePreviewCard';

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
    tax_type: 'gravado',
};

export const CourseManagement: React.FC<CourseManagementProps> = ({ courseId, onBack }) => {
    const [formData, setFormData] = useState<CourseFormData>(emptyFormData);
    const [categories, setCategories] = useState<Category[]>([]);
    const [levels, setLevels] = useState<Level[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [existingProductId, setExistingProductId] = useState<string | null>(null);

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
                    api.get('/catalog/categories'),
                    api.get('/catalog/levels'),
                ]);

                setCategories(categoriesRes.data.categories || []);
                setLevels(levelsRes.data.levels || []);

                if (courseId) {
                    const courseRes = await api.get(`/catalog/courses/${courseId}`);
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
                        sku: course.product_sku || '', // Pre-fill existing SKU for updates
                        price: course.product_price?.toString() || '',
                        tax_rate: '16.00',
                        tax_type: 'gravado',
                    });

                    // Store existing product ID for updates
                    setExistingProductId(course.product_id || null);
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
            setFormData((prev: CourseFormData) => ({ ...prev, slug }));
        }
    }, [formData.title, courseId]);

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value, type } = e.target;
        setFormData((prev: CourseFormData) => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) || '' : value,
        }));
    };

    const handleFormDataChange = (field: keyof CourseFormData, value: any) => {
        setFormData((prev: CourseFormData) => ({ ...prev, [field]: value }));
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

            const productData = {
                name: formData.product_name,
                description: formData.description,
                sku: formData.sku.toUpperCase(),
                price: parseFloat(formData.price),
                tax_rate: 16.00,
                tax_type: 'gravado',
                is_active: true,
            };

            let productId: string;

            if (courseId && existingProductId) {
                // Update existing product
                const productRes = await api.put(`/products/${existingProductId}`, productData);
                productId = productRes.data.id;

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

                await api.put(`/catalog/courses/${courseId}`, courseData);
            } else {
                // Create new product and course
                const productRes = await api.post('/products', productData);
                productId = productRes.data.id;

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

                await api.post('/catalog/courses', courseData);
            }

            setMessageModal({
                isOpen: true,
                type: 'success',
                message: courseId ? 'Course updated successfully!' : 'Course created successfully!',
            });

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
                <CourseStepper currentStep={currentStep} />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Form Section */}
                    <div className="lg:col-span-8 space-y-6">
                        {currentStep === 1 && (
                            <CourseFormStep1
                                formData={formData}
                                categories={categories}
                                levels={levels}
                                onChange={handleInputChange}
                                onNext={handleNextStep}
                            />
                        )}
                        {currentStep === 2 && (
                            <CourseFormStep2
                                formData={formData}
                                onChange={handleInputChange}
                                onBack={handlePrevStep}
                                onNext={handleNextStep}
                            />
                        )}
                        {currentStep === 3 && (
                            <CourseFormStep3
                                formData={formData}
                                categoryName={getCategoryName()}
                                levelName={getLevelName()}
                                onBack={handlePrevStep}
                                onSave={handleSave}
                                saving={saving}
                                onFormDataChange={handleFormDataChange}
                            />
                        )}
                    </div>

                    {/* Live Preview Section */}
                    <div className="lg:col-span-4">
                        <CoursePreviewCard
                            formData={formData}
                            categoryName={getCategoryName()}
                            levelName={getLevelName()}
                        />
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
                onConfirm={confirmModal.onConfirm || (() => { })}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmText={confirmModal.confirmText}
                type={confirmModal.type}
            />
        </>
    );
};
