import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface VoiceWavesProps {
  isActive: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'purple' | 'pink' | 'cyan';
}

export function VoiceWaves({ 
  isActive, 
  className, 
  size = 'md',
  color = 'primary' 
}: VoiceWavesProps) {
  const [audioData, setAudioData] = useState<number[]>([]);

  // Simulate audio visualization data when speaking
  useEffect(() => {
    if (!isActive) {
      setAudioData([]);
      return;
    }

    const generateWaveData = () => {
      // Create realistic wave patterns that simulate voice frequencies
      const bars = 5;
      const newData = Array.from({ length: bars }, (_, i) => {
        // Create varied heights with some randomness for natural feel
        const baseHeight = 0.3 + Math.sin(Date.now() * 0.005 + i * 0.8) * 0.4;
        const randomness = Math.random() * 0.3;
        const voicePattern = Math.sin(Date.now() * 0.008 + i * 1.2) * 0.3;
        
        return Math.max(0.1, Math.min(1, baseHeight + randomness + voicePattern));
      });
      setAudioData(newData);
    };

    // Update wave data frequently for smooth animation
    const interval = setInterval(generateWaveData, 80);
    generateWaveData(); // Initial call

    return () => clearInterval(interval);
  }, [isActive]);

  const sizeClasses = {
    sm: 'h-8',
    md: 'h-12',
    lg: 'h-16'
  };

  const colorClasses = {
    primary: 'bg-gradient-to-t from-primary/60 to-primary',
    purple: 'bg-gradient-to-t from-purple-400/60 to-purple-500',
    pink: 'bg-gradient-to-t from-pink-400/60 to-pink-500',
    cyan: 'bg-gradient-to-t from-cyan-400/60 to-cyan-500'
  };

  if (!isActive) {
    return null;
  }

  return (
    <div className={cn(
      "flex items-end justify-center gap-1",
      sizeClasses[size],
      className
    )}>
      {audioData.map((height, index) => (
        <div
          key={index}
          className={cn(
            "w-1 rounded-full transition-all duration-75 ease-out",
            colorClasses[color],
            "animate-pulse"
          )}
          style={{
            height: `${height * 100}%`,
            animationDelay: `${index * 100}ms`,
            animationDuration: '1.5s'
          }}
        />
      ))}
    </div>
  );
}