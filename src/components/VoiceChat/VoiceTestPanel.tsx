import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Volume2, Play, Users, Settings } from 'lucide-react';
import { useTranslation } from '@/utils/translations';

interface VoiceTestProps {
  currentLanguage: 'ar' | 'en';
}

export function VoiceTestPanel({ currentLanguage }: VoiceTestProps) {
  const { t } = useTranslation(currentLanguage);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [testText, setTestText] = useState('');

  useEffect(() => {
    const loadVoices = () => {
      const voices = speechSynthesis.getVoices();
      console.log('All available voices:', voices);
      setAvailableVoices(voices);
      
      // Filter voices by language for debugging
      const arabicVoices = voices.filter(v => v.lang.includes('ar'));
      const englishVoices = voices.filter(v => v.lang.includes('en'));
      
      console.log('Arabic voices:', arabicVoices);
      console.log('English voices:', englishVoices);
      console.log('Female voices (by name):', voices.filter(v => 
        v.name.toLowerCase().includes('female') || 
        v.name.toLowerCase().includes('zira') ||
        v.name.toLowerCase().includes('hoda') ||
        v.name.toLowerCase().includes('sara') ||
        v.name.toLowerCase().includes('lily')
      ));
    };

    loadVoices();
    speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  useEffect(() => {
    if (currentLanguage === 'ar') {
      setTestText('مرحباً، أنا الممرضة أميرة. كيف يمكنني مساعدتك اليوم؟');
    } else {
      setTestText('Hello, I am Nurse Amira. How can I help you today?');
    }
  }, [currentLanguage]);

  const testVoice = () => {
    if (!selectedVoice || !testText) return;

    speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(testText);
    const voice = availableVoices.find(v => v.name === selectedVoice);
    
    if (voice) {
      utterance.voice = voice;
      utterance.rate = 0.8;
      utterance.pitch = 1.1;
      utterance.volume = 0.9;
      
      console.log('Testing voice:', {
        name: voice.name,
        lang: voice.lang,
        gender: voice.name.toLowerCase().includes('female') ? 'female' : 'unknown'
      });
      
      speechSynthesis.speak(utterance);
    }
  };

  const femaleVoices = availableVoices.filter(voice => {
    const langMatch = currentLanguage === 'ar' ? voice.lang.includes('ar') : voice.lang.includes('en');
    
    // Enhanced female detection patterns
    const femaleIndicators = [
      'female', 'zira', 'hoda', 'sara', 'lily', 'cortana', 'hazel', 'susan', 'amira', 'aisha', 
      'fatima', 'maryam', 'zahra', 'layla', 'emma', 'ava', 'aria', 'eva', 'amy'
    ];
    
    // Male patterns to EXCLUDE
    const maleIndicators = [
      'male', 'naayf', 'david', 'mark', 'ahmed', 'mohammed', 'omar', 'ali', 'hassan'
    ];
    
    const isFemale = femaleIndicators.some(indicator => 
      voice.name.toLowerCase().includes(indicator)
    );
    const isMale = maleIndicators.some(indicator => 
      voice.name.toLowerCase().includes(indicator)
    );
    
    return langMatch && (isFemale || !isMale); // Include female OR exclude male
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          {currentLanguage === 'ar' ? 'اختبار الأصوات' : 'Voice Test'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">
            {currentLanguage === 'ar' ? 'الأصوات النسائية المتاحة' : 'Available Female Voices'}
          </label>
          <Select value={selectedVoice} onValueChange={setSelectedVoice}>
            <SelectTrigger>
              <SelectValue placeholder={currentLanguage === 'ar' ? 'اختر صوت' : 'Select voice'} />
            </SelectTrigger>
            <SelectContent>
              {femaleVoices.map((voice) => (
                <SelectItem key={voice.name} value={voice.name}>
                  <div className="flex flex-col">
                    <span>{voice.name}</span>
                    <span className="text-xs text-muted-foreground">{voice.lang}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">
            {currentLanguage === 'ar' ? 'النص للاختبار' : 'Test Text'}
          </label>
          <textarea
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
            className="w-full p-2 border rounded text-sm"
            rows={2}
          />
        </div>

        <Button 
          onClick={testVoice} 
          disabled={!selectedVoice || !testText}
          className="w-full flex items-center gap-2"
        >
          <Play className="h-4 w-4" />
          {currentLanguage === 'ar' ? 'اختبر الصوت' : 'Test Voice'}
        </Button>

        <div className="text-xs text-muted-foreground">
          <p><strong>Debug Info:</strong></p>
          <p>Total voices: {availableVoices.length}</p>
          <p>Female voices: {femaleVoices.length}</p>
          <p>Current language: {currentLanguage}</p>
        </div>
      </CardContent>
    </Card>
  );
}