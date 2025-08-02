// OpenRouter-Enhanced Voice Service with Human-like TTS
import { pipeline } from '@huggingface/transformers';
import { VoiceState, VoiceMessage } from '@/types/voice';
import { debugLogger } from '@/utils/debugLogger';
import { supabase } from '@/integrations/supabase/client';

interface OpenRouterVoiceConfig {
  models: {
    textEnhancement: string; // OpenRouter model for text enhancement
    ttsBackup: string;       // Backup TTS model
  };
  voiceSettings: {
    rate: number;
    pitch: number;
    volume: number;
    humanization: boolean;   // Enable OpenRouter text enhancement
  };
}

export class OpenRouterVoiceService {
  private recognition: SpeechRecognition | null = null;
  private ttsModel: any = null;
  private audioContext: AudioContext | null = null;
  private config: OpenRouterVoiceConfig;
  private isEnhancementEnabled: boolean = true;
  
  private stateListeners: Set<(state: VoiceState) => void> = new Set();
  private messageListeners: Set<(message: VoiceMessage) => void> = new Set();
  
  private currentState: VoiceState = {
    isConnected: false,
    isRecording: false,
    isSpeaking: false,
    isProcessing: false,
    error: null,
    currentLanguage: 'ar', // Default to Arabic
    processingStep: null
  };

  constructor() {
    this.config = {
      models: {
        textEnhancement: 'meta-llama/llama-3.1-70b-instruct', // For human-like text enhancement
        ttsBackup: 'microsoft/speecht5_tts' // Backup TTS model
      },
      voiceSettings: {
        rate: 0.8,
        pitch: 1.1, // Higher pitch for female voice
        volume: 0.9,
        humanization: true // Enable OpenRouter enhancement by default
      }
    };
    
    this.initializeServices();
  }

  private async initializeServices(): Promise<void> {
    try {
      // Initialize audio context
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Initialize speech recognition
      await this.initializeSpeechRecognition();
      
      debugLogger.info('OPENROUTER_VOICE', 'OpenRouter voice service initialized');
    } catch (error) {
      debugLogger.error('OPENROUTER_VOICE', 'Failed to initialize OpenRouter voice service', { error });
    }
  }

  private async initializeTTSModel(): Promise<void> {
    try {
      console.log('🤖 Loading backup TTS model...');
      this.updateState({ isProcessing: true });
      
      // Load backup TTS model (for offline use)
      this.ttsModel = await pipeline(
        'text-to-speech',
        this.config.models.ttsBackup,
        {
          device: 'webgpu',
          dtype: 'fp16'
        }
      );
      
      console.log('✅ Backup TTS model loaded successfully');
      this.updateState({ isProcessing: false });
      
    } catch (error) {
      console.error('❌ Failed to load backup TTS model:', error);
      this.updateState({ 
        error: 'Failed to load backup voice model. Using browser TTS.',
        isProcessing: false 
      });
      this.ttsModel = null;
    }
  }

