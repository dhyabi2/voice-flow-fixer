import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface ProcessingIndicatorProps {
  isVisible: boolean;
  currentStep: 'analyzing' | 'searching' | 'processing' | 'generating' | null;
  language: 'en' | 'ar';
  className?: string;
}

export function ProcessingIndicator({ 
  isVisible, 
  currentStep, 
  language,
  className 
}: ProcessingIndicatorProps) {
  const [dots, setDots] = useState('');

  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);

    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible || !currentStep) return null;

  const getStepText = () => {
    const steps = {
      analyzing: {
        ar: 'أحلل سؤالك',
        en: 'Analyzing your question'
      },
      searching: {
        ar: 'أبحث عن أحدث المعلومات',
        en: 'Searching for latest information'
      },
      processing: {
        ar: 'أعالج البيانات',
        en: 'Processing data'
      },
      generating: {
        ar: 'أحضر الإجابة',
        en: 'Generating response'
      }
    };
    
    return steps[currentStep][language];
  };

  const getStepIcon = () => {
    const icons = {
      analyzing: '🧠',
      searching: '🔍',
      processing: '⚙️',
      generating: '✨'
    };
    
    return icons[currentStep];
  };

  return (
    <div className={cn(
      "flex items-center gap-3 p-4 bg-gradient-to-r from-purple-50 via-pink-50 to-cyan-50 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-cyan-900/20 rounded-lg border border-purple-200/50 dark:border-purple-700/50 shadow-sm animate-pulse",
      language === 'ar' && "rtl",
      className
    )}>
      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 via-pink-500 to-cyan-500 rounded-full flex items-center justify-center shadow-lg animate-spin">
        <span className="text-lg">{getStepIcon()}</span>
      </div>
      
      <div className="flex-1">
        <div className="text-sm font-medium text-gray-900 dark:text-white">
          {getStepText()}{dots}
        </div>
        
        <div className="flex gap-1 mt-2">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={cn(
                "h-1 w-8 rounded-full transition-all duration-300",
                Object.keys({ analyzing: 0, searching: 1, processing: 2, generating: 3 }).indexOf(currentStep) >= i
                  ? "bg-gradient-to-r from-purple-500 to-pink-500"
                  : "bg-gray-200 dark:bg-gray-700"
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}