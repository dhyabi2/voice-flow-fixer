import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Volume2, Key, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from '@/utils/translations';

interface VoiceSettings {
  language: 'ar' | 'en';
  voiceType: 'natural' | 'enhanced' | 'premium';
  rate: number;
  pitch: number;
}

interface VoiceSettingsProps {
  settings: VoiceSettings;
  onSettingsChange: (settings: VoiceSettings) => void;
  currentLanguage: 'ar' | 'en';
  onElevenLabsApiKeyChange?: (apiKey: string) => void;
}

export function VoiceSettingsPanel({ settings, onSettingsChange, currentLanguage, onElevenLabsApiKeyChange }: VoiceSettingsProps) {
  const { t } = useTranslation(currentLanguage);
  const [elevenLabsApiKey, setElevenLabsApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);

  // Load saved API key from localStorage
  useEffect(() => {
    const savedApiKey = localStorage.getItem('elevenlabs-api-key');
    if (savedApiKey) {
      setElevenLabsApiKey(savedApiKey);
    }
  }, []);

  const voiceOptions = {
    ar: [
      { value: 'natural', label: 'صوت طبيعي (متصفح)', description: 'Microsoft Hoda' },
      { value: 'enhanced', label: 'صوت محسن', description: 'OpenRouter Enhanced' },
      { value: 'premium', label: 'صوت متميز (ElevenLabs)', description: 'ElevenLabs Sarah' }
    ],
    en: [
      { value: 'natural', label: 'Natural Voice (Browser)', description: 'Microsoft Zira' },
      { value: 'enhanced', label: 'Enhanced Voice', description: 'OpenRouter Enhanced' },
      { value: 'premium', label: 'Premium Voice (ElevenLabs)', description: 'ElevenLabs Lily' }
    ]
  };

  const handleApiKeyChange = (apiKey: string) => {
    setElevenLabsApiKey(apiKey);
    if (onElevenLabsApiKeyChange) {
      onElevenLabsApiKeyChange(apiKey);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="h-5 w-5" />
          {currentLanguage === 'ar' ? 'إعدادات الصوت' : 'Voice Settings'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* ElevenLabs API Key Section */}
        <div className="space-y-2">
          <Label htmlFor="elevenlabs-api-key" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            {currentLanguage === 'ar' ? 'مفتاح ElevenLabs API' : 'ElevenLabs API Key'}
          </Label>
          <div className="relative">
            <Input
              id="elevenlabs-api-key"
              type={showApiKey ? 'text' : 'password'}
              value={elevenLabsApiKey}
              onChange={(e) => handleApiKeyChange(e.target.value)}
              placeholder={currentLanguage === 'ar' ? 'أدخل مفتاح API الخاص بك' : 'Enter your API key'}
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1 h-8 w-8 p-0"
              onClick={() => setShowApiKey(!showApiKey)}
            >
              {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {currentLanguage === 'ar' 
              ? 'مطلوب لاستخدام الأصوات المتميزة من ElevenLabs'
              : 'Required for premium ElevenLabs voices'
            }
          </p>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">
            {currentLanguage === 'ar' ? 'نوع الصوت' : 'Voice Type'}
          </label>
          <Select 
            value={settings.voiceType} 
            onValueChange={(value: 'natural' | 'enhanced' | 'premium') => 
              onSettingsChange({ ...settings, voiceType: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {voiceOptions[currentLanguage].map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex flex-col">
                    <span>{option.label}</span>
                    <span className="text-xs text-muted-foreground">{option.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">
            {currentLanguage === 'ar' ? 'سرعة الكلام' : 'Speech Rate'}: {settings.rate}
          </label>
          <input
            type="range"
            min="0.5"
            max="1.5"
            step="0.1"
            value={settings.rate}
            onChange={(e) => onSettingsChange({ ...settings, rate: parseFloat(e.target.value) })}
            className="w-full"
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">
            {currentLanguage === 'ar' ? 'نبرة الصوت' : 'Voice Pitch'}: {settings.pitch}
          </label>
          <input
            type="range"
            min="0.5"
            max="1.5"
            step="0.1"
            value={settings.pitch}
            onChange={(e) => onSettingsChange({ ...settings, pitch: parseFloat(e.target.value) })}
            className="w-full"
          />
        </div>
      </CardContent>
    </Card>
  );
}