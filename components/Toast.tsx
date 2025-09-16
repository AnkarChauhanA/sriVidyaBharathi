import React from 'react';
import { useToast } from '../hooks/useToast';
import type { ToastMessage } from '../hooks/useToast';
import { CheckCircleIcon, XCircleIcon, InfoIcon } from './Icons';

const icons = {
  success: <CheckCircleIcon className="w-6 h-6 text-green-500" />,
  error: <XCircleIcon className="w-6 h-6 text-red-500" />,
  info: <InfoIcon className="w-6 h-6 text-blue-500" />,
};

const Toast: React.FC<ToastMessage> = ({ id, message, type }) => {
  const { removeToast } = useToast();

  return (
    <div className="bg-white dark:bg-slate-800 shadow-lg rounded-lg pointer-events-auto ring-1 ring-black dark:ring-white/20 ring-opacity-5 overflow-hidden w-full max-w-sm animate-toast-in">
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {icons[type]}
          </div>
          <div className="ml-3 w-0 flex-1 pt-0.5">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {message}
            </p>
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              onClick={() => removeToast(id)}
              className="bg-white dark:bg-slate-800 rounded-md inline-flex text-gray-400 dark:text-slate-400 hover:text-gray-500 dark:hover:text-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <span className="sr-only">Close</span>
              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


export const ToastContainer: React.FC = () => {
    const { toasts } = useToast();

    return (
        <div aria-live="assertive" className="fixed inset-0 flex items-end px-4 py-6 pointer-events-none sm:p-6 sm:items-start z-50">
            <div className="w-full flex flex-col items-center space-y-4 sm:items-end">
                {toasts.map((toast) => (
                    <Toast key={toast.id} {...toast} />
                ))}
            </div>
        </div>
    );
};
