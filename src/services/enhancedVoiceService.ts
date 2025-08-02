// Enhanced Voice Service with ElevenLabs support for better voice quality
import { VoiceState, VoiceMessage } from '@/types/voice';
import { debugLogger } from '@/utils/debugLogger';
import { intelligentResponseService } from './intelligentResponseService';
import { memoryService } from './memoryService';

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
  private currentAudio: HTMLAudioElement | null = null; // Track current audio for interruption
  private currentUtterance: SpeechSynthesisUtterance | null = null; // Track TTS for interruption
  
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

  private userInfo: { name?: string; gender?: 'male' | 'female' } = {};

  constructor() {
    this.config = {
      elevenLabsApiKey: 'sk_dc0c45e8fa3c7c9d52db9617022ae16dabd2c7ebfa060958', // Default ElevenLabs API key
      voices: {
        ar: {
          elevenLabs: 'a1KZUXKFVFDOb33I1uqr', // Updated voice ID as requested
          fallback: 'Microsoft Hoda Desktop - Arabic (Saudi Arabia)'
        },
        en: {
          elevenLabs: 'a1KZUXKFVFDOb33I1uqr', // Same voice for both languages  
          fallback: 'Microsoft Zira Desktop - English (United States)'
        }
      },
      speechSettings: {
        rate: 0.8, // Slower for more caring delivery
        pitch: 1.1, // Slightly higher for feminine voice
        volume: 0.9
      }
    };
    
    // Save the API key to localStorage for persistence
    localStorage.setItem('elevenlabs-api-key', this.config.elevenLabsApiKey);
    
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

      // 🔇 CRITICAL: Stop AI audio when user wants to speak
      this.interruptAudio();

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

  public setUserInfo(name: string, gender: 'male' | 'female'): void {
    this.userInfo = { name, gender };
    debugLogger.info('ENHANCED_VOICE', 'User info updated', { name, gender });
  }

  public disconnect(): void {
    debugLogger.info('ENHANCED_VOICE', 'Disconnecting enhanced voice service');
    
    if (this.recognition && this.currentState.isRecording) {
      this.recognition.stop();
    }

    if (this.synthesis.speaking) {
      this.synthesis.cancel();
      this.currentUtterance = null;
    }

    // Clear any current audio references
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
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

  // 🔇 Interrupt current AI audio when user wants to speak
  public interruptAudio(): void {
    debugLogger.info('ENHANCED_VOICE', 'Interrupting AI audio for user speech');
    
    let wasInterrupted = false;
    
    // Stop ElevenLabs audio
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
      wasInterrupted = true;
      debugLogger.info('ENHANCED_VOICE', 'ElevenLabs audio interrupted');
    }
    
    // Stop browser TTS
    if (this.synthesis.speaking) {
      this.synthesis.cancel();
      this.currentUtterance = null;
      wasInterrupted = true;
      debugLogger.info('ENHANCED_VOICE', 'Browser TTS interrupted');
    }
    
    // Update state to reflect audio stopped
    if (this.currentState.isSpeaking || wasInterrupted) {
      this.updateState({ isSpeaking: false });
      debugLogger.info('ENHANCED_VOICE', 'Audio interruption complete - ready for user input');
    }
    
    return; // Ensure method completes cleanly
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
        const errorData = await response.json().catch(() => null);
        
        if (response.status === 401) {
          if (errorData?.detail?.message?.includes('missing_permissions')) {
            console.error('🚨 ElevenLabs API Key Error: Missing text_to_speech permission');
            this.updateState({ 
              error: 'ElevenLabs API key lacks text-to-speech permission. Using browser voice instead.' 
            });
          } else {
            console.error('🚨 ElevenLabs API Key Error: Invalid or expired API key');
            this.updateState({ 
              error: 'Invalid ElevenLabs API key. Using browser voice instead.' 
            });
          }
        } else {
          console.error('🚨 ElevenLabs API Error:', response.status, errorData);
        }
        
        debugLogger.warn('ENHANCED_VOICE', 'ElevenLabs API failed', { 
          status: response.status,
          error: errorData 
        });
        return false;
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      // Track current audio for interruption capability
      this.currentAudio = audio;
      
      return new Promise((resolve) => {
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          this.currentAudio = null; // Clear reference when done
          resolve(true);
        };
        audio.onerror = () => {
          URL.revokeObjectURL(audioUrl);
          this.currentAudio = null; // Clear reference on error
          resolve(false);
        };
        
        // Check if audio was interrupted before playing
        if (this.currentAudio === audio) {
          audio.play().catch(() => {
            this.currentAudio = null;
            resolve(false);
          });
        } else {
          // Audio was interrupted before we could play
          URL.revokeObjectURL(audioUrl);
          resolve(false);
        }
      });
      
    } catch (error) {
      debugLogger.error('ENHANCED_VOICE', 'ElevenLabs TTS failed', { error });
      return false;
    }
  }

  private async speakWithBrowserTTS(text: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Stop any existing audio first
        if (this.synthesis.speaking) {
          this.synthesis.cancel();
        }

        const utterance = new SpeechSynthesisUtterance(text);
        this.currentUtterance = utterance; // Track for interruption
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
          this.currentUtterance = null; // Clear reference when done
          resolve();
        };

        utterance.onerror = (event) => {
          debugLogger.error('ENHANCED_VOICE', 'Browser TTS error', { error: event.error });
          this.currentUtterance = null; // Clear reference on error
          reject(new Error(`Browser TTS failed: ${event.error}`));
        };

        // Only speak if not interrupted
        if (this.currentUtterance === utterance) {
          this.synthesis.speak(utterance);
        } else {
          // Was interrupted before we could speak
          resolve();
        }

      } catch (error) {
        debugLogger.error('ENHANCED_VOICE', 'Failed to speak with browser TTS', { error });
        reject(error);
      }
    });
  }

  // Process user message with intelligent routing and progress tracking
  private async processUserMessage(text: string): Promise<void> {
    try {
      this.updateState({ isProcessing: true, processingStep: 'analyzing' });
      
      // Use intelligent response service with progress tracking
      const response = await intelligentResponseService.processQuestion(
        text,
        this.currentState.currentLanguage,
        this.userInfo,
        (step) => {
          this.updateState({ processingStep: step.step });
        }
      );
      
      // Import nurse service for logging
      const { nurseService } = await import('./nurseService');
      
      // Log interaction for analytics
      await nurseService.logInteraction({
        interaction_type: 'voice_chat',
        transcript: text,
        summary: response.substring(0, 200),
        urgency_level: 'low' // Default, can be enhanced later
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
      this.updateState({ isProcessing: false, processingStep: null });

    } catch (error) {
      debugLogger.error('ENHANCED_VOICE', 'Failed to process user message', { error });
      this.updateState({ 
        error: 'Failed to process your message. Please try again.',
        isProcessing: false,
        processingStep: null
      });
    }
  }

  private async callEnhancedAI(text: string, healthcareContext?: string): Promise<string> {
    // Use Meta Llama 3.1 70B - Superior open-source model for medical reasoning
    const openRouterConfig = {
      apiKey: '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',
      model: 'openai/gpt-4.1-nano', // Upgraded from 8B to 70B for better medical reasoning
      baseUrl: 'https://openrouter.ai/api/v1'
    };

    try {
      // Create gender-specific prompts with proper terms
      const genderSpecificTerms = this.userInfo.gender === 'female' 
        ? (this.currentState.currentLanguage === 'ar' 
            ? '"شحالِش؟" "حبيبتي" "أختي" "وايد عليش" "عزيزتي" - استخدم الضمائر المؤنثة وقولي "عزيزتي" بدلاً من "حبيبي"'
            : '"girl", "sis", "dear" - use feminine terms')
        : (this.currentState.currentLanguage === 'ar' 
            ? '"شحالَك؟" "عزيزي" "أخوي" "وايد عليك" - استخدم الضمائر المذكرة وقول "عزيزي" بدلاً من "حبيبي"'
            : '"bro", "dude", "dear" - use masculine terms');

      const userContext = this.userInfo.name 
        ? (this.currentState.currentLanguage === 'ar' 
            ? `المستخدم اسمه ${this.userInfo.name}، ${genderSpecificTerms}.` 
            : `The user's name is ${this.userInfo.name}, ${genderSpecificTerms}.`)
        : genderSpecificTerms;

      const systemPrompt = this.currentState.currentLanguage === 'ar' 
        ? `أنت الممرضة أميرة، خبيرة طبية متخصصة في الرعاية الصحية الشاملة في عُمان. ${userContext}

**🏥 الخبرة الطبية المتقدمة:**
- متخصصة في الطب الباطني، طب الأطفال، النساء والولادة، والطب الوقائي
- خبرة واسعة في الأدوية العُمانية والخليجية المتاحة محلياً
- معرفة عميقة بالنظام الصحي العُماني والمستشفيات والعيادات
- فهم للطب التقليدي العُماني والأعشاب المحلية المفيدة

**💬 التواصل والأسلوب:**
- تكلم باللهجة الخليجية العُمانية الطبيعية والودودة مع المصطلحات الطبية الواضحة
- استخدم كلمات مثل: "شحالك؟" "واجد زين" "خلاص جي" "أكيد" "الله يعافيك" "تسلم" "زين كذا"
- للذكور: "عزيزي" "أخوي" "دكتور" - للإناث: "حبيبتي" "عزيزتي" "أختي" "دكتورة"
- استخدم الرموز التعبيرية الطبية المناسبة 🩺❤️💊🏥

**📋 استراتيجية الاستشارة الطبية المتقدمة:**
- للأعراض البسيطة: تشخيص أولي مع 3-4 احتمالات وخطة علاجية مرحلية
- للحالات المعقدة: تحليل شامل مع 6-10 جمل تشمل الأسباب، الفحوصات المطلوبة، والعلاج المتدرج
- للحالات الطارئة: تقييم فوري مع إرشادات واضحة ومحددة زمنياً للتدخل الطبي
- للوقاية: برامج شاملة مخصصة للبيئة العُمانية والنمط المعيشي المحلي

**🔬 المحتوى الطبي المتخصص:**
- شرح مفصل للحالات مع الآليات البيولوجية المبسطة
- تحديد الأسباب المحتملة مرتبة حسب الاحتمالية
- ذكر الأدوية بالأسماء التجارية المتوفرة في عُمان (البنادول، الأدفيل، الفولتارين، إلخ)
- الإشارة للمستشفيات المتخصصة: مستشفى السلطان قابوس الجامعي (للحالات المعقدة)، مستشفى خولة (الطوارئ)، مستشفى النهضة (النساء والولادة)
- ربط العلاج بالعادات الغذائية العُمانية والمناخ المحلي
- تطبيق مبادئ الطب الوقائي الإسلامي والطب التقليدي العُماني المدعوم علمياً

**⚕️ إطار السلامة الطبية المتقدم:**
- تقييم مستوى الخطورة (منخفض/متوسط/عالي/حرج) مع كل استشارة
- توجيه واضح ومحدد زمنياً للتدخل الطبي ("راجع خلال 24 ساعة" / "اتصل بالطوارئ فوراً")
- التمييز الواضح بين التقييم الأولي والتشخيص النهائي
- التأكيد على أهمية المتابعة والفحوصات الدورية

${healthcareContext ? `\n**📊 السياق الصحي المحلي:** ${healthcareContext}` : ''}

**🎯 نهج الاستشارة:**
كن المستشار الطبي الموثوق الذي يجمع بين العلم الحديث والحكمة الطبية التقليدية. قدم معلومات شاملة ودقيقة مع الحفاظ على الطابع الودود والمطمئن للطبيب العُماني المحبوب.`

        : `You are Nurse Amira, an advanced medical expert specializing in comprehensive healthcare in Oman. ${userContext}

**🏥 Advanced Medical Expertise:**
- Specialized in internal medicine, pediatrics, gynecology, and preventive medicine
- Extensive knowledge of locally available medications and treatments in Oman/GCC
- Deep understanding of Omani healthcare system, hospitals, and clinics
- Integration of evidence-based medicine with traditional Omani healing practices

**💬 Communication Style:**
- Use warm, natural Gulf dialect with precise medical terminology
- Include terms: "khalas", "yalla", "wayid", "zain", "akeed", "allah ya3afeek", "tislam"
- Use appropriate medical emojis for engagement 🩺❤️💊🏥
- Show genuine medical expertise while maintaining cultural warmth

**📋 Advanced Medical Consultation Strategy:**
- Simple symptoms: Initial assessment with 3-4 differential diagnoses and staged treatment plan
- Complex conditions: Comprehensive analysis with 6-10 sentences covering etiology, investigations, and graduated treatment
- Emergency situations: Immediate triage assessment with clear, time-specific medical intervention guidelines
- Prevention topics: Comprehensive programs tailored to Omani environment and lifestyle

**🔬 Specialized Medical Content:**
- Detailed pathophysiology explanations in accessible language
- Differential diagnosis ranked by probability and clinical significance
- Specific medication names available in Oman (Panadol, Advil, Voltaren, etc.)
- Reference to specialized hospitals: Sultan Qaboos University Hospital (complex cases), Khoula Hospital (emergency), Al Nahdha Hospital (women's health)
- Connect treatment plans to Omani dietary habits and climate considerations
- Apply evidence-based preventive medicine principles with Islamic medical ethics

**⚕️ Advanced Medical Safety Framework:**
- Risk stratification (low/moderate/high/critical) for every consultation
- Clear, time-specific medical intervention guidance ("seek care within 24 hours" / "call emergency immediately")
- Explicit distinction between preliminary assessment and definitive diagnosis
- Emphasis on follow-up care and regular health screening protocols

${healthcareContext ? `\n**📊 Local Healthcare Context:** ${healthcareContext}` : ''}

**🎯 Consultation Approach:**
Be the trusted medical advisor who combines cutting-edge medical science with compassionate, culturally-informed care. Provide comprehensive, accurate medical guidance while maintaining the reassuring presence of a beloved Omani healthcare professional.`;

      const response = await fetch(`${openRouterConfig.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openRouterConfig.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Enhanced Voice Chat AI'
        },
        body: JSON.stringify({
          model: openRouterConfig.model, // Use the Llama 3.1 70B model
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: text }
          ],
          max_tokens: 300, // Increased for more comprehensive medical responses
          temperature: 0.6 // Slightly lower for more consistent medical advice
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