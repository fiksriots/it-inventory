'use client';

import { useEffect } from 'react';

export function PWARegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const handleLoad = () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('OpsFlow IT Service Worker registered with scope:', registration.scope);
          })
          .catch((error) => {
            console.error('OpsFlow IT Service Worker registration failed:', error);
          });
      };

      // If page is already loaded, register immediately, otherwise wait for load event
      if (document.readyState === 'complete') {
        handleLoad();
      } else {
        window.addEventListener('load', handleLoad);
        return () => window.removeEventListener('load', handleLoad);
      }
    }
  }, []);

  return null;
}
