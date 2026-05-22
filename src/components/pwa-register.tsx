'use client';

import { useEffect, useState } from 'react';
import { Download, X, Smartphone } from 'lucide-react';

export function PWARegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const handleLoad = () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('OpsFlow IT SW registered:', registration.scope);
          })
          .catch((error) => {
            console.error('OpsFlow IT SW registration failed:', error);
          });
      };

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

export function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    // Cek apakah sudah diinstall (standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Cek iOS (Safari)
    const ua = navigator.userAgent;
    const iosDevice = /iPhone|iPad|iPod/.test(ua) && !(window as any).MSStream;
    if (iosDevice && !(navigator as any).standalone) {
      setIsIOS(true);
      const dismissed = sessionStorage.getItem('pwa-banner-dismissed');
      if (!dismissed) {
        setTimeout(() => setShowBanner(true), 3000);
      }
      return;
    }

    // Android / Desktop Chrome - tangkap event beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      const dismissed = sessionStorage.getItem('pwa-banner-dismissed');
      if (!dismissed) {
        setTimeout(() => setShowBanner(true), 3000);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Setelah install berhasil
    window.addEventListener('appinstalled', () => {
      setShowBanner(false);
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    sessionStorage.setItem('pwa-banner-dismissed', '1');
  };

  if (isInstalled || !showBanner) return null;

  // Banner iOS
  if (isIOS) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-[999] animate-in slide-in-from-bottom-4 duration-500">
        <div className="bg-[#0f172a] border border-blue-500/30 rounded-2xl p-4 shadow-2xl shadow-black/50">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5 text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white">Install OpsFlow IT</p>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                Tap <strong className="text-white">Share</strong> lalu pilih{' '}
                <strong className="text-white">"Add to Home Screen"</strong> untuk install di iPhone/iPad.
              </p>
            </div>
            <button onClick={handleDismiss} className="p-1 text-slate-500 hover:text-white transition-colors shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Banner Android / Desktop
  return (
    <div className="fixed bottom-4 left-4 right-4 z-[999] animate-in slide-in-from-bottom-4 duration-500 max-w-sm mx-auto">
      <div className="bg-[#0f172a] border border-blue-500/30 rounded-2xl p-4 shadow-2xl shadow-black/50">
        <div className="flex items-center gap-3">
          {/* App Icon */}
          <img src="/icon-72x72.png" alt="OpsFlow IT" className="w-12 h-12 rounded-xl shrink-0" />
          
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-white">OpsFlow IT</p>
            <p className="text-[11px] text-slate-400 leading-tight">Install sebagai app di perangkat ini</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleInstall}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold rounded-xl transition-all active:scale-95 shadow-lg shadow-blue-500/30"
            >
              <Download className="w-3.5 h-3.5" />
              Install
            </button>
            <button onClick={handleDismiss} className="p-2 text-slate-500 hover:text-white transition-colors rounded-lg hover:bg-white/10">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
