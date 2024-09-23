// src/utils/notifyUtils.ts
import { toast } from 'react-toastify';

export const notifyError = (title: string, message: string) => {
  toast.error(`${title}: ${message}`, {
    position: 'top-right',
    autoClose: 5000,
    hideProgressBar: true,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    theme: 'light',
  });
};
