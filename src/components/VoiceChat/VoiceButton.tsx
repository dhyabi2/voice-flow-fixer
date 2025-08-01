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
  fullWidth?: boolean;
}

export function VoiceButton({ 
  isRecording, 
  isProcessing, 
  isConnected, 
  onClick, 
  className,
  fullWidth = false
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
      size={fullWidth ? "lg" : "voice-icon"}
      onClick={onClick}
      disabled={isProcessing}
      className={cn(
        "relative overflow-hidden transition-all duration-300",
        isRecording && "voice-pulse",
        fullWidth && "w-full h-14 text-lg font-bold shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]",
        !fullWidth && "w-12 h-12",
        className
      )}
      title={getTitle()}
    >
      <div className="flex items-center gap-3">
        {getIcon()}
        {fullWidth && (
          <span className="hidden sm:block font-bold">
            {isProcessing ? 'Processing...' : 
             isRecording ? 'Stop Recording' : 
             !isConnected ? 'Connect' : 'Start Recording'}
          </span>
        )}
      </div>
      
      {/* Voice level indicator */}
      {isRecording && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="absolute inset-0 bg-white/20 rounded-full voice-wave" />
        </div>
      )}
    </Button>
  );
}