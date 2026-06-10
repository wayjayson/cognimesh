import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import App from './App';
import ErrorBoundary from './ErrorBoundary';
import './App.css';

// Apply theme before React renders to prevent FOUC
(function () {
  var theme = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', theme);
})();

// 全局错误上报
window.onerror = (message, source, lineno, colno, error) => {
  fetch('/api/log-error', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, stack: error?.stack })
  }).catch(() => {});
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Toaster position="top-center" toastOptions={{ style: { background: '#1e2435', color: '#e2e8f0' } }} />
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