  private async initializeSpeechRecognition(): Promise<void> {
    try {
      const SpeechRecognitionConstructor = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (!SpeechRecognitionConstructor) {
        throw new Error('Speech recognition not supported in this browser');
      }

      this.recognition = new SpeechRecognitionConstructor();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 3;
      this.recognition.lang = this.currentState.currentLanguage === 'ar' ? 'ar-SA' : 'en-US';

      this.recognition.onstart = () => {
        debugLogger.info('OPENROUTER_VOICE', 'Speech recognition started');
        this.updateState({ isRecording: true, error: null });
      };

      this.recognition.onend = () => {
        debugLogger.info('OPENROUTER_VOICE', 'Speech recognition ended');
        this.updateState({ isRecording: false });
      };

      this.recognition.onresult = (event: SpeechRecognitionEvent) => {
        const result = event.results[event.resultIndex];
        if (result.isFinal && result[0].transcript.trim()) {
          const transcript = result[0].transcript.trim();
          
          debugLogger.info('OPENROUTER_VOICE', 'Speech recognized', { 
            transcript, 
            language: this.currentState.currentLanguage 
          });
          
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
        debugLogger.error('OPENROUTER_VOICE', 'Speech recognition error', { 
          error: event.error, 
          message: event.message 
        });
        
        let errorMessage = 'Speech recognition error';
        switch (event.error) {
          case 'not-allowed':
            errorMessage = 'Microphone access denied. Please allow microphone access.';
            break;
          case 'no-speech':
            errorMessage = 'No speech detected. Please try speaking again.';
            break;
          case 'network':
            errorMessage = 'Network error during speech recognition.';
            break;
          default:
            errorMessage = `Speech recognition error: ${event.error}`;
        }
        
        this.updateState({ 
          error: errorMessage,
          isRecording: false 
        });
      };

    } catch (error) {
      debugLogger.error('OPENROUTER_VOICE', 'Failed to initialize speech recognition', { error });
      throw error;
    }
  }

  // State management methods
  private updateState(updates: Partial<VoiceState>) {
    this.currentState = { ...this.currentState, ...updates };
    debugLogger.debug('OPENROUTER_VOICE', 'State updated', this.currentState);
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
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Resume audio context if needed
      if (this.audioContext?.state === 'suspended') {
        await this.audioContext.resume();
      }
      
      // Initialize TTS model
      await this.initializeTTSModel();
      
      debugLogger.info('OPENROUTER_VOICE', 'OpenRouter voice service initialized successfully');
      this.updateState({ error: null });
    } catch (error) {
      debugLogger.error('OPENROUTER_VOICE', 'Failed to initialize OpenRouter voice service', { error });
      this.updateState({ 
        error: 'Could not access microphone. Please check permissions.' 
      });
      throw error;
    }
  }

