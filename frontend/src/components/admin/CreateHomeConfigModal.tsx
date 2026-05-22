import React, { useState } from 'react';
import { Modal } from './Modal';

interface CreateHomeConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (name: string) => void;
}

export const CreateHomeConfigModal: React.FC<CreateHomeConfigModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
}) => {
    const [name, setName] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onSubmit(name.trim());
            setName('');
            onClose();
        }
    };

    const handleClose = () => {
        setName('');
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Create New Configuration"
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
                        disabled={!name.trim()}
                        className={`px-4 py-2 text-sm font-medium text-white theme-button-primary rounded-lg ${!name.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        Create Configuration
                    </button>
                </>
            }
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="config-name" className="block text-paragraph mb-2">
                        Configuration Name
                    </label>
                    <input
                        id="config-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g., Summer Promo, Winter Sale, Default"
                        className="theme-input w-full"
                        autoFocus
                        required
                    />
                </div>
            </form>
        </Modal>
    );
};
