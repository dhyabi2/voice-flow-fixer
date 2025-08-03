import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Volume2 } from 'lucide-react';
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
      { value: 'enhanced', label: 'صوت محسن', description: 'OpenRouter Enhanced' },
      { value: 'premium', label: 'صوت متميز (ElevenLabs)', description: 'ElevenLabs Sarah' }
    ],
    en: [
      { value: 'natural', label: 'Natural Voice (Browser)', description: 'Microsoft Zira' },
      { value: 'enhanced', label: 'Enhanced Voice', description: 'OpenRouter Enhanced' },
      { value: 'premium', label: 'Premium Voice (ElevenLabs)', description: 'ElevenLabs Lily' }
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
      <CardContent className="space-y-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-blue-800 mb-2 font-medium">
            {currentLanguage === 'ar' ? 'إدارة مفاتيح API' : 'API Key Management'}
          </p>
          <p className="text-xs text-blue-600">
            {currentLanguage === 'ar' 
              ? 'مفاتيح API تُدار مركزياً عبر قاعدة البيانات لضمان الأمان والاستقرار.'
              : 'API keys are centrally managed through the database for security and stability.'
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