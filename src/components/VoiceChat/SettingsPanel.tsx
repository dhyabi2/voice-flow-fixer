import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Settings, Volume2, Mic, Zap, Globe, Shield, Info, Key } from 'lucide-react';
import { voiceService } from '@/services/voiceService';
import { cn } from '@/lib/utils';

interface SettingsPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
}

export function SettingsPanel({ isOpen, onToggle, className }: SettingsPanelProps) {
  const [autoTranslate, setAutoTranslate] = useState(false);
  const [voiceVolume, setVoiceVolume] = useState([80]);
  const [micSensitivity, setMicSensitivity] = useState([70]);
  const [fastResponse, setFastResponse] = useState(true);
  const [saveHistory, setSaveHistory] = useState(true);
  const [apiKey, setApiKey] = useState(localStorage.getItem('openrouter-api-key') || '');

  const handleApiKeyChange = (value: string) => {
    setApiKey(value);
    voiceService.setApiKey(value);
  };

  if (!isOpen) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggle}
        className="h-8 w-8 p-0"
        title="Settings"
      >
        <Settings className="w-4 h-4" />
      </Button>
    );
  }

  return (
    <Card className={cn("w-full max-w-md", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Voice Chat Settings
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="h-8 w-8 p-0"
          >
            ×
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* API Configuration */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <Key className="w-4 h-4" />
            API Configuration
          </h3>
          
          <div className="space-y-2">
            <label className="text-sm">OpenRouter API Key</label>
            <Input
              type="password"
              placeholder="Enter your OpenRouter API key"
              value={apiKey}
              onChange={(e) => handleApiKeyChange(e.target.value)}
              className="font-mono text-xs"
            />
            <p className="text-xs text-muted-foreground">
              Required for AI responses. Get your key from{' '}
              <a 
                href="https://openrouter.ai/keys" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                openrouter.ai
              </a>
            </p>
            {!apiKey && (
              <div className="text-xs text-destructive">
                ⚠️ API key required for voice responses
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Audio Settings */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <Volume2 className="w-4 h-4" />
            Audio Settings
          </h3>
          
          <div className="space-y-3">
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-xs text-muted-foreground">Voice Volume</label>
                <span className="text-xs">{voiceVolume[0]}%</span>
              </div>
              <Slider
                value={voiceVolume}
                onValueChange={setVoiceVolume}
                max={100}
                step={10}
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-xs text-muted-foreground">Microphone Sensitivity</label>
                <span className="text-xs">{micSensitivity[0]}%</span>
              </div>
              <Slider
                value={micSensitivity}
                onValueChange={setMicSensitivity}
                max={100}
                step={10}
                className="w-full"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Language & Translation */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Language & Translation
          </h3>
          
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <label className="text-sm">Auto-translate messages</label>
              <p className="text-xs text-muted-foreground">
                Automatically translate between languages
              </p>
            </div>
            <Switch
              checked={autoTranslate}
              onCheckedChange={setAutoTranslate}
            />
          </div>
        </div>

        <Separator />

        {/* Performance */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Performance
          </h3>
          
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <label className="text-sm">Fast response mode</label>
              <p className="text-xs text-muted-foreground">
                Prioritize speed over accuracy
              </p>
            </div>
            <Switch
              checked={fastResponse}
              onCheckedChange={setFastResponse}
            />
          </div>
        </div>

        <Separator />

        {/* Privacy */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Privacy
          </h3>
          
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <label className="text-sm">Save conversation history</label>
              <p className="text-xs text-muted-foreground">
                Keep messages for this session
              </p>
            </div>
            <Switch
              checked={saveHistory}
              onCheckedChange={setSaveHistory}
            />
          </div>
        </div>

        <Separator />

        {/* System Info */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <Info className="w-4 h-4" />
            System Information
          </h3>
          
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Browser Support</span>
              <Badge variant="outline" className="text-xs">
                {navigator.mediaDevices ? 'Full' : 'Limited'}
              </Badge>
            </div>
            
            <div className="flex justify-between">
              <span className="text-muted-foreground">Audio Context</span>
              <Badge variant="outline" className="text-xs">
                {window.AudioContext ? 'Available' : 'Unavailable'}
              </Badge>
            </div>
            
            <div className="flex justify-between">
              <span className="text-muted-foreground">WebSocket</span>
              <Badge variant="outline" className="text-xs">
                {window.WebSocket ? 'Available' : 'Unavailable'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Reset Settings */}
        <div className="pt-4 border-t">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => {
              setAutoTranslate(false);
              setVoiceVolume([80]);
              setMicSensitivity([70]);
              setFastResponse(true);
              setSaveHistory(true);
            }}
          >
            Reset to Defaults
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}