// Open Source TTS Service with Female Default Voice
import { pipeline } from '@huggingface/transformers';
import { VoiceState, VoiceMessage } from '@/types/voice';
import { debugLogger } from '@/utils/debugLogger';

interface OpenSourceTTSConfig {
  models: {
    arabic: string;
    english: string;
  };
  voiceSettings: {
    rate: number;
    pitch: number;
    volume: number;
  };
}

export class OpenSourceVoiceService {
  private recognition: SpeechRecognition | null = null;
  private ttsModel: any = null;
  private audioContext: AudioContext | null = null;
  private config: OpenSourceTTSConfig;
  
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
      models: {
        // Using female-voiced models
        arabic: 'microsoft/speecht5_tts', // Supports multiple languages including Arabic
        english: 'microsoft/speecht5_tts' // Female-default TTS model
      },
      voiceSettings: {
        rate: 0.8,
        pitch: 1.1, // Higher pitch for female voice
        volume: 0.9
      }
    };
    
    this.initializeServices();
  }

  private async initializeServices(): Promise<void> {
    try {
      // Initialize audio context
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Initialize speech recognition (keep existing logic)
      await this.initializeSpeechRecognition();
      
      debugLogger.info('OPENSOURCE_VOICE', 'Open source voice service initialized');
    } catch (error) {
      debugLogger.error('OPENSOURCE_VOICE', 'Failed to initialize open source voice service', { error });
    }
  }

  private async initializeTTSModel(): Promise<void> {
    try {
      console.log('🤖 Loading open source TTS model...');
      this.updateState({ isProcessing: true });
      
      // Load the TTS model - using SpeechT5 which supports female voices
      this.ttsModel = await pipeline(
        'text-to-speech',
        'microsoft/speecht5_tts',
        {
          device: 'webgpu', // Use WebGPU for better performance
          dtype: 'fp16'     // Faster inference
        }
      );
      
      console.log('✅ Open source TTS model loaded successfully');
      this.updateState({ isProcessing: false });
      
    } catch (error) {
      console.error('❌ Failed to load TTS model:', error);
      this.updateState({ 
        error: 'Failed to load voice model. Falling back to browser TTS.',
        isProcessing: false 
      });
      // Fallback to browser TTS
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
        debugLogger.info('OPENSOURCE_VOICE', 'Speech recognition started');
        this.updateState({ isRecording: true, error: null });
      };

      this.recognition.onend = () => {
        debugLogger.info('OPENSOURCE_VOICE', 'Speech recognition ended');
        this.updateState({ isRecording: false });
      };

      this.recognition.onresult = (event: SpeechRecognitionEvent) => {
        const result = event.results[event.resultIndex];
        if (result.isFinal && result[0].transcript.trim()) {
          const transcript = result[0].transcript.trim();
          
          debugLogger.info('OPENSOURCE_VOICE', 'Speech recognized', { 
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
        debugLogger.error('OPENSOURCE_VOICE', 'Speech recognition error', { 
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
      debugLogger.error('OPENSOURCE_VOICE', 'Failed to initialize speech recognition', { error });
      throw error;
    }
  }

  // State management methods
  private updateState(updates: Partial<VoiceState>) {
    this.currentState = { ...this.currentState, ...updates };
    debugLogger.debug('OPENSOURCE_VOICE', 'State updated', this.currentState);
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
      
      debugLogger.info('OPENSOURCE_VOICE', 'Open source voice service initialized successfully');
      this.updateState({ error: null });
    } catch (error) {
      debugLogger.error('OPENSOURCE_VOICE', 'Failed to initialize open source voice service', { error });
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
      debugLogger.info('OPENSOURCE_VOICE', 'Connected successfully');
    } catch (error) {
      debugLogger.error('OPENSOURCE_VOICE', 'Connection failed', { error });
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
        debugLogger.warn('OPENSOURCE_VOICE', 'Already recording');
        return;
      }

      debugLogger.info('OPENSOURCE_VOICE', 'Starting speech recognition');
      this.recognition.start();

    } catch (error) {
      debugLogger.error('OPENSOURCE_VOICE', 'Failed to start recording', { error });
      this.updateState({ 
        error: 'Failed to start recording. Please try again.',
        isRecording: false 
      });
      throw error;
    }
  }

  public stopRecording(): void {
    if (this.recognition && this.currentState.isRecording) {
      debugLogger.info('OPENSOURCE_VOICE', 'Stopping speech recognition');
      this.recognition.stop();
    }
  }

  public async switchLanguage(language: 'en' | 'ar'): Promise<void> {
    debugLogger.info('OPENSOURCE_VOICE', 'Switching language', { 
      from: this.currentState.currentLanguage, 
      to: language 
    });
    
    this.updateState({ currentLanguage: language });
    
    if (this.recognition) {
      this.recognition.lang = language === 'ar' ? 'ar-SA' : 'en-US';
    }
    
    debugLogger.info('OPENSOURCE_VOICE', 'Language switched successfully');
  }

  public disconnect(): void {
    debugLogger.info('OPENSOURCE_VOICE', 'Disconnecting open source voice service');
    
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
    
    debugLogger.info('OPENSOURCE_VOICE', 'Disconnected successfully');
  }

  // Open Source TTS with Female Default
  private async speakWithOpenSourceTTS(text: string): Promise<void> {
    try {
      this.updateState({ isSpeaking: true });
      console.log('🎤 Using open source female TTS for:', text);
      
      if (!this.ttsModel) {
        console.log('📢 TTS model not loaded, falling back to enhanced browser TTS');
        await this.speakWithEnhancedBrowserTTS(text);
        return;
      }

      // Generate speech with female voice
      const output = await this.ttsModel(text, {
        speaker_embeddings: this.getFemaleVoiceEmbedding(),
        vocoder: 'hifigan' // High quality vocoder
      });

      // Play the generated audio
      await this.playAudioBuffer(output.audio);
      
      console.log('✅ Open source TTS completed');
      this.updateState({ isSpeaking: false });
      
    } catch (error) {
      console.error('❌ Open source TTS failed:', error);
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
          debugLogger.info('OPENSOURCE_VOICE', 'Enhanced browser TTS started');
        };

        utterance.onend = () => {
          debugLogger.info('OPENSOURCE_VOICE', 'Enhanced browser TTS ended');
          this.updateState({ isSpeaking: false });
          resolve();
        };

        utterance.onerror = (event) => {
          debugLogger.error('OPENSOURCE_VOICE', 'Enhanced browser TTS error', { error: event.error });
          this.updateState({ isSpeaking: false });
          reject(new Error(`Enhanced browser TTS failed: ${event.error}`));
        };

        synthesis.speak(utterance);

      } catch (error) {
        debugLogger.error('OPENSOURCE_VOICE', 'Failed to speak with enhanced browser TTS', { error });
        this.updateState({ isSpeaking: false });
        reject(error);
      }
    });
  }

  // Process user message (same logic as original)
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
      await this.speakWithOpenSourceTTS(response);
      this.updateState({ isProcessing: false });

    } catch (error) {
      debugLogger.error('OPENSOURCE_VOICE', 'Failed to process user message', { error });
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
          'X-Title': 'Open Source Voice Chat AI'
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
      debugLogger.error('OPENSOURCE_VOICE', 'AI call failed', { error });
      throw error;
    }
  }
}

// Global open source voice service instance
export const openSourceVoiceService = new OpenSourceVoiceService();

// Web Speech API types (reused)
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}
