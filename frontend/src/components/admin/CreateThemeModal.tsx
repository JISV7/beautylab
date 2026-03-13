import React, { useState } from 'react';
import { Modal } from './Modal';

interface CreateThemeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (name: string, description: string) => void;
}

export const CreateThemeModal: React.FC<CreateThemeModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
}) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onSubmit(name.trim(), description.trim());
            setName('');
            setDescription('');
        }
    };

    const handleClose = () => {
        setName('');
        setDescription('');
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
                        className="px-4 py-2 text-sm font-medium text-p-color rounded-lg border palette-border hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="px-4 py-2 text-sm font-medium text-white theme-button-primary rounded-lg"
                    >
                        Create Theme
                    </button>
                </>
            }
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="theme-name" className="block text-p-font text-p-size text-p-color mb-2">
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
                    <label htmlFor="theme-description" className="block text-p-font text-p-size text-p-color mb-2">
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
            </form>
        </Modal>
    );
};
