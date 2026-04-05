import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit, Trash2, Search, Tag, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Coupon, CouponFormData } from './types';
import { MessageModal } from './MessageModal';
import { ConfirmModal } from './ConfirmModal';
import { Modal } from './Modal';

const API_URL = 'http://localhost:8000';

const getAuthToken = (): string | null => {
    return localStorage.getItem('access_token');
};

const api = axios.create({
    baseURL: API_URL,
    headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
    const token = getAuthToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

const emptyFormData: CouponFormData = {
    code: '',
    discount_type: 'percentage',
    discount_value: '',
    min_purchase: '0',
    max_uses: '',
    expires_at: '',
    is_active: true,
};

export const CouponManagement: React.FC = () => {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterActive, setFilterActive] = useState<string>('all');

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(10);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

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
    }>({ isOpen: false, type: 'primary', title: '', message: '', confirmText: 'Confirm', onConfirm: null });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
    const [formData, setFormData] = useState<CouponFormData>(emptyFormData);

    const fetchCoupons = async () => {
        try {
            setLoading(true);
            const params: Record<string, string | number> = { page: currentPage, page_size: pageSize };
            if (filterActive !== 'all') params.is_active = filterActive === 'active' ? 'true' : 'false';

            const response = await api.get('/coupons/', { params });
            setCoupons(response.data.coupons);
            setTotalItems(response.data.total);
            setTotalPages(response.data.total_pages);
        } catch (error) {
            console.error('Failed to fetch coupons:', error);
            setMessageModal({ isOpen: true, type: 'error', message: 'Failed to load coupons.' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCoupons();
    }, [currentPage, filterActive]);

    const filteredCoupons = coupons.filter((c) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return c.code.toLowerCase().includes(q);
    });

    const handleOpenCreate = () => {
        setEditingCoupon(null);
        setFormData(emptyFormData);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (coupon: Coupon) => {
        setEditingCoupon(coupon);
        setFormData({
            code: coupon.code,
            discount_type: coupon.discount_type,
            discount_value: coupon.discount_value.toString(),
            min_purchase: coupon.min_purchase.toString(),
            max_uses: coupon.max_uses?.toString() ?? '',
            expires_at: coupon.expires_at ? coupon.expires_at.split('T')[0] : '',
            is_active: coupon.is_active,
        });
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!formData.code.trim()) {
            setMessageModal({ isOpen: true, type: 'error', message: 'Code is required.' });
            return;
        }
        if (!formData.discount_value || parseFloat(formData.discount_value) <= 0) {
            setMessageModal({ isOpen: true, type: 'error', message: 'Discount value must be greater than 0.' });
            return;
        }

        const payload = {
            code: formData.code.toUpperCase().replace(/[^A-Z0-9_-]/g, ''),
            discount_type: formData.discount_type,
            discount_value: parseFloat(formData.discount_value),
            min_purchase: parseFloat(formData.min_purchase) || 0,
            max_uses: formData.max_uses ? parseInt(formData.max_uses, 10) : null,
            expires_at: formData.expires_at || null,
            is_active: formData.is_active,
        };

        try {
            setSaving(true);
            if (editingCoupon) {
                // Update: only send editable fields
                const updatePayload = {
                    discount_value: payload.discount_value,
                    min_purchase: payload.min_purchase,
                    max_uses: payload.max_uses,
                    expires_at: payload.expires_at,
                    is_active: payload.is_active,
                };
                await api.put(`/coupons/${editingCoupon.id}`, updatePayload);
                setMessageModal({ isOpen: true, type: 'success', message: 'Coupon updated successfully!' });
            } else {
                await api.post('/coupons/', payload);
                setMessageModal({ isOpen: true, type: 'success', message: 'Coupon created successfully!' });
            }
            setIsModalOpen(false);
            fetchCoupons();
        } catch (error: any) {
            const detail = error?.response?.data?.detail;
            const msg = typeof detail === 'string' ? detail : 'Failed to save coupon.';
            setMessageModal({ isOpen: true, type: 'error', message: msg });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (coupon: Coupon) => {
        setConfirmModal({
            isOpen: true,
            type: 'danger',
            title: 'Deactivate Coupon',
            message: (
                <>
                    Are you sure you want to deactivate <strong>"{coupon.code}"</strong>?
                    <br />
                    <span className="text-red-600 dark:text-red-400 mt-2 block">
                        This will prevent future use but won&apos;t affect existing discounts on past invoices.
                    </span>
                </>
            ),
            confirmText: 'Deactivate',
            onConfirm: () => deleteCouponAction(coupon.id),
        });
    };

    const deleteCouponAction = async (id: string) => {
        try {
            await api.delete(`/coupons/${id}`);
            setMessageModal({ isOpen: true, type: 'success', message: 'Coupon deactivated successfully!' });
            fetchCoupons();
        } catch (error) {
            setMessageModal({ isOpen: true, type: 'error', message: 'Failed to deactivate coupon.' });
        }
    };

    const formatDiscount = (coupon: Coupon) => {
        if (coupon.discount_type === 'percentage') return `${coupon.discount_value}%`;
        return `Bs. ${coupon.discount_value.toLocaleString('es-VE', { minimumFractionDigits: 2 })}`;
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('es-VE');
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-h1-size font-bold mb-1">Coupons</h1>
                <p className="text-p-font text-p-size text-p-color">
                    Create and manage discount codes. Each code can be used once per user.
                </p>
            </div>

            {/* Filters and Actions */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full sm:w-auto">
                    {/* Search */}
                    <div className="relative flex-1 sm:flex-none sm:min-w-[250px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-p-color opacity-50" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by code..."
                            className="theme-input w-full pl-9"
                        />
                    </div>

                    {/* Active filter */}
                    <select
                        value={filterActive}
                        onChange={(e) => {
                            setFilterActive(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="theme-input"
                    >
                        <option value="all">All</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>

                <button onClick={handleOpenCreate} className="theme-button theme-button-primary flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Create Coupon
                </button>
            </div>

            {/* Table */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--palette-primary)]"></div>
                </div>
            ) : filteredCoupons.length === 0 ? (
                <div className="text-center py-12 text-p-color">
                    <Tag className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p>No coupons found.</p>
                    <p className="text-sm mt-2 opacity-60">
                        {searchQuery ? 'Try a different search term.' : 'Create your first coupon to get started!'}
                    </p>
                </div>
            ) : (
                <div className="theme-card overflow-hidden p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-[var(--palette-surface)] border-b border-[var(--palette-border)]">
                                <tr>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-p-color">Code</th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-p-color">Discount</th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-p-color">Min Purchase</th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-p-color">Uses</th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-p-color">Expires</th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-p-color">Created</th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-p-color">Status</th>
                                    <th className="text-right py-3 px-4 text-sm font-semibold text-p-color">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCoupons.map((coupon) => (
                                    <tr
                                        key={coupon.id}
                                        className="border-b border-[var(--palette-border)] hover:bg-[var(--palette-surface)] transition-colors group"
                                    >
                                        <td className="py-3 px-4">
                                            <span className="font-mono text-sm font-semibold text-p-color">
                                                {coupon.code}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className={`text-sm font-bold ${coupon.discount_type === 'percentage' ? 'text-[var(--palette-primary)]' : 'text-green-600'}`}>
                                                {formatDiscount(coupon)}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-sm text-p-color">
                                            {coupon.min_purchase > 0
                                                ? `Bs. ${coupon.min_purchase.toLocaleString('es-VE', { minimumFractionDigits: 2 })}`
                                                : '—'}
                                        </td>
                                        <td className="py-3 px-4 text-sm text-p-color">
                                            {coupon.used_count}
                                            {coupon.max_uses ? ` / ${coupon.max_uses}` : ''}
                                        </td>
                                        <td className="py-3 px-4 text-sm text-p-color">
                                            {formatDate(coupon.expires_at)}
                                        </td>
                                        <td className="py-3 px-4 text-sm text-p-color">
                                            {formatDate(coupon.created_at)}
                                        </td>
                                        <td className="py-3 px-4">
                                            <span
                                                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${coupon.is_active
                                                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                                                    }`}
                                            >
                                                {coupon.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleOpenEdit(coupon)}
                                                    className="p-2 hover:bg-[var(--palette-border)] rounded transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit className="w-4 h-4 text-p-color" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(coupon)}
                                                    className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                                                    title="Deactivate"
                                                >
                                                    <Trash2 className="w-4 h-4 text-red-500" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--palette-border)]">
                            <p className="text-sm text-p-color opacity-60">
                                Showing {filteredCoupons.length} of {totalItems} coupons
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="p-2 rounded hover:bg-[var(--palette-border)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronLeft className="w-4 h-4 text-p-color" />
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={`w-8 h-8 rounded text-sm font-medium transition-colors ${currentPage === page
                                                ? 'bg-[var(--palette-primary)] text-white'
                                                : 'hover:bg-[var(--palette-border)] text-p-color'
                                            }`}
                                    >
                                        {page}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="p-2 rounded hover:bg-[var(--palette-border)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronRight className="w-4 h-4 text-p-color" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Create/Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingCoupon ? 'Edit Coupon' : 'Create Coupon'}
            >
                <div className="space-y-4">
                    {/* Code */}
                    <div>
                        <label className="text-p-font text-p-size text-p-color font-medium block mb-1">
                            Code {editingCoupon && <span className="opacity-50">(read-only)</span>}
                        </label>
                        <input
                            type="text"
                            value={formData.code}
                            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '') })}
                            disabled={!!editingCoupon}
                            className="theme-input w-full"
                            placeholder="e.g., WELCOME10"
                        />
                    </div>

                    {/* Discount Type */}
                    <div>
                        <label className="text-p-font text-p-size text-p-color font-medium block mb-1">
                            Discount Type {editingCoupon && <span className="opacity-50">(read-only)</span>}
                        </label>
                        <select
                            value={formData.discount_type}
                            onChange={(e) => setFormData({ ...formData, discount_type: e.target.value as 'percentage' | 'fixed' })}
                            disabled={!!editingCoupon}
                            className="theme-input w-full"
                        >
                            <option value="percentage">Percentage (%)</option>
                            <option value="fixed">Fixed Amount (Bs.)</option>
                        </select>
                    </div>

                    {/* Discount Value */}
                    <div>
                        <label className="text-p-font text-p-size text-p-color font-medium block mb-1">
                            Discount Value
                        </label>
                        <input
                            type="number"
                            value={formData.discount_value}
                            onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                            className="theme-input w-full"
                            placeholder={formData.discount_type === 'percentage' ? '10' : '500'}
                            min="0"
                            step="0.01"
                        />
                    </div>

                    {/* Min Purchase */}
                    <div>
                        <label className="text-p-font text-p-size text-p-color font-medium block mb-1">
                            Minimum Purchase (Bs.)
                        </label>
                        <input
                            type="number"
                            value={formData.min_purchase}
                            onChange={(e) => setFormData({ ...formData, min_purchase: e.target.value })}
                            className="theme-input w-full"
                            placeholder="0"
                            min="0"
                            step="0.01"
                        />
                    </div>

                    {/* Max Uses */}
                    <div>
                        <label className="text-p-font text-p-size text-p-color font-medium block mb-1">
                            Max Total Uses <span className="opacity-50">(leave empty for unlimited)</span>
                        </label>
                        <input
                            type="number"
                            value={formData.max_uses}
                            onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                            className="theme-input w-full"
                            placeholder="e.g., 100"
                            min="1"
                        />
                    </div>

                    {/* Expires At */}
                    <div>
                        <label className="text-p-font text-p-size text-p-color font-medium block mb-1">
                            Expiration Date <span className="opacity-50">(leave empty for no expiry)</span>
                        </label>
                        <input
                            type="date"
                            value={formData.expires_at}
                            onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                            className="theme-input w-full"
                        />
                    </div>

                    {/* Is Active */}
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="coupon-active"
                            checked={formData.is_active}
                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                            className="w-4 h-4 rounded"
                        />
                        <label htmlFor="coupon-active" className="text-p-font text-p-size text-p-color font-medium">
                            Active
                        </label>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4">
                        <button onClick={() => setIsModalOpen(false)} className="theme-button theme-button-secondary">
                            Cancel
                        </button>
                        <button onClick={handleSave} disabled={saving} className="theme-button theme-button-primary">
                            {saving ? 'Saving...' : editingCoupon ? 'Update' : 'Create'}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Notification Modals */}
            <MessageModal
                isOpen={messageModal.isOpen}
                type={messageModal.type}
                message={messageModal.message}
                onClose={() => setMessageModal((prev) => ({ ...prev, isOpen: false }))}
            />
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
                onConfirm={confirmModal.onConfirm || (() => { })}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmText={confirmModal.confirmText}
                type={confirmModal.type}
            />
        </div>
    );
};
