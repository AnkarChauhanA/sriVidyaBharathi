import React, { createContext, useState, useContext, useCallback } from 'react';

export interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastContextType {
  toasts: ToastMessage[];
  showToast: (message: string, type: ToastMessage['type']) => void;
  removeToast: (id: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: number) => {
    setToasts(currentToasts => currentToasts.filter(toast => toast.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastMessage['type']) => {
    const id = Date.now();
    setToasts(currentToasts => [...currentToasts, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 5000); // Auto-dismiss after 5 seconds
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
