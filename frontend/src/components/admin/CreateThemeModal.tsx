import React, { useState } from 'react';
import { Sparkles, Palette } from 'lucide-react';
import { Modal } from './Modal';

interface CreateThemeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (name: string, description: string) => void;
    onRandomSubmit: (baseColor: string) => void;
}

export const CreateThemeModal: React.FC<CreateThemeModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    onRandomSubmit,
}) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [baseColor, setBaseColor] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onSubmit(name.trim(), description.trim());
            setName('');
            setDescription('');
            setBaseColor('');
        }
    };

    const handleRandom = () => {
        onRandomSubmit(baseColor);
        setName('');
        setDescription('');
        setBaseColor('');
        onClose();
    };

    const handleClose = () => {
        setName('');
        setDescription('');
        setBaseColor('');
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Create New Theme"
            footer={
                <>
                    <button
                        onClick={handleClose}
                        className="px-4 py-2 text-sm font-medium text-paragraph rounded-lg border palette-border hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="px-4 py-2 text-sm font-medium text-white theme-button-primary rounded-lg"
                    >
                        Create Theme
                    </button>
                    <button
                        onClick={handleRandom}
                        className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-palette-primary to-palette-accent hover:opacity-90 rounded-lg shadow-sm transition-opacity flex items-center gap-2"
                    >
                        <Sparkles className="w-4 h-4" />
                        Generate Theme
                    </button>
                </>
            }
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="theme-name" className="block text-paragraph mb-2">
                        Theme Name
                    </label>
                    <input
                        id="theme-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g., Ocean, Sunset, Midnight"
                        className="theme-input w-full"
                        autoFocus
                        required
                    />
                </div>
                <div>
                    <label htmlFor="theme-description" className="block text-paragraph mb-2">
                        Description (Optional)
                    </label>
                    <textarea
                        id="theme-description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe this theme..."
                        className="theme-input w-full min-h-[100px] resize-y"
                        rows={3}
                    />
                </div>
                <div>
                    <label className="block text-paragraph mb-2">
                        Base Color <span className="opacity-50">(Optional)</span>
                    </label>
                    <div className="flex items-center gap-3">
                        <div className="relative flex-shrink-0">
                            <input
                                type="color"
                                value={baseColor || '#888888'}
                                onChange={(e) => setBaseColor(e.target.value)}
                                className="w-12 h-12 rounded-lg border-2 border-palette-border cursor-pointer"
                                style={{ padding: 0 }}
                            />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <Palette className="w-4 h-4 text-paragraph opacity-60" />
                                <input
                                    type="text"
                                    value={baseColor}
                                    onChange={(e) => {
                                        const v = e.target.value;
                                        if (v === '' || /^#[0-9A-Fa-f]{0,6}$/.test(v)) {
                                            setBaseColor(v);
                                        }
                                    }}
                                    placeholder="Leave empty for random, or enter #F83A3A"
                                    className="theme-input w-full py-2 px-3 font-mono text-sm"
                                />
                            </div>
                            <p className="text-xs text-paragraph opacity-60 mt-1.5">
                                Pick a color for analogous palette generation (±30° hue). Leave empty for a fully random hue.
                            </p>
                        </div>
                    </div>
                </div>
            </form>
        </Modal>
    );
};
