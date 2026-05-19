import { toast, ToastContainer } from 'react-toastify';
import { CheckCircle, XCircle, Info } from 'lucide-react';
import 'react-toastify/dist/ReactToastify.css';

// Custom CSS for toast styling
import './toast.css';

const toastIcons = {
  success: <CheckCircle className="w-5 h-5" />,
  error: <XCircle className="w-5 h-5" />,
  info: <Info className="w-5 h-5" />,
};

const toastOptions = (autoClose = 2000) => ({
  position: 'top-right' as const,
  autoClose,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
  theme: 'colored' as const,
});

export const showToast = {
  success: (message: string, autoCloseMs = 2000) => {
    toast.success(message, {
      ...toastOptions(autoCloseMs),
      icon: toastIcons.success,
      className: 'toast-success',
    });
  },
  error: (message: string, autoCloseMs = 5000) => {
    toast.error(message, {
      ...toastOptions(autoCloseMs),
      icon: toastIcons.error,
      className: 'toast-error',
    });
  },
  info: (message: string, autoCloseMs = 2000) => {
    toast.info(message, {
      ...toastOptions(autoCloseMs),
      icon: toastIcons.info,
      className: 'toast-info',
    });
  },
};

export const ToastProvider = () => {
  return (
    <ToastContainer
      position="top-right"
      autoClose={2000}
      hideProgressBar={false}
      newestOnTop
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme="colored"
    />
  );
}; 