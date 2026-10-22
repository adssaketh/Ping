import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Older builds installed a service worker that cached the app. It could keep showing an old version after an
// update, so it is removed (once) together with its caches.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .getRegistrations()
    .then((registrations) => registrations.forEach((r) => r.unregister()))
    .catch(() => {});
  if ('caches' in window) {
    caches
      .keys()
      .then((keys) => keys.forEach((k) => caches.delete(k)))
      .catch(() => {});
  }
}

createRoot(document.getElementById('root')!).render(<App />);
