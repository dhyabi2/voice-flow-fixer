import { VoiceState, VoiceMessage, VoiceConfig, PipecatConfig } from '@/types/voice';
import { debugLogger } from '@/utils/debugLogger';

// Web Speech API types
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
  
  interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    maxAlternatives: number;
    start(): void;
    stop(): void;
    abort(): void;
    onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
    onend: ((this: SpeechRecognition, ev: Event) => any) | null;
    onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
    onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  }
}

export class VoiceService {
  private recognition: SpeechRecognition | null = null;
  private synthesis: SpeechSynthesis;
  private config: VoiceConfig;
  private openRouterConfig: {
    apiKey: string;
    model: string;
    baseUrl: string;
  };
  
  private stateListeners: Set<(state: VoiceState) => void> = new Set();
  private messageListeners: Set<(message: VoiceMessage) => void> = new Set();
  
  private currentState: VoiceState = {
    isConnected: false,
    isRecording: false,
    isSpeaking: false,
    isProcessing: false,
    error: null,
    currentLanguage: 'en'
  };

  constructor() {
    this.config = {
      sampleRate: 16000,
      channels: 1,
      bufferSize: 4096,
      vadThreshold: 0.01,
      silenceTimeout: 1500
    };

    this.openRouterConfig = {
      apiKey: localStorage.getItem('openrouter-api-key') || '',
      model: 'meta-llama/llama-3.1-8b-instruct:free',
      baseUrl: 'https://openrouter.ai/api/v1'
    };
    
    this.synthesis = window.speechSynthesis;
    this.initializeSpeechRecognition();
    debugLogger.info('VOICE_SERVICE', 'VoiceService initialized', { config: this.config });
  }