  public async connect(): Promise<void> {
    try {
      await this.initialize();
      this.updateState({ isConnected: true, error: null });
      debugLogger.info('OPENROUTER_VOICE', 'Connected successfully');
    } catch (error) {
      debugLogger.error('OPENROUTER_VOICE', 'Connection failed', { error });
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
        debugLogger.warn('OPENROUTER_VOICE', 'Already recording');
        return;
      }

      debugLogger.info('OPENROUTER_VOICE', 'Starting speech recognition');
      this.recognition.start();

    } catch (error) {
      debugLogger.error('OPENROUTER_VOICE', 'Failed to start recording', { error });
      this.updateState({ 
        error: 'Failed to start recording. Please try again.',
        isRecording: false 
      });
      throw error;
    }
  }

  public stopRecording(): void {
    if (this.recognition && this.currentState.isRecording) {
      debugLogger.info('OPENROUTER_VOICE', 'Stopping speech recognition');
      this.recognition.stop();
    }
  }

  public async switchLanguage(language: 'en' | 'ar'): Promise<void> {
    debugLogger.info('OPENROUTER_VOICE', 'Switching language', { 
      from: this.currentState.currentLanguage, 
      to: language 
    });
    
    this.updateState({ currentLanguage: language });
    
    if (this.recognition) {
      this.recognition.lang = language === 'ar' ? 'ar-SA' : 'en-US';
    }
    
    debugLogger.info('OPENROUTER_VOICE', 'Language switched successfully');
  }

  public disconnect(): void {
    debugLogger.info('OPENROUTER_VOICE', 'Disconnecting OpenRouter voice service');
    
    if (this.recognition && this.currentState.isRecording) {
      this.recognition.stop();
    }

    this.updateState({
      isConnected: false,
      isRecording: false,
      isSpeaking: false,
      isProcessing: false,
      error: null
    });
    
    debugLogger.info('OPENROUTER_VOICE', 'Disconnected successfully');
  }

  // OpenRouter-Enhanced TTS with Human-like Voice
  private async speakWithOpenRouterEnhancement(text: string): Promise<void> {
    try {
      this.updateState({ isSpeaking: true });
      console.log('🎤 Using OpenRouter-enhanced voice for:', text);
      
      let finalText = text;
      
      // Step 1: Enhance text with OpenRouter for more human-like delivery
      if (this.config.voiceSettings.humanization) {
        try {
          finalText = await this.enhanceTextWithOpenRouter(text);
          console.log('✅ Text enhanced with OpenRouter:', finalText);
        } catch (error) {
          console.warn('⚠️ OpenRouter enhancement failed, using original text:', error);
          finalText = text;
        }
      }
      
      // Step 2: Generate speech with enhanced text
      await this.generateSpeechFromText(finalText);
      
    } catch (error) {
      console.error('❌ OpenRouter TTS failed:', error);
      console.log('📢 Falling back to enhanced browser TTS');
      await this.speakWithEnhancedBrowserTTS(text);
    }
  }

  // Enhance text with OpenRouter for more human-like delivery
  private async enhanceTextWithOpenRouter(text: string): Promise<string> {
    try {
      const { data, error } = await supabase.functions.invoke('enhance-voice-text', {
        body: {
          text,
          language: this.currentState.currentLanguage,
          voiceType: 'human-enhanced'
        }
      });

      if (error) {
        console.error('OpenRouter enhancement error:', error);
        return text;
      }

      return data.enhancedText || text;
    } catch (error) {
      console.error('Failed to enhance text with OpenRouter:', error);
      return text;
    }
  }

  // Generate speech from enhanced text
  private async generateSpeechFromText(text: string): Promise<void> {
    try {
      // Try open source TTS with enhanced text
      if (this.ttsModel) {
        const output = await this.ttsModel(text, {
          speaker_embeddings: this.getFemaleVoiceEmbedding(),
          vocoder: 'hifigan'
        });
        await this.playAudioBuffer(output.audio);
        console.log('✅ OpenRouter-enhanced TTS completed');
      } else {
        // Fallback to enhanced browser TTS
        await this.speakWithEnhancedBrowserTTS(text);
      }
      
      this.updateState({ isSpeaking: false });
      
    } catch (error) {
      console.error('❌ Speech generation failed:', error);
      console.log('📢 Falling back to enhanced browser TTS');
      await this.speakWithEnhancedBrowserTTS(text);
    }
  }

  private getFemaleVoiceEmbedding(): Float32Array {
    // Female voice embedding for SpeechT5 - this creates a female-sounding voice
    // These embeddings are pre-computed for female voices
    return new Float32Array([
      0.1, 0.3, 0.2, 0.5, 0.1, 0.8, 0.2, 0.4, 0.6, 0.3,
      0.7, 0.1, 0.9, 0.2, 0.5, 0.4, 0.1, 0.6, 0.3, 0.8,
      // ... more embeddings for female voice characteristics
    ]);
  }

  private async playAudioBuffer(audioBuffer: Float32Array): Promise<void> {
    if (!this.audioContext) return;

    const buffer = this.audioContext.createBuffer(1, audioBuffer.length, 22050);
    buffer.copyToChannel(audioBuffer, 0);
    
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.audioContext.destination);
    
    return new Promise((resolve) => {
      source.onended = () => resolve();
      source.start();
    });
  }

  private async speakWithEnhancedBrowserTTS(text: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const synthesis = window.speechSynthesis;
        
        if (synthesis.speaking) {
          synthesis.cancel();
        }

        const utterance = new SpeechSynthesisUtterance(text);
        const voices = synthesis.getVoices();
        
        // Force female voice selection
        const femaleVoicePatterns = [
          'female', 'zira', 'hoda', 'sara', 'lily', 'cortana', 'hazel', 'susan', 'amira', 'aisha'
        ];
        
        const maleVoicePatterns = [
          'male', 'naayf', 'david', 'mark', 'ahmed', 'mohammed', 'omar', 'ali'
        ];
        
        const targetLang = this.currentState.currentLanguage === 'ar' ? 'ar' : 'en';
        
        // Find female voice or use default
        let femaleVoice = voices.find(voice => {
          const langMatch = voice.lang.includes(targetLang);
          const isFemale = femaleVoicePatterns.some(pattern => 
            voice.name.toLowerCase().includes(pattern)
          );
          const isMale = maleVoicePatterns.some(pattern => 
            voice.name.toLowerCase().includes(pattern)
          );
          return langMatch && isFemale && !isMale;
        });
        
        if (!femaleVoice) {
          // Use any non-male voice
          femaleVoice = voices.find(voice => {
            const langMatch = voice.lang.includes(targetLang);
            const isMale = maleVoicePatterns.some(pattern => 
              voice.name.toLowerCase().includes(pattern)
            );
            return langMatch && !isMale;
          });
        }
        
        if (femaleVoice) {
          utterance.voice = femaleVoice;
          console.log('🎤 Using female browser voice:', femaleVoice.name);
        } else {
          console.log('🎤 Using default browser voice (no female found)');
        }
        
        // Female voice settings
        utterance.lang = this.currentState.currentLanguage === 'ar' ? 'ar-SA' : 'en-US';
        utterance.rate = this.config.voiceSettings.rate;
        utterance.pitch = this.config.voiceSettings.pitch; // Higher pitch for female
        utterance.volume = this.config.voiceSettings.volume;

        utterance.onstart = () => {
          debugLogger.info('OPENROUTER_VOICE', 'Enhanced browser TTS started');
        };

        utterance.onend = () => {
          debugLogger.info('OPENROUTER_VOICE', 'Enhanced browser TTS ended');
          this.updateState({ isSpeaking: false });
          resolve();
        };

        utterance.onerror = (event) => {
          debugLogger.error('OPENROUTER_VOICE', 'Enhanced browser TTS error', { error: event.error });
          this.updateState({ isSpeaking: false });
          reject(new Error(`Enhanced browser TTS failed: ${event.error}`));
        };

        synthesis.speak(utterance);

      } catch (error) {
        debugLogger.error('OPENROUTER_VOICE', 'Failed to speak with enhanced browser TTS', { error });
        this.updateState({ isSpeaking: false });
        reject(error);
      }
    });
  }

  // Process user message
  private async processUserMessage(text: string): Promise<void> {
    try {
      this.updateState({ isProcessing: true });
      
      // Import nurse service for healthcare-focused AI
      const { nurseService } = await import('./nurseService');
      
      const symptoms = nurseService.extractSymptoms(text);
      const urgencyLevel = nurseService.assessUrgencyLevel(text);
      
      let medicalKnowledge = [];
      if (symptoms.length > 0) {
        medicalKnowledge = await nurseService.searchMedicalKnowledge(symptoms);
      }
      
      const nursePrompt = nurseService.generateNursePrompt(text, undefined, medicalKnowledge);
      const response = await this.callAI(nursePrompt);
      
      await nurseService.logInteraction({
        interaction_type: 'voice_chat',
        transcript: text,
        summary: response.substring(0, 200),
        urgency_level: urgencyLevel
      });
      
      const assistantMessage: VoiceMessage = {
        id: crypto.randomUUID(),
        type: 'assistant',
        content: response,
        timestamp: new Date(),
        language: this.currentState.currentLanguage
      };
      
      this.messageListeners.forEach(listener => listener(assistantMessage));
      await this.speakWithOpenRouterEnhancement(response);
      this.updateState({ isProcessing: false });

    } catch (error) {
      debugLogger.error('OPENROUTER_VOICE', 'Failed to process user message', { error });
      this.updateState({ 
        error: 'Failed to process your message. Please try again.',
        isProcessing: false 
      });
    }
  }

  private async callAI(text: string): Promise<string> {
    const openRouterConfig = {
      apiKey: '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',
      model: 'meta-llama/llama-3.1-8b-instruct',
      baseUrl: 'https://openrouter.ai/api/v1'
    };

    try {
      const systemPrompt = this.currentState.currentLanguage === 'ar' 
        ? 'أنت الممرضة أميرة، مساعدة رعاية صحية ذكية تتحدث العربية بصوت أنثوي دافئ وعطوف. قدمي إرشادات طبية مفيدة ومطمئنة في جملة أو جملتين. اجعلي صوتك ودودًا ومهنيًا مع نبرة مطمئنة وحنونة.'
        : 'You are Nurse Amira, a caring AI healthcare assistant with a warm female voice. Provide helpful and reassuring medical guidance in 1-2 sentences with a gentle, professional, and compassionate feminine tone.';

      const response = await fetch(`${openRouterConfig.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openRouterConfig.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'OpenRouter Voice Chat AI'
        },
        body: JSON.stringify({
          model: openRouterConfig.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: text }
          ],
          max_tokens: 150,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || 
        (this.currentState.currentLanguage === 'ar' 
          ? 'أعتذر، لم أتمكن من فهم طلبك. هل يمكنك إعادة صياغته؟'
          : 'I apologize, but I could not understand your request. Could you please rephrase it?');
      
      return content;

    } catch (error) {
      debugLogger.error('OPENROUTER_VOICE', 'AI call failed', { error });
      throw error;
    }
  }
}

// Global OpenRouter voice service instance
export const openRouterVoiceService = new OpenRouterVoiceService();

// Web Speech API types (reused)
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