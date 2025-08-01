import React from 'react';
import { VoiceMessage } from '@/types/voice';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Volume2, Copy, Languages } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface MessageListProps {
  messages: VoiceMessage[];
  onTranslate: (messageId: string, targetLanguage: 'en' | 'ar') => void;
  className?: string;
}

export function MessageList({ messages, onTranslate, className }: MessageListProps) {
  const { toast } = useToast();

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied",
        description: "Message copied to clipboard.",
      });
    } catch (error) {
      console.error('Failed to copy text:', error);
      toast({
        title: "Copy Failed",
        description: "Failed to copy message to clipboard.",
        variant: "destructive",
      });
    }
  };

  const speakText = (text: string, language: 'en' | 'ar') => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === 'ar' ? 'ar-SA' : 'en-US';
      speechSynthesis.speak(utterance);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  if (messages.length === 0) {
    return (
      <div className={cn(
        "flex items-center justify-center h-32 text-muted-foreground",
        className
      )}>
        <p className="text-center fade-in">
          Start a voice conversation by clicking the microphone button
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4 max-h-96 overflow-y-auto", className)}>
      {messages.map((message) => (
        <Card 
          key={message.id} 
          className={cn(
            "transition-all duration-300 hover:shadow-md slide-up",
            message.type === 'user' 
              ? "ml-8 bg-primary/5 border-primary/20" 
              : "mr-8 bg-card"
          )}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className={cn(
                    "text-xs font-medium px-2 py-1 rounded-full",
                    message.type === 'user' 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-secondary text-secondary-foreground"
                  )}>
                    {message.type === 'user' ? 'You' : 'Assistant'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatTime(message.timestamp)}
                  </span>
                  <span className={cn(
                    "text-xs px-2 py-1 rounded-full font-medium",
                    message.language === 'ar' 
                      ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                      : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                  )}>
                    {message.language === 'ar' ? 'AR' : 'EN'}
                  </span>
                </div>
                
                <p className={cn(
                  "text-sm leading-relaxed break-words",
                  message.language === 'ar' && "text-right font-arabic"
                )}>
                  {message.content}
                </p>
              </div>
              
              <div className="flex flex-col gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(message.content)}
                  className="h-8 w-8 p-0"
                  title="Copy message"
                >
                  <Copy className="w-3 h-3" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => speakText(message.content, message.language)}
                  className="h-8 w-8 p-0"
                  title="Read aloud"
                >
                  <Volume2 className="w-3 h-3" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onTranslate(
                    message.id, 
                    message.language === 'en' ? 'ar' : 'en'
                  )}
                  className="h-8 w-8 p-0"
                  title={`Translate to ${message.language === 'en' ? 'Arabic' : 'English'}`}
                >
                  <Languages className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}