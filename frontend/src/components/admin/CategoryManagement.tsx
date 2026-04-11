import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import type { Category } from './types';
import { MessageModal } from './MessageModal';
import { ConfirmModal } from './ConfirmModal';
import { Modal } from './Modal';

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

interface CategoryFormData {
    name: string;
    slug: string;
    description: string;
    parent_id: string;
    order: string;
}

const emptyFormData: CategoryFormData = {
    name: '',
    slug: '',
    description: '',
    parent_id: '',
    order: '0',
};

export const CategoryManagement: React.FC = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

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

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [formData, setFormData] = useState<CategoryFormData>(emptyFormData);
    const [descriptionModal, setDescriptionModal] = useState<{
        isOpen: boolean;
        title: string;
        content: string;
    }>({ isOpen: false, title: '', content: '' });

    // Fetch categories
    const fetchCategories = async () => {
        try {
            setLoading(true);
            const response = await api.get('/catalog/categories');
            setCategories(response.data.categories || []);
        } catch (error: any) {
            console.error('Failed to fetch categories:', error);
            setMessageModal({
                isOpen: true,
                type: 'error',
                message: error.response?.data?.detail || 'Failed to load categories.',
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    // Filter categories based on search query
    const filteredCategories = categories.filter(category =>
        category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        category.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (category.description && category.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // Auto-generate slug from name
    useEffect(() => {
        if (formData.name && !editingCategory) {
            const slug = formData.name
                .toLowerCase()
                .trim()
                .replace(/[^a-z0-9\s-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-')
                .replace(/^-|-$/g, '')
                .slice(0, 120);
            setFormData(prev => ({ ...prev, slug }));
        }
    }, [formData.name, editingCategory]);

    // Open modal for creating
    const handleOpenCreate = () => {
        setEditingCategory(null);
        setFormData(emptyFormData);
        setIsModalOpen(true);
    };

    // Open modal for editing
    const handleOpenEdit = (category: Category) => {
        setEditingCategory(category);
        setFormData({
            name: category.name,
            slug: category.slug,
            description: category.description || '',
            parent_id: category.parent_id?.toString() || '',
            order: category.order.toString(),
        });
        setIsModalOpen(true);
    };

    const handleViewDescription = (category: Category) => {
        if (!category.description) return;
        setDescriptionModal({
            isOpen: true,
            title: category.name,
            content: category.description,
        });
    };

    // Handle input change
    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Save category
    const handleSave = async () => {
        if (!formData.name.trim()) {
            setMessageModal({ isOpen: true, type: 'error', message: 'Category name is required.' });
            return;
        }

        try {
            setSaving(true);

            // Always regenerate slug from name when creating (not editing)
            // This ensures the slug is always valid
            const slug = !editingCategory
                ? formData.name
                    .toLowerCase()
                    .trim()
                    .replace(/[^a-z0-9]+/g, '-')  // Replace ANY non-alphanumeric with hyphen
                    .replace(/-+/g, '-')           // Collapse multiple hyphens
                    .replace(/^-|-$/g, '')         // Remove leading/trailing hyphens
                    .slice(0, 120)
                : (formData.slug?.trim() || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'));

            console.log('Sending category:', { name: formData.name, slug: slug });

            const categoryData = {
                name: formData.name,
                slug: slug,
                description: formData.description || null,
                parent_id: formData.parent_id && formData.parent_id.trim() !== '' ? parseInt(formData.parent_id) : null,
                order: parseInt(formData.order) || 0,
            };

            if (editingCategory) {
                await api.put(`/catalog/categories/${editingCategory.id}`, categoryData);
                setMessageModal({
                    isOpen: true,
                    type: 'success',
                    message: 'Category updated successfully!',
                });
            } else {
                await api.post('/catalog/categories', categoryData);
                setMessageModal({
                    isOpen: true,
                    type: 'success',
                    message: 'Category created successfully!',
                });
            }

            setIsModalOpen(false);
            fetchCategories();
        } catch (error: any) {
            console.error('Failed to save category:', error);

            // Extract error message from validation errors
            let errorMessage = 'Failed to save category.';
            const detail = error.response?.data?.detail;
            if (detail) {
                if (Array.isArray(detail)) {
                    // Pydantic validation errors array
                    errorMessage = detail
                        .map((err: any) => `${err.loc?.join('.')}: ${err.msg}`)
                        .join('; ');
                } else if (typeof detail === 'string') {
                    errorMessage = detail;
                } else if (typeof detail === 'object') {
                    errorMessage = JSON.stringify(detail);
                }
            }

            setMessageModal({
                isOpen: true,
                type: 'error',
                message: errorMessage,
            });
        } finally {
            setSaving(false);
        }
    };

    // Delete category
    const handleDelete = (category: Category) => {
        setConfirmModal({
            isOpen: true,
            type: 'danger',
            title: 'Delete Category',
            message: (
                <>
                    Are you sure you want to delete <strong>"{category.name}"</strong>?
                    <br />
                    <span className="text-red-600 dark:text-red-400 mt-2 block">
                        This action cannot be undone.
                    </span>
                </>
            ),
            confirmText: 'Delete',
            onConfirm: () => deleteCategory(category.id),
        });
    };

    const deleteCategory = async (categoryId: number) => {
        try {
            await api.delete(`/catalog/categories/${categoryId}`);
            setMessageModal({
                isOpen: true,
                type: 'success',
                message: 'Category deleted successfully!',
            });
            fetchCategories();
        } catch (error: any) {
            console.error('Failed to delete category:', error);
            setMessageModal({
                isOpen: true,
                type: 'error',
                message: error.response?.data?.detail || 'Failed to delete category.',
            });
        }
    };

    // Get parent category name
    const getParentCategoryName = (parentId?: number) => {
        if (!parentId) return '-';
        const parent = categories.find(c => c.id === parentId);
        return parent?.name || '-';
    };

    return (
        <>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h1 className="text-h1 font-bold mb-1">
                            Category Management
                        </h1>
                        <p className="text-paragraph">
                            Create, edit, and organize your course categories.
                        </p>
                    </div>
                    <button
                        onClick={handleOpenCreate}
                        className="theme-button theme-button-primary"
                    >
                        <Plus size={20} />
                        Create Category
                    </button>
                </div>

                {/* Search Bar */}
                <div className="p-4 border-b border-[var(--palette-border)] flex items-center gap-3">
                    <div className="flex-1">
                        <div className="flex items-center palette-surface palette-border border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-palette-primary">
                            <Search className="w-4 h-4 text-paragraph flex-shrink-0 ml-3" />
                            <input
                                type="text"
                                placeholder="Search categories by name, slug, or description..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="flex-1 min-w-0 py-2 pl-2 pr-4 bg-transparent text-paragraph placeholder:text-paragraph placeholder:opacity-60 focus:outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="theme-card overflow-hidden p-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--palette-primary)]"></div>
                        </div>
                    ) : filteredCategories.length === 0 ? (
                        <div className="text-center py-12 text-paragraph">
                            {searchQuery ? (
                                <p>No categories found matching "{searchQuery}".</p>
                            ) : (
                                <>
                                    <p>No categories found.</p>
                                    <p className="text-sm mt-2">Create your first category to get started!</p>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-[var(--palette-surface)] border-b border-[var(--palette-border)]">
                                    <tr>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-paragraph">Name</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-paragraph">Slug</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-paragraph">Description</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-paragraph">Parent</th>
                                        <th className="text-right py-3 px-4 text-sm font-semibold text-paragraph">Order</th>
                                        <th className="text-right py-3 px-4 text-sm font-semibold text-paragraph">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredCategories.map((category) => (
                                        <tr
                                            key={category.id}
                                            className="border-b border-[var(--palette-border)] hover:bg-[var(--palette-surface)] transition-colors group"
                                        >
                                            <td className="py-3 px-4">
                                                <span className="font-semibold text-paragraph">
                                                    {category.name}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className="text-sm text-paragraph font-mono">
                                                    {category.slug}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 max-w-xs">
                                                {category.description ? (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm text-paragraph line-clamp-2">
                                                            {category.description.length > 100
                                                                ? `${category.description.substring(0, 100)}...`
                                                                : category.description
                                                            }
                                                        </span>
                                                        {category.description.length > 100 && (
                                                            <button
                                                                onClick={() => handleViewDescription(category)}
                                                                className="text-xs text-[var(--palette-primary)] hover:underline whitespace-nowrap font-medium"
                                                            >
                                                                Read more
                                                            </button>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-paragraph">-</span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className="text-sm text-paragraph">
                                                    {getParentCategoryName(category.parent_id)}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <span className="text-sm text-paragraph">
                                                    {category.order}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleOpenEdit(category)}
                                                        className="p-2 hover:bg-[var(--palette-border)] rounded transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit size={18} className="text-paragraph" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(category)}
                                                        className="p-2 hover:bg-red-100 dark:hover:bg-red-900 rounded transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={18} className="text-red-600 dark:text-red-400" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Create/Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingCategory ? 'Edit Category' : 'Create Category'}
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold mb-2 text-paragraph">
                            Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="name"
                            className="theme-input w-full"
                            placeholder="e.g., Machine Learning"
                            value={formData.name}
                            onChange={handleInputChange}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-2 text-paragraph">
                            Slug <span className="text-paragraph opacity-60">(auto-generated)</span>
                        </label>
                        <input
                            type="text"
                            name="slug"
                            className="theme-input w-full"
                            placeholder="e.g., machine-learning"
                            value={formData.slug}
                            onChange={handleInputChange}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-2 text-paragraph">
                            Description
                        </label>
                        <textarea
                            name="description"
                            className="theme-input w-full"
                            rows={3}
                            placeholder="Brief description of this category..."
                            value={formData.description}
                            onChange={handleInputChange}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold mb-2 text-paragraph">
                                Parent Category
                            </label>
                            <select
                                name="parent_id"
                                className="theme-input w-full"
                                value={formData.parent_id}
                                onChange={handleInputChange}
                            >
                                <option value="">None (Root Category)</option>
                                {categories
                                    .filter(c => !editingCategory || c.id !== editingCategory.id)
                                    .map(cat => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </option>
                                    ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold mb-2 text-paragraph">
                                Order
                            </label>
                            <input
                                type="number"
                                name="order"
                                className="theme-input w-full"
                                min="0"
                                value={formData.order}
                                onChange={handleInputChange}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="theme-button"
                            style={{
                                backgroundColor: 'transparent',
                                color: 'var(--text-paragraph)',
                                border: '1px solid var(--palette-border)',
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={saving}
                            className="theme-button theme-button-primary"
                        >
                            {saving ? 'Saving...' : (editingCategory ? 'Update' : 'Create')}
                        </button>
                    </div>
                </div>
            </Modal>

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

            {/* Description Modal */}
            {descriptionModal.isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    onClick={() => setDescriptionModal(prev => ({ ...prev, isOpen: false }))}
                >
                    <div
                        className="w-full max-w-lg relative max-h-[80vh] flex flex-col bg-[var(--palette-surface)] border border-[var(--palette-border)] rounded-2xl shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-[var(--palette-border)] flex items-center justify-between">
                            <h3 className="text-xl font-bold text-[var(--text-h2)]">
                                {descriptionModal.title}
                            </h3>
                            <button
                                onClick={() => setDescriptionModal(prev => ({ ...prev, isOpen: false }))}
                                className="text-[var(--text-paragraph)] hover:text-primary transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 overflow-y-auto flex-1">
                            <p className="text-[var(--text-paragraph)] whitespace-pre-wrap leading-relaxed">
                                {descriptionModal.content}
                            </p>
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-[var(--palette-border)]">
                            <button
                                onClick={() => setDescriptionModal(prev => ({ ...prev, isOpen: false }))}
                                className="w-full px-4 py-2 rounded-lg font-semibold transition-colors"
                                style={{
                                    backgroundColor: 'var(--palette-primary)',
                                    color: 'var(--decorator-color)',
                                }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
