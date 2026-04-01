import { useState, useEffect } from 'react';
import { Download, X, Smartphone, Monitor, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { usePWAInstall } from '@/hooks/usePWAInstall';

export function PWAInstallPrompt() {
  const { canInstall, installApp } = usePWAInstall();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (canInstall) {
      const isDismissed = sessionStorage.getItem('pwa-prompt-dismissed');
      if (!isDismissed) {
        // Delay the prompt slightly for better UX
        const timer = setTimeout(() => setIsVisible(true), 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [canInstall]);

  const handleInstall = async () => {
    await installApp();
    setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  if (!canInstall) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-96 z-[200]"
        >
          <div className="relative group p-[1px] rounded-2xl bg-gradient-to-br from-primary via-indigo-500 to-purple-600 shadow-2xl shadow-primary/20">
            <div className="bg-card/90 backdrop-blur-xl rounded-[15px] p-5 overflow-hidden relative">
              {/* Background Decoration */}
              <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-primary/10 blur-3xl rounded-full" />
              
              <button 
                onClick={handleDismiss}
                className="absolute top-3 right-3 text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all p-1.5 rounded-full z-20 cursor-pointer"
              >
                <X size={16} />
              </button>
              
              <div className="flex items-start gap-4 relative z-10">
                <div className="relative group">
                   <div className="absolute inset-0 bg-primary/20 blur-lg group-hover:bg-primary/40 transition-colors rounded-xl" />
                   <div className="relative bg-gradient-to-br from-primary to-indigo-600 p-3 rounded-xl text-white shadow-lg">
                    <Smartphone className="w-6 h-6 md:block hidden" />
                    <Monitor className="w-6 h-6 md:hidden block" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-foreground tracking-tight">Experience it Offline</h3>
                  <p className="text-xs text-muted-foreground mt-1 font-medium leading-relaxed">
                    Install FinTrack Pro on your device for instant access, better performance, and a native app experience.
                  </p>
                  <div className="flex items-center gap-1.5 mt-2 bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full w-fit">
                     <ShieldCheck size={10} className="animate-pulse" />
                     <span className="text-[10px] font-bold uppercase tracking-wider">Safe & Secure</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex items-center gap-3 relative z-10">
                <Button 
                  onClick={handleInstall}
                  className="flex-1 gap-2 h-11 font-bold shadow-lg shadow-primary/20 group"
                  variant="default"
                >
                  <Download size={18} className="group-hover:translate-y-0.5 transition-transform" />
                  Install Now
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={handleDismiss}
                  className="px-4 h-11 text-muted-foreground hover:text-foreground font-semibold"
                >
                  Maybe Later
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
