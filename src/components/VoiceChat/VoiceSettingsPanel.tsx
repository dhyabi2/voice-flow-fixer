import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Volume2, Settings } from 'lucide-react';
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
}

export function VoiceSettingsPanel({ settings, onSettingsChange, currentLanguage }: VoiceSettingsProps) {
  const { t } = useTranslation(currentLanguage);

  const voiceOptions = {
    ar: [
      { value: 'natural', label: 'صوت طبيعي (متصفح)', description: 'Microsoft Hoda' },
      { value: 'enhanced', label: 'صوت محسن', description: 'Google Arabic Enhanced' },
      { value: 'premium', label: 'صوت متميز', description: 'ElevenLabs Lily' }
    ],
    en: [
      { value: 'natural', label: 'Natural Voice (Browser)', description: 'Microsoft Zira' },
      { value: 'enhanced', label: 'Enhanced Voice', description: 'Google Enhanced' },
      { value: 'premium', label: 'Premium Voice', description: 'ElevenLabs Sarah' }
    ]
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="h-5 w-5" />
          {currentLanguage === 'ar' ? 'إعدادات الصوت' : 'Voice Settings'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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