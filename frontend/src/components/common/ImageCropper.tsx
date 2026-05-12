import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { useTheme } from '../../contexts/ThemeContext';

interface ImageCropperProps {
    image: string;
    aspectRatio: number;
    onCropComplete: (croppedImage: Blob) => void;
    onCancel: () => void;
}

interface Area {
    width: number;
    height: number;
    x: number;
    y: number;
}

export const ImageCropper: React.FC<ImageCropperProps> = ({
    image,
    aspectRatio,
    onCropComplete,
    onCancel
}) => {
    const { activeTheme, currentMode } = useTheme();
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

    const primaryColor = activeTheme?.config[currentMode]?.colors.primary || '#000';

    const onCropChange = (crop: { x: number; y: number }) => {
        setCrop(crop);
    };

    const onZoomChange = (zoom: number) => {
        setZoom(zoom);
    };

    const onCropCompleteInternal = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const createImage = (url: string): Promise<HTMLImageElement> =>
        new Promise((resolve, reject) => {
            const image = new Image();
            image.addEventListener('load', () => resolve(image));
            image.addEventListener('error', (error) => reject(error));
            image.setAttribute('crossOrigin', 'anonymous');
            image.src = url;
        });

    const getCroppedImg = async () => {
        try {
            const img = await createImage(image);
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            if (!ctx || !croppedAreaPixels) return;

            canvas.width = croppedAreaPixels.width;
            canvas.height = croppedAreaPixels.height;

            ctx.drawImage(
                img,
                croppedAreaPixels.x,
                croppedAreaPixels.y,
                croppedAreaPixels.width,
                croppedAreaPixels.height,
                0,
                0,
                croppedAreaPixels.width,
                croppedAreaPixels.height
            );

            return new Promise<Blob>((resolve) => {
                canvas.toBlob((blob) => {
                    if (blob) resolve(blob);
                }, 'image/jpeg');
            });
        } catch (e) {
            console.error(e);
        }
    };

    const handleConfirm = async () => {
        const croppedBlob = await getCroppedImg();
        if (croppedBlob) {
            onCropComplete(croppedBlob);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 flex flex-col items-center justify-center p-4">
            <div className="relative w-full max-w-4xl aspect-video bg-black rounded-lg overflow-hidden mb-4">
                <Cropper
                    image={image}
                    crop={crop}
                    zoom={zoom}
                    aspect={aspectRatio}
                    onCropChange={onCropChange}
                    onCropComplete={onCropCompleteInternal}
                    onZoomChange={onZoomChange}
                />
            </div>
            
            <div className="flex flex-col items-center gap-4 w-full max-w-md">
                <input
                    type="range"
                    value={zoom}
                    min={1}
                    max={3}
                    step={0.1}
                    aria-labelledby="Zoom"
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    style={{ accentColor: primaryColor }}
                />
                
                <div className="flex gap-4">
                    <button
                        onClick={onCancel}
                        className="px-6 py-2 rounded-lg bg-gray-600 text-white font-medium hover:bg-gray-700 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="px-6 py-2 rounded-lg text-white font-medium transition-transform hover:scale-105"
                        style={{ backgroundColor: primaryColor }}
                    >
                        Crop & Save
                    </button>
                </div>
            </div>
        </div>
    );
};
