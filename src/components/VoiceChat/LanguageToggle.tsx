import React from 'react';
import { Button } from '@/components/ui/button';
import { Languages } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LanguageToggleProps {
  currentLanguage: 'en' | 'ar';
  onLanguageChange: (language: 'en' | 'ar') => void;
  disabled?: boolean;
  className?: string;
}

export function LanguageToggle({ 
  currentLanguage, 
  onLanguageChange, 
  disabled = false,
  className 
}: LanguageToggleProps) {
  const toggleLanguage = () => {
    const newLanguage = currentLanguage === 'en' ? 'ar' : 'en';
    onLanguageChange(newLanguage);
  };

  const getLanguageDisplay = () => {
    return currentLanguage === 'en' ? 'EN' : 'ع';
  };

  const getTooltip = () => {
    const target = currentLanguage === 'en' ? 'Arabic' : 'English';
    return `Switch to ${target}`;
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleLanguage}
      disabled={disabled}
      className={cn(
        "flex items-center gap-2 min-w-[80px] transition-all duration-300",
        "hover:shadow-md",
        className
      )}
      title={getTooltip()}
    >
      <Languages className="w-4 h-4" />
      <span className="font-semibold text-sm">
        {getLanguageDisplay()}
      </span>
    </Button>
  );
}