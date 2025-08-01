// Enhanced Voice Service with ElevenLabs support for better voice quality
import { VoiceState, VoiceMessage } from '@/types/voice';
import { debugLogger } from '@/utils/debugLogger';

// Enhanced voice configuration
interface EnhancedVoiceConfig {
  elevenLabsApiKey?: string;
  voices: {
    ar: {
      elevenLabs: string; // ElevenLabs voice ID for Arabic
      fallback: string; // Browser voice name fallback
    };
    en: {
      elevenLabs: string; // ElevenLabs voice ID for English  
      fallback: string; // Browser voice name fallback
    };
  };
  speechSettings: {
    rate: number;
    pitch: number;
    volume: number;
  };
}

export class EnhancedVoiceService {
  private recognition: SpeechRecognition | null = null;
  private synthesis: SpeechSynthesis;
  private config: EnhancedVoiceConfig;
  private audioContext: AudioContext | null = null;
  
  private stateListeners: Set<(state: VoiceState) => void> = new Set();
  private messageListeners: Set<(message: VoiceMessage) => void> = new Set();
  
  private currentState: VoiceState = {
    isConnected: false,
    isRecording: false,
    isSpeaking: false,
    isProcessing: false,
    error: null,
    currentLanguage: 'ar' // Default to Arabic
  };

  constructor() {
    this.config = {
      voices: {
        ar: {
          elevenLabs: 'EXAVITQu4vr4xnSDxMaL', // Sarah - warm female voice adapted for Arabic
          fallback: 'Microsoft Hoda Desktop - Arabic (Saudi Arabia)'
        },
        en: {
          elevenLabs: 'pFZP5JQG7iQjIQuC4Bku', // Lily - natural female English voice
          fallback: 'Microsoft Zira Desktop - English (United States)'
        }
      },
      speechSettings: {
        rate: 0.8, // Slower for more caring delivery
        pitch: 1.1, // Slightly higher for feminine voice
        volume: 0.9
      }
    };
    
    this.synthesis = window.speechSynthesis;
    this.initializeServices();
  }

