import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Trash2, Settings } from 'lucide-react';
import { VoiceButton } from './VoiceButton';
import { LanguageToggle } from './LanguageToggle';
import { MessageList } from './MessageList';
import { StatusIndicator } from './StatusIndicator';
import { VoiceAnalytics } from './VoiceAnalytics';
import { SettingsPanel } from './SettingsPanel';
import { DebugPanel } from './DebugPanel';
import { ErrorBoundary } from './ErrorBoundary';
import { PermissionGuard } from './PermissionGuard';
import { useVoiceChat } from '@/hooks/useVoiceChat';
import { debugLogger } from '@/utils/debugLogger';
import { cn } from '@/lib/utils';

interface VoiceChatInterfaceProps {
  className?: string;
}

export function VoiceChatInterface({ className }: VoiceChatInterfaceProps) {
  const [showSettings, setShowSettings] = React.useState(false);
  const [showDebug, setShowDebug] = React.useState(false);
  
  const {
    state,
    messages,
    isInitialized,
    connect,
    disconnect,
    toggleRecording,
    switchLanguage,
    translateMessage,
    clearMessages,
    canRecord
  } = useVoiceChat();

  // Debug logging for component lifecycle
  React.useEffect(() => {
    debugLogger.info('VOICE_CHAT_UI', 'VoiceChatInterface component mounted');
    debugLogger.debug('VOICE_CHAT_UI', 'Initial state', { state, isInitialized, messageCount: messages.length });
  }, []);

  React.useEffect(() => {
    debugLogger.debug('VOICE_CHAT_UI', 'State updated', { state });
  }, [state]);

  React.useEffect(() => {
    debugLogger.debug('VOICE_CHAT_UI', 'Messages updated', { messageCount: messages.length, messages });
  }, [messages]);

  return (
    <ErrorBoundary>
      <PermissionGuard>
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Voice Chat Interface */}
          <div className="lg:col-span-2">
            <Card className={cn("w-full shadow-elegant", className)}>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-semibold">
                    Voice Chat Assistant
                  </CardTitle>
                  
                  <div className="flex items-center gap-2">
                    <LanguageToggle 
                      currentLanguage={state.currentLanguage}
                      onLanguageChange={switchLanguage}
                      disabled={state.isRecording || state.isProcessing}
                    />
                    
                    <SettingsPanel 
                      isOpen={showSettings}
                      onToggle={() => setShowSettings(!showSettings)}
                    />
                    
                    <DebugPanel 
                      isOpen={showDebug}
                      onToggle={() => setShowDebug(!showDebug)}
                    />
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearMessages}
                      disabled={messages.length === 0}
                      className="h-8 w-8 p-0"
                      title="Clear messages"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <StatusIndicator state={state} className="mt-2" />
              </CardHeader>
              
              <Separator />
              
              <CardContent className="p-6">
                {/* Voice Control Section */}
                <div className="flex flex-col items-center gap-4 mb-6">
                  <VoiceButton
                    isRecording={state.isRecording}
                    isProcessing={state.isProcessing}
                    isConnected={state.isConnected}
                    onClick={toggleRecording}
                    className="transition-all duration-300"
                  />
                  
                  {!state.isConnected && (
                    <Button
                      variant="hero"
                      onClick={connect}
                      disabled={state.isProcessing}
                      className="min-w-[120px]"
                    >
                      {state.isProcessing ? 'Connecting...' : 'Connect'}
                    </Button>
                  )}
                  
                  {state.isConnected && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={disconnect}
                        disabled={state.isRecording || state.isProcessing}
                      >
                        Disconnect
                      </Button>
                    </div>
                  )}
                </div>

                <Separator className="my-6" />
                
                {/* Messages Section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Conversation ({messages.length})
                    </h3>
                    
                    {messages.length > 0 && (
                      <span className="text-xs text-muted-foreground">
                        Language: {state.currentLanguage === 'ar' ? 'Arabic' : 'English'}
                      </span>
                    )}
                  </div>
                  
                  <MessageList 
                    messages={messages}
                    onTranslate={translateMessage}
                    className="min-h-[200px]"
                  />
                </div>
                
                {/* Instructions */}
                {messages.length === 0 && (
                  <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                    <h4 className="text-sm font-medium mb-2">How to use:</h4>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• Click "Connect" to start the voice chat service</li>
                      <li>• Press the microphone button to start recording</li>
                      <li>• Speak naturally in English or Arabic</li>
                      <li>• The AI will respond with voice and text</li>
                      <li>• Use language toggle to switch between languages</li>
                      <li>• Click message actions to copy, translate, or read aloud</li>
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Analytics Sidebar */}
          <div className="lg:col-span-1">
            <VoiceAnalytics 
              messages={messages}
              state={state}
              className="sticky top-4"
            />
          </div>
        </div>
        
        {/* Debug Panel - Full Width */}
        {showDebug && (
          <div className="mt-6">
            <DebugPanel 
              isOpen={showDebug}
              onToggle={() => setShowDebug(!showDebug)}
              className="w-full"
            />
          </div>
        )}
      </PermissionGuard>
    </ErrorBoundary>
  );
}