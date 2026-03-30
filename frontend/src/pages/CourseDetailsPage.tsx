import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CourseHero, LicenseTable, GiftLicenseModal, type License } from '../components/course';
import { ArrowLeft } from 'lucide-react';

const API_URL = 'http://localhost:8000';

interface CourseDetailsPageProps {
    courseId: string;
    onBack?: () => void;
}

interface CourseDetails {
    id: string;
    title: string;
    slug: string;
    description: string | null;
    image_url: string | null;
    duration_hours: number | null;
    level_name: string | null;
    category_name: string | null;
    product_price: string | null;
    video_url: string | null;
    user_licenses: License[];
}

export const CourseDetailsPage: React.FC<CourseDetailsPageProps> = ({ courseId, onBack }) => {
    const [course, setCourse] = useState<CourseDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [giftModalOpen, setGiftModalOpen] = useState(false);
    const [selectedLicenseId, setSelectedLicenseId] = useState<string | null>(null);

    const fetchCourseDetails = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const token = localStorage.getItem('access_token');
            const response = await axios.get(`${API_URL}/catalog/courses/${courseId}/details`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            setCourse(response.data);
        } catch (err: any) {
            console.error('Failed to fetch course details:', err);
            setError(err.response?.data?.detail || 'Failed to load course details');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCourseDetails();
    }, [courseId]);

    const handleBuy = () => {
        // TODO: Implement purchase flow
        alert('Purchase functionality coming soon!');
    };

    const handleGift = (licenseId: string) => {
        setSelectedLicenseId(licenseId);
        setGiftModalOpen(true);
    };

    const handleGiftConfirm = async (email: string, message?: string) => {
        try {
            const token = localStorage.getItem('access_token');
            await axios.post(
                `${API_URL}/licenses/${selectedLicenseId}/gift`,
                { email, message },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            setGiftModalOpen(false);
            setSelectedLicenseId(null);
            fetchCourseDetails(); // Refresh licenses
        } catch (err: any) {
            console.error('Failed to gift license:', err);
            alert(err.response?.data?.detail || 'Failed to gift license');
        }
    };

    if (isLoading) {
        return (
            <div className="p-6">
                <div className="palette-surface palette-border border rounded-xl p-8 text-center">
                    <p className="text-p-font text-p-size text-p-color">Loading course details...</p>
                </div>
            </div>
        );
    }

    if (error || !course) {
        return (
            <div className="p-6">
                <div className="palette-surface palette-border border rounded-xl p-8 text-center">
                    <p className="text-red-600 dark:text-red-400 mb-4">{error || 'Course not found'}</p>
                    <button
                        onClick={onBack}
                        className="theme-button theme-button-secondary"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Back Button */}
            {onBack && (
                <button
                    onClick={onBack}
                    className="inline-flex items-center gap-2 text-p-font text-p-color hover:opacity-60 transition-opacity mb-6"
                >
                    <ArrowLeft size={18} />
                    Back to Explore
                </button>
            )}

            {/* Course Hero Section */}
            <CourseHero
                title={course.title}
                description={course.description}
                image_url={course.image_url}
                duration_hours={course.duration_hours}
                level_name={course.level_name}
                category_name={course.category_name}
                price={course.product_price}
                video_url={course.video_url}
                onBuy={handleBuy}
            />

            {/* Licenses Section */}
            <div className="mb-8">
                <h2 className="text-h3-font text-h3-size text-h3-color mb-4">
                    Your Licenses
                </h2>
                <LicenseTable
                    licenses={course.user_licenses}
                    onGift={handleGift}
                />
            </div>

            {/* Gift License Modal */}
            <GiftLicenseModal
                isOpen={giftModalOpen}
                onClose={() => {
                    setGiftModalOpen(false);
                    setSelectedLicenseId(null);
                }}
                onConfirm={handleGiftConfirm}
                licenseCode={selectedLicenseId || undefined}
            />
        </div>
    );
};
