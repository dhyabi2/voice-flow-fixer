export interface VoiceState {
  isConnected: boolean;
  isRecording: boolean;
  isSpeaking: boolean;
  isProcessing: boolean;
  error: string | null;
  currentLanguage: 'en' | 'ar';
  processingStep: 'analyzing' | 'searching' | 'processing' | 'generating' | null;
}

export interface VoiceMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  language: 'en' | 'ar';
  audioUrl?: string;
}

export interface TranslationResult {
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  confidence: number;
}

export interface VoiceConfig {
  sampleRate: number;
  channels: number;
  bufferSize: number;
  vadThreshold: number;
  silenceTimeout: number;
}

export interface PipecatConfig {
  wsUrl: string;
  apiKey: string;
  model: string;
  voice: string;
  language: string;
}