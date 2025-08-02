import { useState, useEffect, useCallback, useRef } from 'react';
import { EnhancedVoiceService } from '@/services/enhancedVoiceService';
import { translationService } from '@/services/translationService';
import { VoiceState, VoiceMessage } from '@/types/voice';
import { useToast } from '@/hooks/use-toast';
import { debugLogger } from '@/utils/debugLogger';
import { enhancedVoiceService } from '@/services/enhancedVoiceService';
import { memoryService } from '@/services/memoryService';
import { conversationLogger } from '@/services/conversationLogger';

// Initialize the enhanced voice service with ElevenLabs support
const voiceService = new EnhancedVoiceService();

export function useVoiceChat() {
  const [state, setState] = useState<VoiceState>(() => voiceService.getState());
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const { toast } = useToast();
  
  const stateUnsubscribeRef = useRef<(() => void) | null>(null);
  const messageUnsubscribeRef = useRef<(() => void) | null>(null);

  const addMessage = useCallback((message: VoiceMessage) => {
    setMessages(prev => [...prev, message]);
    
    // Add to memory service for context and logging
    memoryService.addMessage(message);
  }, []);

  // Initialize voice service
  const initialize = useCallback(async () => {
    try {
      await voiceService.initialize();
      setIsInitialized(true);
      
      toast({
        title: "Voice Chat Ready",
        description: "Microphone access granted. You can now start voice conversations.",
      });
    } catch (error) {
      console.error('Failed to initialize voice chat:', error);
      toast({
        title: "Initialization Failed",
        description: "Failed to access microphone. Please check permissions and try again.",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Connect to voice service
  const connect = useCallback(async () => {
    try {
      if (!isInitialized) {
        await initialize();
      }
      
      await voiceService.connect();
      
      toast({
        title: "Connected",
        description: "Connected to voice chat service successfully.",
      });
    } catch (error) {
      console.error('Failed to connect:', error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect to voice service. Please try again.",
        variant: "destructive",
      });
    }
  }, [isInitialized, initialize, toast]);

  // Disconnect from voice service
  const disconnect = useCallback(() => {
    voiceService.disconnect();
    
    toast({
      title: "Disconnected",
      description: "Disconnected from voice chat service.",
    });
  }, [toast]);

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      if (!state.isConnected) {
        await connect();
      }
      
      await voiceService.startRecording();
    } catch (error) {
      console.error('Failed to start recording:', error);
      toast({
        title: "Recording Failed",
        description: "Failed to start recording. Please try again.",
        variant: "destructive",
      });
    }
  }, [state.isConnected, connect, toast]);

  // Stop recording
  const stopRecording = useCallback(() => {
    voiceService.stopRecording();
  }, []);

  // Switch language
  const switchLanguage = useCallback(async (language: 'en' | 'ar') => {
    try {
      await voiceService.switchLanguage(language);
      
      const languageName = language === 'ar' ? 'Arabic' : 'English';
      toast({
        title: "Language Changed",
        description: `Switched to ${languageName} voice chat.`,
      });
    } catch (error) {
      console.error('Failed to switch language:', error);
      toast({
        title: "Language Switch Failed",
        description: "Failed to change language. Please try again.",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Translate message
  const translateMessage = useCallback(async (
    messageId: string,
    targetLanguage: 'en' | 'ar'
  ) => {
    const message = messages.find(m => m.id === messageId);
    if (!message) return;

    try {
      const result = await translationService.translateText(
        message.content,
        targetLanguage
      );

      // Update message with translation
      setMessages(prev => prev.map(m => 
        m.id === messageId 
          ? { ...m, content: result.translatedText, language: targetLanguage }
          : m
      ));

      toast({
        title: "Translation Complete",
        description: `Message translated to ${targetLanguage === 'ar' ? 'Arabic' : 'English'}.`,
      });
    } catch (error) {
      console.error('Translation failed:', error);
      toast({
        title: "Translation Failed",
        description: "Failed to translate message. Please try again.",
        variant: "destructive",
      });
    }
  }, [messages, toast]);

  // Clear messages
  const clearMessages = useCallback(() => {
    setMessages([]);
    memoryService.clearSessionHistory();
    
    toast({
      title: "Messages Cleared",
      description: "All voice chat messages have been cleared.",
    });
  }, [toast]);

  // Set ElevenLabs API key
  const setElevenLabsApiKey = useCallback((apiKey: string) => {
    voiceService.setElevenLabsApiKey(apiKey);
    
    toast({
      title: "ElevenLabs API Key Set",
      description: "Voice quality enhanced with ElevenLabs.",
    });
  }, [toast]);

  const setUserInfo = useCallback((name: string, gender: 'male' | 'female') => {
    voiceService.setUserInfo(name, gender);
    conversationLogger.setUserInfo(name, gender);
  }, []);

  const setPatientContext = useCallback((patient: any) => {
    conversationLogger.setPatientContext(patient);
  }, []);

  // Interrupt AI audio (for manual use)
  const interruptAudio = useCallback(() => {
    voiceService.interruptAudio();
  }, []);

  // Toggle recording (convenience method)
  const toggleRecording = useCallback(() => {
    if (state.isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [state.isRecording, startRecording, stopRecording]);

  // Setup event listeners
  useEffect(() => {
    // Subscribe to state changes
    stateUnsubscribeRef.current = voiceService.onStateChange(setState);
    
    // Subscribe to new messages
    messageUnsubscribeRef.current = voiceService.onMessage((message) => {
      addMessage(message);
    });

    return () => {
      stateUnsubscribeRef.current?.();
      messageUnsubscribeRef.current?.();
    };
  }, [addMessage]);

  // Handle errors
  useEffect(() => {
    if (state.error) {
      toast({
        title: "Voice Chat Error",
        description: state.error,
        variant: "destructive",
      });
    }
  }, [state.error, toast]);

  return {
    // State
    state,
    messages,
    isInitialized,
    
    // Actions
    initialize,
    connect,
    disconnect,
    startRecording,
    stopRecording,
    toggleRecording,
    switchLanguage,
    translateMessage,
    clearMessages,
    setElevenLabsApiKey,
    setUserInfo,
    setPatientContext,
    interruptAudio,
    
    // Computed values
    canRecord: isInitialized && state.isConnected,
    isActive: state.isRecording || state.isSpeaking || state.isProcessing
  };
}