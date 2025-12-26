'use client';

import { useState } from 'react';

export const useConfirmDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<{
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    isDangerous?: boolean;
  } | null>(null);

  const confirm = (options: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    isDangerous?: boolean;
  }) => {
    setConfig(options);
    setIsOpen(true);
  };

  const handleConfirm = () => {
    if (config?.onConfirm) {
      config.onConfirm();
    }
    setIsOpen(false);
    setConfig(null);
  };

  const handleCancel = () => {
    setIsOpen(false);
    setConfig(null);
  };

  return {
    isOpen,
    config,
    confirm,
    handleConfirm,
    handleCancel,
  };
};
