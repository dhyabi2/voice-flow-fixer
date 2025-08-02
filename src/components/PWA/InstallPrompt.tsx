import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, Download, Smartphone, Monitor } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface InstallPromptProps {
  language?: 'en' | 'ar';
}

export function InstallPrompt({ language = 'en' }: InstallPromptProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  const isRTL = language === 'ar';

  useEffect(() => {
    // Check if app is already installed
    const checkInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
        return;
      }
      
      if ((window.navigator as any).standalone === true) {
        setIsInstalled(true);
        return;
      }
    };

    // Check if device is iOS
    const checkIOS = () => {
      const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
      setIsIOS(isIOSDevice);
    };

    checkInstalled();
    checkIOS();

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Show prompt after a delay to not overwhelm users
      setTimeout(() => {
        if (!isInstalled) {
          setShowPrompt(true);
        }
      }, 5000);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
      
      toast.success(
        language === 'ar' 
          ? '🎉 تم تثبيت أميرة بنجاح!' 
          : '🎉 Nurse Amira installed successfully!'
      );
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isInstalled, language]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      if (isIOS) {
        // Show iOS-specific instructions
        toast.info(
          language === 'ar'
            ? '📱 اضغط على زر المشاركة ثم "إضافة إلى الشاشة الرئيسية"'
            : '📱 Tap the Share button and then "Add to Home Screen"',
          { duration: 6000 }
        );
      }
      return;
    }

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        toast.success(
          language === 'ar' 
            ? '✨ جاري التثبيت...' 
            : '✨ Installing...'
        );
      }
      
      setDeferredPrompt(null);
      setShowPrompt(false);
    } catch (error) {
      console.error('Error during installation:', error);
      toast.error(
        language === 'ar' 
          ? '❌ حدث خطأ أثناء التثبيت' 
          : '❌ Installation failed'
      );
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    
    // Don't show again for this session
    sessionStorage.setItem('pwa-prompt-dismissed', 'true');
    
    toast.info(
      language === 'ar' 
        ? 'يمكنك تثبيت التطبيق لاحقاً من إعدادات المتصفح' 
        : 'You can install the app later from browser settings'
    );
  };

  // Don't show if already installed or dismissed this session
  if (isInstalled || 
      sessionStorage.getItem('pwa-prompt-dismissed') ||
      (!showPrompt && !isIOS)) {
    return null;
  }

  const getInstallText = () => {
    if (isIOS) {
      return {
        title: language === 'ar' ? '📱 أضف أميرة للشاشة الرئيسية' : '📱 Add Amira to Home Screen',
        description: language === 'ar' 
          ? 'استخدم أميرة كتطبيق مستقل من شاشتك الرئيسية'
          : 'Use Amira as a standalone app from your home screen',
        button: language === 'ar' ? 'إرشادات التثبيت' : 'Installation Guide'
      };
    }
    
    return {
      title: language === 'ar' ? '🚀 ثبت تطبيق أميرة' : '🚀 Install Nurse Amira',
      description: language === 'ar' 
        ? 'احصل على تجربة أفضل مع التطبيق المثبت - أسرع وأكثر سهولة!'
        : 'Get a better experience with the installed app - faster and more convenient!',
      button: language === 'ar' ? 'تثبيت الآن' : 'Install Now'
    };
  };

  const installText = getInstallText();

  return (
    <div className={cn(
      "fixed bottom-4 left-4 right-4 z-50 animate-slide-up",
      isRTL && "rtl"
    )}>
      <Card className="bg-gradient-to-r from-purple-50 via-pink-50 to-cyan-50 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-cyan-900/20 border-2 border-purple-200 dark:border-purple-700 shadow-2xl backdrop-blur-xl">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 via-pink-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
                {isIOS ? (
                  <Smartphone className="h-6 w-6 text-white" />
                ) : (
                  <Download className="h-6 w-6 text-white" />
                )}
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-1">
                {installText.title}
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                {installText.description}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                onClick={handleInstallClick}
                size="sm"
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold text-xs h-8 px-3 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                {isIOS ? (
                  <Monitor className="h-3 w-3 mr-1" />
                ) : (
                  <Download className="h-3 w-3 mr-1" />
                )}
                {installText.button}
              </Button>
              
              <Button
                onClick={handleDismiss}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* iOS specific instructions */}
          {isIOS && (
            <div className="mt-3 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg border border-purple-200/50 dark:border-purple-700/50">
              <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                <span>📋</span>
                <span>
                  {language === 'ar' 
                    ? 'اضغط على زر المشاركة في سفاري ← "إضافة إلى الشاشة الرئيسية"'
                    : 'Tap Safari\'s Share button → "Add to Home Screen"'
                  }
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}