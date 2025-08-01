import { VoiceState, VoiceMessage, VoiceConfig, PipecatConfig } from '@/types/voice';
import { debugLogger } from '@/utils/debugLogger';

export class VoiceService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioContext: AudioContext | null = null;
  private websocket: WebSocket | null = null;
  private stream: MediaStream | null = null;
  private config: VoiceConfig;
  private pipecatConfig: PipecatConfig;
  
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

    this.pipecatConfig = {
      wsUrl: 'wss://api.pipecat.ai/v1/ws',
      apiKey: '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',
      model: 'meta-llama/llama-3.1-8b-instruct:free',
      voice: 'en-US-Journey-D',
      language: 'en'
    };
    debugLogger.info('VOICE_SERVICE', 'VoiceService initialized', { config: this.config });
  }

  // State management
  private updateState(updates: Partial<VoiceState>) {
    this.currentState = { ...this.currentState, ...updates };
    this.stateListeners.forEach(listener => listener(this.currentState));
  }

  public getState(): VoiceState {
    return { ...this.currentState };
  }

  public onStateChange(callback: (state: VoiceState) => void) {
    this.stateListeners.add(callback);
    return () => this.stateListeners.delete(callback);
  }

  public onMessage(callback: (message: VoiceMessage) => void) {
    this.messageListeners.add(callback);
    return () => this.messageListeners.delete(callback);
  }

  // Core functionality
  public async initialize(): Promise<void> {
    try {
      // Request microphone permission
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: this.config.sampleRate,
          channelCount: this.config.channels,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      // Initialize audio context
      this.audioContext = new AudioContext({ sampleRate: this.config.sampleRate });
      
      this.updateState({ error: null });
    } catch (error) {
      console.error('Failed to initialize voice service:', error);
      this.updateState({ 
        error: 'Failed to access microphone. Please check permissions.' 
      });
      throw error;
    }
  }

  public async connect(): Promise<void> {
    try {
      if (!this.stream || !this.audioContext) {
        await this.initialize();
      }

      // Connect to Pipecat WebSocket
      this.websocket = new WebSocket(this.pipecatConfig.wsUrl);
      
      this.websocket.onopen = () => {
        console.log('Connected to Pipecat');
        this.updateState({ isConnected: true, error: null });
        this.sendConfig();
      };

      this.websocket.onmessage = (event) => {
        this.handleWebSocketMessage(event);
      };

      this.websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.updateState({ 
          error: 'Connection failed. Please try again.',
          isConnected: false 
        });
      };

      this.websocket.onclose = () => {
        console.log('Disconnected from Pipecat');
        this.updateState({ isConnected: false });
      };

    } catch (error) {
      console.error('Failed to connect:', error);
      this.updateState({ 
        error: 'Failed to connect to voice service.',
        isConnected: false 
      });
      throw error;
    }
  }

  public async startRecording(): Promise<void> {
    try {
      if (!this.stream) {
        throw new Error('Voice service not initialized');
      }

      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      const audioChunks: Blob[] = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
          this.processAudioChunk(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        this.sendAudioToServer(audioBlob);
      };

      this.mediaRecorder.start(100); // Collect data every 100ms
      this.updateState({ isRecording: true, error: null });

    } catch (error) {
      console.error('Failed to start recording:', error);
      this.updateState({ 
        error: 'Failed to start recording. Please try again.',
        isRecording: false 
      });
      throw error;
    }
  }

  public stopRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop();
      this.updateState({ isRecording: false });
    }
  }

  public async switchLanguage(language: 'en' | 'ar'): Promise<void> {
    this.updateState({ currentLanguage: language });
    this.pipecatConfig.language = language;
    
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      this.sendConfig();
    }
  }

  public disconnect(): void {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }

    if (this.mediaRecorder) {
      this.mediaRecorder.stop();
      this.mediaRecorder = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.updateState({
      isConnected: false,
      isRecording: false,
      isSpeaking: false,
      isProcessing: false,
      error: null
    });
  }

  // Private methods
  private sendConfig(): void {
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      const config = {
        type: 'config',
        data: {
          apiKey: this.pipecatConfig.apiKey,
          model: this.pipecatConfig.model,
          voice: this.pipecatConfig.voice,
          language: this.pipecatConfig.language,
          systemPrompt: this.currentState.currentLanguage === 'ar' 
            ? 'أنت مساعد ذكي يتحدث العربية. قدم إجابات مفيدة ومختصرة.'
            : 'You are a helpful AI assistant. Provide concise and useful responses.',
          responseFormat: 'structured',
          maxTokens: 150
        }
      };
      
      this.websocket.send(JSON.stringify(config));
    }
  }

  private processAudioChunk(audioBlob: Blob): void {
    // Convert audio to appropriate format for Pipecat
    const reader = new FileReader();
    reader.onload = () => {
      if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
        const audioData = {
          type: 'audio',
          data: reader.result,
          timestamp: Date.now()
        };
        this.websocket.send(JSON.stringify(audioData));
      }
    };
    reader.readAsArrayBuffer(audioBlob);
  }

  private sendAudioToServer(audioBlob: Blob): void {
    this.updateState({ isProcessing: true });
    this.processAudioChunk(audioBlob);
  }

  private handleWebSocketMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data);
      
      switch (message.type) {
        case 'transcription':
          this.handleTranscription(message.data);
          break;
        case 'response':
          this.handleAIResponse(message.data);
          break;
        case 'audio':
          this.handleAudioResponse(message.data);
          break;
        case 'error':
          this.handleError(message.data);
          break;
        default:
          console.log('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }

  private handleTranscription(data: any): void {
    if (data.text && data.text.trim()) {
      const message: VoiceMessage = {
        id: crypto.randomUUID(),
        type: 'user',
        content: data.text,
        timestamp: new Date(),
        language: this.currentState.currentLanguage
      };
      
      this.messageListeners.forEach(listener => listener(message));
    }
  }

  private handleAIResponse(data: any): void {
    this.updateState({ isProcessing: false });
    
    if (data.text) {
      const message: VoiceMessage = {
        id: crypto.randomUUID(),
        type: 'assistant',
        content: data.text,
        timestamp: new Date(),
        language: this.currentState.currentLanguage
      };
      
      this.messageListeners.forEach(listener => listener(message));
    }
  }

  private handleAudioResponse(data: any): void {
    if (data.audio) {
      this.updateState({ isSpeaking: true });
      this.playAudio(data.audio).finally(() => {
        this.updateState({ isSpeaking: false });
      });
    }
  }

  private handleError(data: any): void {
    console.error('Server error:', data);
    this.updateState({ 
      error: data.message || 'An error occurred during voice processing',
      isProcessing: false 
    });
  }

  private async playAudio(audioData: string): Promise<void> {
    try {
      const audioBlob = new Blob([audioData], { type: 'audio/wav' });
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      return new Promise((resolve, reject) => {
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          resolve();
        };
        audio.onerror = reject;
        audio.play();
      });
    } catch (error) {
      console.error('Failed to play audio:', error);
      throw error;
    }
  }
}

export const voiceService = new VoiceService();