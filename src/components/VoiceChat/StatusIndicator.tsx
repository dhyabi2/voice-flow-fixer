import React from 'react';
import { VoiceState } from '@/types/voice';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Loader2, Mic, MicOff, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatusIndicatorProps {
  state: VoiceState;
  className?: string;
}

export function StatusIndicator({ state, className }: StatusIndicatorProps) {
  const getStatusDisplay = () => {
    if (state.error) {
      return {
        text: 'Error',
        icon: <AlertCircle className="w-3 h-3" />,
        variant: 'destructive' as const,
        description: state.error
      };
    }

    if (state.isProcessing) {
      return {
        text: 'Processing',
        icon: <Loader2 className="w-3 h-3 animate-spin" />,
        variant: 'secondary' as const,
        description: 'Processing your voice input...'
      };
    }

    if (state.isSpeaking) {
      return {
        text: 'Speaking',
        icon: <Volume2 className="w-3 h-3" />,
        variant: 'default' as const,
        description: 'AI is responding'
      };
    }

    if (state.isRecording) {
      return {
        text: 'Recording',
        icon: <Mic className="w-3 h-3" />,
        variant: 'default' as const,
        description: 'Listening to your voice...'
      };
    }

    if (state.isConnected) {
      return {
        text: 'Connected',
        icon: <CheckCircle className="w-3 h-3" />,
        variant: 'secondary' as const,
        description: 'Ready for voice chat'
      };
    }

    return {
      text: 'Disconnected',
      icon: <MicOff className="w-3 h-3" />,
      variant: 'outline' as const,
      description: 'Click to connect'
    };
  };

  const status = getStatusDisplay();

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Badge 
        variant={status.variant}
        className={cn(
          "flex items-center gap-1 transition-all duration-300",
          state.isRecording && "voice-pulse",
          state.isSpeaking && "animate-pulse"
        )}
      >
        {status.icon}
        <span>{status.text}</span>
      </Badge>
      
      <span className="text-xs text-muted-foreground hidden sm:inline">
        {status.description}
      </span>
    </div>
  );
}