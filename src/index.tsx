
// --- CRITICAL BROWSER SHIMS (MUST BE FIRST) ---
if (typeof (window as any).process === 'undefined') {
  (window as any).process = { env: {} };
}

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { ErrorBoundary } from './components/SafeContainer';

// Global Error Catcher for easier debugging on Vercel
window.addEventListener('error', (event) => {
  console.error('[RUNTIME ERROR]', event.error);
});

console.log('[SYSTEM] Initializing App...');

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error("[SYSTEM] CRITICAL: Could not find root element to mount to!");
  throw new Error("Could not find root element to mount to");
}

try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
  console.log('[SYSTEM] App Rendered Successfully.');
} catch (error) {
  console.error('[SYSTEM] CRITICAL Error during render:', error);
}
