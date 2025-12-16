import React from 'react';
import './ConfirmationModal.css';

interface Props {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
}

export const ConfirmationModal: React.FC<Props> = ({
    isOpen,
    title,
    message,
    onConfirm,
    onCancel,
    confirmText = 'Onayla',
    cancelText = 'İptal',
    type = 'danger'
}) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-container">
                <div className={`modal-header ${type}`}>
                    <h3>{title}</h3>
                    <button className="close-btn" onClick={onCancel}>&times;</button>
                </div>
                <div className="modal-body">
                    <p>{message}</p>
                </div>
                <div className="modal-footer">
                    <button className="btn-cancel" onClick={onCancel}>{cancelText}</button>
                    <button className={`btn-confirm ${type}`} onClick={onConfirm}>{confirmText}</button>
                </div>
            </div>
        </div>
    );
};