  private async initializeServices(): Promise<void> {
    try {
      // Initialize audio context
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Initialize speech recognition
      await this.initializeSpeechRecognition();
      
      debugLogger.info('ENHANCED_VOICE', 'Enhanced voice service initialized');
    } catch (error) {
      debugLogger.error('ENHANCED_VOICE', 'Failed to initialize enhanced voice service', { error });
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
      this.recognition.interimResults = true; // Enable interim results for better UX
      this.recognition.maxAlternatives = 3; // Get multiple alternatives
      this.recognition.lang = this.currentState.currentLanguage === 'ar' ? 'ar-SA' : 'en-US';

      this.recognition.onstart = () => {
        debugLogger.info('ENHANCED_VOICE', 'Speech recognition started');
        this.updateState({ isRecording: true, error: null });
      };

      this.recognition.onend = () => {
        debugLogger.info('ENHANCED_VOICE', 'Speech recognition ended');
        this.updateState({ isRecording: false });
      };

      this.recognition.onresult = (event: SpeechRecognitionEvent) => {
        const result = event.results[event.resultIndex];
        if (result.isFinal && result[0].transcript.trim()) {
          const transcript = result[0].transcript.trim();
          const confidence = result[0].confidence;
          
          debugLogger.info('ENHANCED_VOICE', 'Speech recognized', { 
            transcript, 
            confidence,
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
        debugLogger.error('ENHANCED_VOICE', 'Speech recognition error', { 
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
      debugLogger.error('ENHANCED_VOICE', 'Failed to initialize speech recognition', { error });
      throw error;
    }
  }

  // State management methods
  private updateState(updates: Partial<VoiceState>) {
    this.currentState = { ...this.currentState, ...updates };
    debugLogger.debug('ENHANCED_VOICE', 'State updated', this.currentState);
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
      
      debugLogger.info('ENHANCED_VOICE', 'Enhanced voice service initialized successfully');
      this.updateState({ error: null });
    } catch (error) {
      debugLogger.error('ENHANCED_VOICE', 'Failed to initialize enhanced voice service', { error });
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
      debugLogger.info('ENHANCED_VOICE', 'Connected successfully');
    } catch (error) {
      debugLogger.error('ENHANCED_VOICE', 'Connection failed', { error });
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
        debugLogger.warn('ENHANCED_VOICE', 'Already recording');
        return;
      }

      debugLogger.info('ENHANCED_VOICE', 'Starting speech recognition');
      this.recognition.start();

    } catch (error) {
      debugLogger.error('ENHANCED_VOICE', 'Failed to start recording', { error });
      this.updateState({ 
        error: 'Failed to start recording. Please try again.',
        isRecording: false 
      });
      throw error;
    }
  }

  public stopRecording(): void {
    if (this.recognition && this.currentState.isRecording) {
      debugLogger.info('ENHANCED_VOICE', 'Stopping speech recognition');
      this.recognition.stop();
    }
  }

  public async switchLanguage(language: 'en' | 'ar'): Promise<void> {
    debugLogger.info('ENHANCED_VOICE', 'Switching language', { 
      from: this.currentState.currentLanguage, 
      to: language 
    });
    
    this.updateState({ currentLanguage: language });
    
    if (this.recognition) {
      this.recognition.lang = language === 'ar' ? 'ar-SA' : 'en-US';
    }
    
    debugLogger.info('ENHANCED_VOICE', 'Language switched successfully');
  }

  public setElevenLabsApiKey(apiKey: string): void {
    this.config.elevenLabsApiKey = apiKey;
    localStorage.setItem('elevenlabs-api-key', apiKey);
    debugLogger.info('ENHANCED_VOICE', 'ElevenLabs API key updated');
  }

  public disconnect(): void {
    debugLogger.info('ENHANCED_VOICE', 'Disconnecting enhanced voice service');
    
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
    
    debugLogger.info('ENHANCED_VOICE', 'Disconnected successfully');
  }

  // Enhanced text-to-speech with ElevenLabs fallback
  private async speakTextEnhanced(text: string): Promise<void> {
    try {
      this.updateState({ isSpeaking: true });
      
      // Try ElevenLabs first if API key is available
      if (this.config.elevenLabsApiKey) {
        const success = await this.speakWithElevenLabs(text);
        if (success) {
          this.updateState({ isSpeaking: false });
          return;
        }
      }
      
      // Fallback to enhanced browser TTS
      await this.speakWithBrowserTTS(text);
      this.updateState({ isSpeaking: false });
      
    } catch (error) {
      debugLogger.error('ENHANCED_VOICE', 'Failed to speak text', { error });
      this.updateState({ isSpeaking: false });
      throw error;
    }
  }

  private async speakWithElevenLabs(text: string): Promise<boolean> {
    try {
      if (!this.config.elevenLabsApiKey) return false;
      
      const voiceId = this.config.voices[this.currentState.currentLanguage].elevenLabs;
      
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': this.config.elevenLabsApiKey
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.8,
            style: 0.2,
            use_speaker_boost: true
          }
        })
      });

      if (!response.ok) {
        debugLogger.warn('ENHANCED_VOICE', 'ElevenLabs API failed', { status: response.status });
        return false;
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      return new Promise((resolve) => {
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          resolve(true);
        };
        audio.onerror = () => {
          URL.revokeObjectURL(audioUrl);
          resolve(false);
        };
        audio.play();
      });
      
    } catch (error) {
      debugLogger.error('ENHANCED_VOICE', 'ElevenLabs TTS failed', { error });
      return false;
    }
  }

  private async speakWithBrowserTTS(text: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        if (this.synthesis.speaking) {
          this.synthesis.cancel();
        }

        const utterance = new SpeechSynthesisUtterance(text);
        const voices = this.synthesis.getVoices();
        
        // Enhanced voice selection - prioritize female voices and EXCLUDE male voices
        const targetLang = this.currentState.currentLanguage === 'ar' ? 'ar' : 'en';
        
        // Define female voice patterns (comprehensive list)
        const femaleVoicePatterns = [
          // English female names
          'female', 'zira', 'sara', 'lily', 'cortana', 'hazel', 'susan', 'emma', 'ava', 'aria',
          'eva', 'amy', 'kate', 'anna', 'mary', 'jenny', 'sophia', 'olivia', 'isabella',
          // Arabic female names  
          'hoda', 'amira', 'aisha', 'fatima', 'khadija', 'maryam', 'zahra', 'layla', 'nour',
          'salma', 'rania', 'dina', 'maya', 'lina', 'yasmin', 'rana', 'sara'
        ];
        
        // Define male voice patterns to EXCLUDE
        const maleVoicePatterns = [
          // English male names
          'male', 'david', 'mark', 'paul', 'richard', 'james', 'john', 'michael', 'william',
          'daniel', 'matthew', 'christopher', 'andrew', 'joshua', 'ryan', 'brandon',
          // Arabic male names
          'naayf', 'ahmed', 'mohammed', 'omar', 'ali', 'hassan', 'khalid', 'youssef', 'amr',
          'tamer', 'kareem', 'fadi', 'rami', 'waleed', 'sami', 'tariq', 'nasser', 'abdulla'
        ];
        
        console.log('🔍 Available voices for', targetLang + ':', voices.filter(v => v.lang.includes(targetLang)).map(v => ({
          name: v.name,
          lang: v.lang,
          isFemale: femaleVoicePatterns.some(pattern => v.name.toLowerCase().includes(pattern)),
          isMale: maleVoicePatterns.some(pattern => v.name.toLowerCase().includes(pattern))
        })));
        
        // First try: find FEMALE voices and EXCLUDE male voices
        let selectedVoice = voices.find(voice => {
          const langMatch = voice.lang.includes(targetLang);
          const isFemale = femaleVoicePatterns.some(pattern => 
            voice.name.toLowerCase().includes(pattern)
          );
          const isMale = maleVoicePatterns.some(pattern => 
            voice.name.toLowerCase().includes(pattern)
          );
          
          console.log('🔍 Checking voice:', voice.name, { langMatch, isFemale, isMale });
          
          return langMatch && isFemale && !isMale; // Must be female AND not male
        });
        
        // Second try: any non-male voice of target language
        if (!selectedVoice) {
          console.log('⚠️ No female voice found, trying non-male voices...');
          selectedVoice = voices.find(voice => {
            const langMatch = voice.lang.includes(targetLang);
            const isMale = maleVoicePatterns.some(pattern => 
              voice.name.toLowerCase().includes(pattern)
            );
            return langMatch && !isMale; // Exclude male voices
          });
        }
        
        // Third try: CROSS-LANGUAGE FEMALE FALLBACK - use English female for Arabic if needed
        if (!selectedVoice && targetLang === 'ar') {
          console.log('⚠️ No Arabic female voice found, trying English female voices...');
          selectedVoice = voices.find(voice => {
            const isEnglish = voice.lang.includes('en');
            const isFemale = femaleVoicePatterns.some(pattern => 
              voice.name.toLowerCase().includes(pattern)
            );
            const isMale = maleVoicePatterns.some(pattern => 
              voice.name.toLowerCase().includes(pattern)
            );
            return isEnglish && isFemale && !isMale;
          });
          
          if (selectedVoice) {
            console.log('✅ Using English female voice for Arabic text:', selectedVoice.name);
          }
        }
        
        // Fourth try: REFUSE to use male voices - show error instead
        if (!selectedVoice) {
          console.error('🚨 NO FEMALE VOICES AVAILABLE - REFUSING TO USE MALE VOICE');
          // Don't set selectedVoice - this will cause the utterance to use default
          // which might be better than forcing a male voice
        }
        
        if (selectedVoice) {
          const isFemale = femaleVoicePatterns.some(pattern => 
            selectedVoice!.name.toLowerCase().includes(pattern)
          );
          const isMale = maleVoicePatterns.some(pattern => 
            selectedVoice!.name.toLowerCase().includes(pattern)
          );
          
          utterance.voice = selectedVoice;
          
          const genderInfo = isFemale ? 'Female ✅' : isMale ? 'Male ❌' : 'Unknown';
          
          debugLogger.info('ENHANCED_VOICE', 'Selected voice', { 
            name: selectedVoice.name, 
            lang: selectedVoice.lang,
            gender: genderInfo
          });
          
          console.log('🎤 FINAL VOICE SELECTION:', {
            name: selectedVoice.name,
            language: selectedVoice.lang,
            gender: genderInfo,
            targetWasFemale: true
          });
          
          if (isMale) {
            console.error('🚨 CRITICAL: MALE VOICE SELECTED - THIS IS A BUG!');
            // OVERRIDE: Don't use male voice, use default instead
            utterance.voice = null;
            console.log('🔄 OVERRIDING MALE VOICE - Using browser default');
          }
        } else {
          console.error('⚠️ No suitable voice found for language:', targetLang);
          console.log('🔄 Using browser default voice');
        }
        
        // Enhanced speech settings
        utterance.lang = this.currentState.currentLanguage === 'ar' ? 'ar-SA' : 'en-US';
        utterance.rate = this.config.speechSettings.rate;
        utterance.pitch = this.currentState.currentLanguage === 'ar' ? 1.1 : 0.95;
        utterance.volume = this.config.speechSettings.volume;

        utterance.onstart = () => {
          debugLogger.info('ENHANCED_VOICE', 'Browser TTS started');
        };

        utterance.onend = () => {
          debugLogger.info('ENHANCED_VOICE', 'Browser TTS ended');
          resolve();
        };

        utterance.onerror = (event) => {
          debugLogger.error('ENHANCED_VOICE', 'Browser TTS error', { error: event.error });
          reject(new Error(`Browser TTS failed: ${event.error}`));
        };

        this.synthesis.speak(utterance);

      } catch (error) {
        debugLogger.error('ENHANCED_VOICE', 'Failed to speak with browser TTS', { error });
        reject(error);
      }
    });
  }

  // Process user message (same as original but with enhanced logging)
  private async processUserMessage(text: string): Promise<void> {
    try {
      this.updateState({ isProcessing: true });
      
      // Import nurse service for healthcare-focused AI
      const { nurseService } = await import('./nurseService');
      
      // Enhanced medical processing
      const symptoms = nurseService.extractSymptoms(text);
      const urgencyLevel = nurseService.assessUrgencyLevel(text);
      
      let medicalKnowledge = [];
      if (symptoms.length > 0) {
        medicalKnowledge = await nurseService.searchMedicalKnowledge(symptoms);
      }
      
      const nursePrompt = nurseService.generateNursePrompt(text, undefined, medicalKnowledge);
      
      // Enhanced AI call with better error handling
      const response = await this.callEnhancedAI(nursePrompt);
      
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
      await this.speakTextEnhanced(response);
      this.updateState({ isProcessing: false });

    } catch (error) {
      debugLogger.error('ENHANCED_VOICE', 'Failed to process user message', { error });
      this.updateState({ 
        error: 'Failed to process your message. Please try again.',
        isProcessing: false 
      });
    }
  }

  private async callEnhancedAI(text: string): Promise<string> {
    // Reuse the OpenRouter configuration from the original service
    const openRouterConfig = {
      apiKey: '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',
      model: 'meta-llama/llama-3.1-8b-instruct',
      baseUrl: 'https://openrouter.ai/api/v1'
    };

    try {
      const systemPrompt = this.currentState.currentLanguage === 'ar' 
        ? 'أنت الممرضة عميرة، مساعدة رعاية صحية ذكية تتحدث العربية بطريقة دافئة وعطوفة. قدمي إرشادات طبية مفيدة ومطمئنة في جملة أو جملتين. اجعلي صوتك ودودًا ومهنيًا مع نبرة مطمئنة وحنونة.'
        : 'You are Nurse Amira, a caring AI healthcare assistant. Provide helpful and reassuring medical guidance in 1-2 sentences with a warm, professional, and compassionate tone.';

      const response = await fetch(`${openRouterConfig.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openRouterConfig.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Enhanced Voice Chat AI'
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
      debugLogger.error('ENHANCED_VOICE', 'Enhanced AI call failed', { error });
      throw error;
    }
  }
}

// Global enhanced voice service instance
export const enhancedVoiceService = new EnhancedVoiceService();

// Web Speech API types (reused from original)
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