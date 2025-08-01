import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { VoiceMessage, VoiceState } from '@/types/voice';
import { Clock, MessageSquare, Mic, Volume2, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoiceAnalyticsProps {
  messages: VoiceMessage[];
  state: VoiceState;
  className?: string;
}

export function VoiceAnalytics({ messages, state, className }: VoiceAnalyticsProps) {
  const getSessionStats = () => {
    const userMessages = messages.filter(m => m.type === 'user');
    const assistantMessages = messages.filter(m => m.type === 'assistant');
    const englishMessages = messages.filter(m => m.language === 'en');
    const arabicMessages = messages.filter(m => m.language === 'ar');
    
    const sessionDuration = messages.length > 0 
      ? Date.now() - messages[0].timestamp.getTime()
      : 0;

    return {
      totalMessages: messages.length,
      userMessages: userMessages.length,
      assistantMessages: assistantMessages.length,
      englishMessages: englishMessages.length,
      arabicMessages: arabicMessages.length,
      sessionDuration,
      averageResponseTime: assistantMessages.length > 0 
        ? Math.round(sessionDuration / assistantMessages.length / 1000)
        : 0
    };
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const stats = getSessionStats();
  const languageDistribution = stats.totalMessages > 0 
    ? Math.round((stats.englishMessages / stats.totalMessages) * 100)
    : 50;

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Session Analytics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Status</span>
          <Badge 
            variant={state.isConnected ? 'default' : 'secondary'}
            className="flex items-center gap-1"
          >
            {state.isConnected ? (
              <>
                <Mic className="w-3 h-3" />
                Connected
              </>
            ) : (
              'Disconnected'
            )}
          </Badge>
        </div>

        {/* Session Duration */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            Session Time
          </div>
          <span className="text-sm font-medium">
            {formatDuration(stats.sessionDuration)}
          </span>
        </div>

        {/* Message Count */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total Messages</span>
            <span className="text-sm font-medium">{stats.totalMessages}</span>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">You:</span>
              <span>{stats.userMessages}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">AI:</span>
              <span>{stats.assistantMessages}</span>
            </div>
          </div>
        </div>

        {/* Language Distribution */}
        {stats.totalMessages > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Globe className="w-4 h-4" />
              Language Usage
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>English</span>
                <span>{stats.englishMessages}</span>
              </div>
              <Progress value={languageDistribution} className="h-2" />
              <div className="flex justify-between text-xs">
                <span>Arabic</span>
                <span>{stats.arabicMessages}</span>
              </div>
            </div>
          </div>
        )}

        {/* Current Activity */}
        <div className="space-y-2">
          <span className="text-sm text-muted-foreground">Current Activity</span>
          <div className="flex flex-wrap gap-1">
            {state.isRecording && (
              <Badge variant="default" className="text-xs">
                <Mic className="w-3 h-3 mr-1" />
                Recording
              </Badge>
            )}
            {state.isSpeaking && (
              <Badge variant="default" className="text-xs">
                <Volume2 className="w-3 h-3 mr-1" />
                Speaking
              </Badge>
            )}
            {state.isProcessing && (
              <Badge variant="secondary" className="text-xs">
                Processing
              </Badge>
            )}
            {!state.isRecording && !state.isSpeaking && !state.isProcessing && state.isConnected && (
              <Badge variant="outline" className="text-xs">
                Idle
              </Badge>
            )}
          </div>
        </div>

        {/* Performance Metrics */}
        {stats.assistantMessages > 0 && (
          <div className="pt-2 border-t">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Avg Response Time</span>
              <span>{stats.averageResponseTime}s</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}