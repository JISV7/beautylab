import React, { useEffect } from 'react';
import { Modal } from './Modal';
import { CheckCircle, XCircle } from 'lucide-react';

interface MessageModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: 'success' | 'error';
    message: string;
    autoClose?: boolean;
    autoCloseDelay?: number;
}

export const MessageModal: React.FC<MessageModalProps> = ({
    isOpen,
    onClose,
    type,
    message,
    autoClose = true,
    autoCloseDelay = 3000,
}) => {
    useEffect(() => {
        if (isOpen && autoClose && type === 'success') {
            const timer = setTimeout(() => {
                onClose();
            }, autoCloseDelay);

            return () => clearTimeout(timer);
        }
    }, [isOpen, autoClose, autoCloseDelay, type, onClose]);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={type === 'success' ? 'Success' : 'Error'}
            footer={
                <button
                    onClick={onClose}
                    className={`px-4 py-2 text-sm font-medium text-white rounded-lg ${
                        type === 'success'
                            ? 'bg-green-600 hover:bg-green-700'
                            : 'bg-red-600 hover:bg-red-700'
                    } transition-colors`}
                >
                    {type === 'success' ? 'Great!' : 'OK'}
                </button>
            }
        >
            <div className="flex items-start gap-4">
                <div className={`shrink-0 ${
                    type === 'success' ? 'text-green-600' : 'text-red-600'
                }`}>
                    {type === 'success' ? (
                        <CheckCircle className="w-12 h-12" />
                    ) : (
                        <XCircle className="w-12 h-12" />
                    )}
                </div>
                <p className="text-p-color text-p-font text-p-size">
                    {typeof message === 'string' ? message : JSON.stringify(message)}
                </p>
            </div>
        </Modal>
    );
};
