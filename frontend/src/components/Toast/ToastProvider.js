import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import './Toast.css';

const ToastContext = createContext(null);

function randomId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef(new Map());

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) clearTimeout(timer);
    timersRef.current.delete(id);
  }, []);

  const show = useCallback(
    ({ type = 'info', title, message, durationMs = 3500 }) => {
      const id = randomId();
      const toast = { id, type, title, message };
      setToasts((prev) => [toast, ...prev].slice(0, 5));

      const timer = setTimeout(() => remove(id), durationMs);
      timersRef.current.set(id, timer);
      return id;
    },
    [remove]
  );

  const api = useMemo(
    () => ({
      show,
      success: (message, opts = {}) => show({ type: 'success', message, ...opts }),
      error: (message, opts = {}) => show({ type: 'error', message, ...opts }),
      info: (message, opts = {}) => show({ type: 'info', message, ...opts }),
      remove,
    }),
    [remove, show]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-viewport" role="region" aria-label="Notifications">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`} role="status">
            <div className="toast-body">
              {t.title && <div className="toast-title">{t.title}</div>}
              {t.message && <div className="toast-message">{t.message}</div>}
            </div>
            <button className="toast-close" onClick={() => remove(t.id)} aria-label="Dismiss">
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

