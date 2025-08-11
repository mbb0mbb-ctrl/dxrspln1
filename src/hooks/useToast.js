import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

/**
 * Toast türleri için sabitler
 */
export const TOAST_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

/**
 * Toast konfigürasyonları
 */
const TOAST_CONFIGS = {
  [TOAST_TYPES.SUCCESS]: {
    icon: CheckCircle,
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-200 dark:border-green-800',
    iconColor: 'text-green-500',
    textColor: 'text-green-800 dark:text-green-200'
  },
  [TOAST_TYPES.ERROR]: {
    icon: XCircle,
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800',
    iconColor: 'text-red-500',
    textColor: 'text-red-800 dark:text-red-200'
  },
  [TOAST_TYPES.WARNING]: {
    icon: AlertCircle,
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
    iconColor: 'text-yellow-500',
    textColor: 'text-yellow-800 dark:text-yellow-200'
  },
  [TOAST_TYPES.INFO]: {
    icon: Info,
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    iconColor: 'text-blue-500',
    textColor: 'text-blue-800 dark:text-blue-200'
  }
};

/**
 * Tekil Toast bileşeni
 */
const Toast = ({ 
  type = TOAST_TYPES.INFO, 
  message, 
  duration = 3000, 
  onClose,
  id
}) => {
  const [isVisible, setIsVisible] = useState(true);

  // Toast konfigürasyonunu memoize et
  const config = useMemo(() => 
    TOAST_CONFIGS[type] || TOAST_CONFIGS[TOAST_TYPES.INFO], 
    [type]
  );

  const Icon = config.icon;

  // Toast'ı otomatik kapatma
  useEffect(() => {
    if (duration <= 0) return;

    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose(id), 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose, id]);

  // Manuel kapatma fonksiyonu
  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => onClose(id), 300);
  }, [onClose, id]);

  return (
    <div
      className={`
        flex items-center gap-3 p-4 rounded-lg border shadow-lg
        transform transition-all duration-300 ease-in-out
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        ${config.bgColor} ${config.borderColor}
      `}
      role="alert"
      aria-live="polite"
    >
      <Icon className={`w-5 h-5 flex-shrink-0 ${config.iconColor}`} />
      <span className={`text-sm font-medium ${config.textColor} flex-1`}>
        {message}
      </span>
      <button
        onClick={handleClose}
        className={`ml-2 ${config.iconColor} hover:opacity-70 transition-opacity flex-shrink-0`}
        aria-label="Toast'ı kapat"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

/**
 * Toast Container bileşeni
 */
const ToastContainer = ({ toasts, removeToast }) => {
  if (toasts.length === 0) return null;

  return (
    <div 
      className="fixed top-4 right-4 z-50 space-y-2 max-w-sm"
      role="region"
      aria-label="Bildirimler"
    >
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          {...toast}
          onClose={removeToast}
        />
      ))}
    </div>
  );
};

/**
 * Toast yönetimi için custom hook
 */
export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  // Toast ekleme fonksiyonu
  const showToast = useCallback((message, type = TOAST_TYPES.INFO, duration = 3000) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast = {
      id,
      message,
      type,
      duration
    };

    setToasts(prev => [...prev, newToast]);

    // Otomatik temizleme
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
      }, duration + 300); // Animasyon için 300ms ek süre
    }
  }, []);

  // Toast kaldırma fonksiyonu
  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  // Tüm toast'ları temizleme
  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Kolaylık fonksiyonları
  const showSuccess = useCallback((message, duration) => 
    showToast(message, TOAST_TYPES.SUCCESS, duration), [showToast]);
  
  const showError = useCallback((message, duration) => 
    showToast(message, TOAST_TYPES.ERROR, duration), [showToast]);
  
  const showWarning = useCallback((message, duration) => 
    showToast(message, TOAST_TYPES.WARNING, duration), [showToast]);
  
  const showInfo = useCallback((message, duration) => 
    showToast(message, TOAST_TYPES.INFO, duration), [showToast]);

  // Toast Container bileşeni
  const ToastContainerComponent = useCallback(() => (
    <ToastContainer toasts={toasts} removeToast={removeToast} />
  ), [toasts, removeToast]);

  return {
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    removeToast,
    clearAllToasts,
    toasts,
    ToastContainer: ToastContainerComponent
  };
};

export default useToast;