  private initializeSpeechRecognition(): void {
    try {
      const SpeechRecognitionConstructor = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (!SpeechRecognitionConstructor) {
        throw new Error('Speech recognition not supported in this browser');
      }

      this.recognition = new SpeechRecognitionConstructor();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.maxAlternatives = 1;
      this.recognition.lang = this.currentState.currentLanguage === 'ar' ? 'ar-SA' : 'en-US';

      this.recognition.onstart = () => {
        debugLogger.info('VOICE_SERVICE', 'Speech recognition started');
        this.updateState({ isRecording: true, error: null });
      };

      this.recognition.onend = () => {
        debugLogger.info('VOICE_SERVICE', 'Speech recognition ended');
        this.updateState({ isRecording: false });
      };

      this.recognition.onresult = (event: SpeechRecognitionEvent) => {
        if (event.results.length > 0) {
          const transcript = event.results[0][0].transcript;
          debugLogger.info('VOICE_SERVICE', 'Speech recognized', { transcript });
          
          const userMessage: VoiceMessage = {
            id: crypto.randomUUID(),
            type: 'user',
            content: transcript,
            timestamp: new Date(),
            language: this.currentState.currentLanguage
          };
          
          this.messageListeners.forEach(listener => listener(userMessage));
          this.processUserMessage(transcript);
        }
      };

      this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        debugLogger.error('VOICE_SERVICE', 'Speech recognition error', { error: event.error, message: event.message });
        this.updateState({ 
          error: `Speech recognition error: ${event.error}`,
          isRecording: false 
        });
      };

      debugLogger.info('VOICE_SERVICE', 'Speech recognition initialized');
    } catch (error) {
      debugLogger.error('VOICE_SERVICE', 'Failed to initialize speech recognition', { error });
      throw error;
    }
  }

  // State management
  private updateState(updates: Partial<VoiceState>) {
    this.currentState = { ...this.currentState, ...updates };
    debugLogger.debug('VOICE_SERVICE', 'State updated', this.currentState);
    this.stateListeners.forEach(listener => listener(this.currentState));
  }

  public getState(): VoiceState {
    return { ...this.currentState };
  }

  public onStateChange(callback: (state: VoiceState) => void) {
    this.stateListeners.add(callback);
    return () => {
      this.stateListeners.delete(callback);
    };
  }

  public onMessage(callback: (message: VoiceMessage) => void) {
    this.messageListeners.add(callback);
    return () => {
      this.messageListeners.delete(callback);
    };
  }

  // Core functionality
  public async initialize(): Promise<void> {
    try {
      // Check if speech recognition is available
      if (!this.recognition) {
        throw new Error('Speech recognition not available');
      }

      // Check if speech synthesis is available
      if (!this.synthesis) {
        throw new Error('Speech synthesis not available');
      }

      debugLogger.info('VOICE_SERVICE', 'Voice service initialized successfully');
      this.updateState({ error: null });
    } catch (error) {
      debugLogger.error('VOICE_SERVICE', 'Failed to initialize voice service', { error });
      this.updateState({ 
        error: 'Voice features not supported in this browser.' 
      });
      throw error;
    }
  }

  public async connect(): Promise<void> {
    try {
      await this.initialize();
      
      debugLogger.info('VOICE_SERVICE', 'Connecting using Web Speech API + OpenRouter');
      this.updateState({ isConnected: true, error: null });
      debugLogger.info('VOICE_SERVICE', 'Connected successfully');

    } catch (error) {
      debugLogger.error('VOICE_SERVICE', 'Connection failed', { error });
      this.updateState({ 
        error: 'Failed to connect to voice service.',
        isConnected: false 
      });
      throw error;
    }
  }

  public async startRecording(): Promise<void> {
    try {
      if (!this.recognition) {
        throw new Error('Speech recognition not initialized');
      }

      if (this.currentState.isRecording) {
        debugLogger.warn('VOICE_SERVICE', 'Already recording');
        return;
      }

      debugLogger.info('VOICE_SERVICE', 'Starting speech recognition');
      this.recognition.start();

    } catch (error) {
      debugLogger.error('VOICE_SERVICE', 'Failed to start recording', { error });
      this.updateState({ 
        error: 'Failed to start recording. Please try again.',
        isRecording: false 
      });
      throw error;
    }
  }

  public stopRecording(): void {
    if (this.recognition && this.currentState.isRecording) {
      debugLogger.info('VOICE_SERVICE', 'Stopping speech recognition');
      this.recognition.stop();
    }
  }

  public async switchLanguage(language: 'en' | 'ar'): Promise<void> {
    debugLogger.info('VOICE_SERVICE', 'Switching language', { from: this.currentState.currentLanguage, to: language });
    
    this.updateState({ currentLanguage: language });
    
    if (this.recognition) {
      this.recognition.lang = language === 'ar' ? 'ar-SA' : 'en-US';
    }
    
    debugLogger.info('VOICE_SERVICE', 'Language switched successfully');
  }

  public setApiKey(apiKey: string): void {
    this.openRouterConfig.apiKey = apiKey;
    localStorage.setItem('openrouter-api-key', apiKey);
    debugLogger.info('VOICE_SERVICE', 'API key updated');
  }

  public hasApiKey(): boolean {
    return !!this.openRouterConfig.apiKey;
  }

  public disconnect(): void {
    debugLogger.info('VOICE_SERVICE', 'Disconnecting voice service');
    
    if (this.recognition && this.currentState.isRecording) {
      this.recognition.stop();
    }

    if (this.synthesis.speaking) {
      this.synthesis.cancel();
    }

    this.updateState({
      isConnected: false,
      isRecording: false,
      isSpeaking: false,
      isProcessing: false,
      error: null
    });
    
    debugLogger.info('VOICE_SERVICE', 'Disconnected successfully');
  }

  // Private methods
  private async processUserMessage(text: string): Promise<void> {
    try {
      this.updateState({ isProcessing: true });
      debugLogger.info('VOICE_SERVICE', 'Processing user message', { text });

      const response = await this.callOpenRouter(text);
      
      const assistantMessage: VoiceMessage = {
        id: crypto.randomUUID(),
        type: 'assistant',
        content: response,
        timestamp: new Date(),
        language: this.currentState.currentLanguage
      };
      
      this.messageListeners.forEach(listener => listener(assistantMessage));
      
      // Speak the response
      await this.speakText(response);
      
      this.updateState({ isProcessing: false });
      debugLogger.info('VOICE_SERVICE', 'Message processed successfully');

    } catch (error) {
      debugLogger.error('VOICE_SERVICE', 'Failed to process user message', { error });
      this.updateState({ 
        error: 'Failed to process your message. Please try again.',
        isProcessing: false 
      });
    }
  }

  private async callOpenRouter(text: string): Promise<string> {
    try {
      if (!this.openRouterConfig.apiKey) {
        throw new Error('OpenRouter API key is required. Please add your API key in the settings.');
      }

      const systemPrompt = this.currentState.currentLanguage === 'ar' 
        ? 'أنت مساعد ذكي يتحدث العربية. قدم إجابات مفيدة ومختصرة في جملة أو جملتين فقط.'
        : 'You are a helpful AI assistant. Provide concise and useful responses in 1-2 sentences only.';

      const response = await fetch(`${this.openRouterConfig.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openRouterConfig.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Voice Chat AI'
        },
        body: JSON.stringify({
          model: this.openRouterConfig.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: text }
          ],
          max_tokens: 150,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      debugLogger.info('VOICE_SERVICE', 'OpenRouter response received', { data });
      
      return data.choices?.[0]?.message?.content || 'I apologize, but I could not generate a response.';

    } catch (error) {
      debugLogger.error('VOICE_SERVICE', 'OpenRouter API call failed', { error });
      throw error;
    }
  }

  private async speakText(text: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        if (this.synthesis.speaking) {
          this.synthesis.cancel();
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = this.currentState.currentLanguage === 'ar' ? 'ar-SA' : 'en-US';
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 1;

        utterance.onstart = () => {
          debugLogger.info('VOICE_SERVICE', 'Speech synthesis started');
          this.updateState({ isSpeaking: true });
        };

        utterance.onend = () => {
          debugLogger.info('VOICE_SERVICE', 'Speech synthesis ended');
          this.updateState({ isSpeaking: false });
          resolve();
        };

        utterance.onerror = (event) => {
          debugLogger.error('VOICE_SERVICE', 'Speech synthesis error', { error: event.error });
          this.updateState({ isSpeaking: false });
          reject(new Error(`Speech synthesis failed: ${event.error}`));
        };

        this.synthesis.speak(utterance);

      } catch (error) {
        debugLogger.error('VOICE_SERVICE', 'Failed to speak text', { error });
        this.updateState({ isSpeaking: false });
        reject(error);
      }
    });
  }
}

export const voiceService = new VoiceService();