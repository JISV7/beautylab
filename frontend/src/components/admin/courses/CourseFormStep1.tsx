import React, { useRef, useState } from 'react';
import axios from 'axios';
import { HelpCircle, Upload, X, CheckCircle } from 'lucide-react';
import type { Category, Level, CourseFormData } from '../types';

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

export interface CourseFormStep1Props {
    formData: CourseFormData;
    categories: Category[];
    levels: Level[];
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    onNext: () => void;
}

export const CourseFormStep1: React.FC<CourseFormStep1Props> = ({
    formData,
    categories,
    levels,
    onChange,
    onNext,
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const [uploadSuccess, setUploadSuccess] = useState(false);

    const handleBrowseClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
        if (!validTypes.includes(file.type)) {
            setUploadError('Please select a valid image file (JPG, PNG, WebP, or GIF)');
            return;
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            setUploadError('Image size must be less than 5MB');
            return;
        }

        try {
            setUploading(true);
            setUploadError('');
            setUploadSuccess(false);

            // Upload file using axios (same pattern as font upload)
            const formDataUpload = new FormData();
            formDataUpload.append('file', file);

            const response = await api.post('/products/upload-image', formDataUpload, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            const data = response.data;

            // Update the image_url in the parent form with full backend URL
            const syntheticEvent = {
                target: { name: 'image_url', value: `${API_URL}${data.url}` }
            } as React.ChangeEvent<HTMLInputElement>;
            onChange(syntheticEvent);

            setUploadSuccess(true);
            setTimeout(() => setUploadSuccess(false), 3000);

            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (error: any) {
            console.error('Upload error:', error);
            // Extract error message from axios response
            const errorMessage = error.response?.data?.detail
                ? (typeof error.response.data.detail === 'string'
                    ? error.response.data.detail
                    : JSON.stringify(error.response.data.detail))
                : error.message || 'Failed to upload image';
            setUploadError(errorMessage);
        } finally {
            setUploading(false);
        }
    };

    const handleClearImage = () => {
        const syntheticEvent = {
            target: { name: 'image_url', value: '' }
        } as React.ChangeEvent<HTMLInputElement>;
        onChange(syntheticEvent);
        setUploadError('');
        setUploadSuccess(false);
    };
    return (
        <div className="theme-card p-6 space-y-6">
            <div className="flex items-center gap-2 mb-4">
                <h3 className="text-h3 text-h3 text-h3">
                    Step 1: Course Info
                </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                    <label className="block text-sm font-bold mb-2 text-paragraph">
                        Course Title
                    </label>
                    <input
                        type="text"
                        name="title"
                        className="theme-input w-full"
                        placeholder="e.g. Python for Data Science"
                        value={formData.title}
                        onChange={onChange}
                    />
                </div>

                <div className="md:col-span-2">
                    <label className="block text-sm font-bold mb-2 text-paragraph">
                        Slug
                    </label>
                    <div className="flex">
                        <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-[var(--palette-border)] bg-[var(--palette-surface)] text-paragraph opacity-60 text-xs">
                            beautylab.com/c/
                        </span>
                        <input
                            type="text"
                            name="slug"
                            className="theme-input rounded-l-none flex-1"
                            placeholder="python-ds-101"
                            value={formData.slug}
                            onChange={onChange}
                        />
                    </div>
                </div>

                <div className="md:col-span-2">
                    <label className="block text-sm font-bold mb-2 text-paragraph">
                        Category Selection
                    </label>
                    <select
                        name="category_id"
                        className="theme-input w-full"
                        value={formData.category_id}
                        onChange={onChange}
                    >
                        <option value="">Select a category</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>
                </div>

                <div className="md:col-span-2">
                    <label className="block text-sm font-bold mb-2 text-paragraph">
                        Level Selection
                    </label>
                    <select
                        name="level_id"
                        className="theme-input w-full"
                        value={formData.level_id}
                        onChange={onChange}
                    >
                        <option value="">Select a level</option>
                        {levels.map(level => (
                            <option key={level.id} value={level.id}>{level.name}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-bold mb-2 text-paragraph">
                        Duration (Hours)
                    </label>
                    <div className="relative">
                        <input
                            type="number"
                            name="duration_hours"
                            className="theme-input w-full pl-4 pr-10"
                            value={formData.duration_hours}
                            onChange={onChange}
                            placeholder="40"
                            min="0"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-paragraph opacity-40 text-xs font-bold">
                            hrs
                        </span>
                    </div>
                </div>

                <div className="md:col-span-2">
                    <label className="block text-sm font-bold mb-2 text-paragraph">
                        Description
                    </label>
                    <textarea
                        name="description"
                        className="theme-input w-full min-h-[120px]"
                        placeholder="Briefly describe what students will learn..."
                        value={formData.description}
                        onChange={onChange}
                    />
                </div>

                <div className="md:col-span-2">
                    <label className="block text-sm font-bold mb-2 text-paragraph">
                        Course Image
                    </label>
                    <div className="space-y-3">
                        <div className="flex gap-3">
                            <input
                                type="url"
                                name="image_url"
                                className="theme-input flex-1"
                                placeholder="https://cdn.beautylab.com/images/... or upload below"
                                value={formData.image_url}
                                onChange={onChange}
                            />
                            <button
                                type="button"
                                onClick={handleBrowseClick}
                                disabled={uploading}
                                className="px-4 border border-[var(--palette-border)] rounded-lg hover:bg-[var(--palette-surface)] transition-colors flex items-center gap-2 disabled:opacity-50"
                            >
                                <Upload size={18} className="text-paragraph opacity-60" />
                                <span className="text-sm font-bold text-paragraph">
                                    {uploading ? 'Uploading...' : 'Browse'}
                                </span>
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                                className="hidden"
                                disabled={uploading}
                            />
                        </div>

                        {/* Upload status messages */}
                        {uploadError && (
                            <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                                <X size={16} />
                                {uploadError}
                            </p>
                        )}
                        {uploadSuccess && (
                            <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
                                <CheckCircle size={16} />
                                Image uploaded successfully!
                            </p>
                        )}

                        {/* Image preview */}
                        {formData.image_url && (
                            <div className="relative mt-3">
                                <img
                                    src={formData.image_url}
                                    alt="Course preview"
                                    className="w-full max-w-md h-48 object-cover rounded-lg border border-[var(--palette-border)]"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={handleClearImage}
                                    className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                                    title="Remove image"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
                <button
                    onClick={onNext}
                    className="theme-button theme-button-primary"
                >
                    Next: Commercial Info
                </button>
            </div>
        </div>
    );
};
