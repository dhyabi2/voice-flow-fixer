import React from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Square, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoiceButtonProps {
  isRecording: boolean;
  isProcessing: boolean;
  isConnected: boolean;
  onClick: () => void;
  className?: string;
}

export function VoiceButton({ 
  isRecording, 
  isProcessing, 
  isConnected, 
  onClick, 
  className 
}: VoiceButtonProps) {
  const getVariant = () => {
    if (isRecording) return 'voice-active';
    if (!isConnected) return 'voice-inactive';
    return 'voice';
  };

  const getIcon = () => {
    if (isProcessing) return <Loader2 className="animate-spin" />;
    if (isRecording) return <Square className="w-6 h-6" />;
    if (!isConnected) return <MicOff className="w-6 h-6" />;
    return <Mic className="w-6 h-6" />;
  };

  const getTitle = () => {
    if (isProcessing) return 'Processing...';
    if (isRecording) return 'Stop Recording';
    if (!isConnected) return 'Connect to Voice Chat';
    return 'Start Recording';
  };

  return (
    <Button
      variant={getVariant()}
      size="voice-icon"
      onClick={onClick}
      disabled={isProcessing}
      className={cn(
        "relative overflow-hidden",
        isRecording && "voice-pulse",
        className
      )}
      title={getTitle()}
    >
      {getIcon()}
      
      {/* Voice level indicator */}
      {isRecording && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="absolute inset-0 bg-white/20 rounded-full voice-wave" />
        </div>
      )}
    </Button>
  );
}