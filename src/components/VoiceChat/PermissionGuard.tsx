import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mic, Shield, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PermissionGuardProps {
  children: React.ReactNode;
  onPermissionGranted?: () => void;
}

type PermissionState = 'unknown' | 'granted' | 'denied' | 'requesting';

export function PermissionGuard({ children, onPermissionGranted }: PermissionGuardProps) {
  const [permissionState, setPermissionState] = useState<PermissionState>('unknown');
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    checkBrowserSupport();
    checkCurrentPermission();
  }, []);

  const checkBrowserSupport = () => {
    const hasMediaDevices = navigator.mediaDevices && navigator.mediaDevices.getUserMedia;
    const hasWebAudio = window.AudioContext || (window as any).webkitAudioContext;
    const hasWebSocket = !!window.WebSocket;
    
    setIsSupported(!!(hasMediaDevices && hasWebAudio && hasWebSocket));
  };

  const checkCurrentPermission = async () => {
    try {
      if (!navigator.permissions) {
        // Fallback: try to get media stream to check permission
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach(track => track.stop());
          setPermissionState('granted');
          onPermissionGranted?.();
        } catch {
          setPermissionState('denied');
        }
        return;
      }

      const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      setPermissionState(permission.state as PermissionState);
      
      if (permission.state === 'granted') {
        onPermissionGranted?.();
      }

      permission.addEventListener('change', () => {
        setPermissionState(permission.state as PermissionState);
        if (permission.state === 'granted') {
          onPermissionGranted?.();
        }
      });
    } catch (error) {
      console.error('Failed to check permission:', error);
      setPermissionState('unknown');
    }
  };

  const requestPermission = async () => {
    setPermissionState('requesting');
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      // Stop the stream immediately as we just needed to request permission
      stream.getTracks().forEach(track => track.stop());
      
      setPermissionState('granted');
      onPermissionGranted?.();
    } catch (error) {
      console.error('Permission denied:', error);
      setPermissionState('denied');
    }
  };

  if (!isSupported) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="w-5 h-5" />
            Browser Not Supported
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Your browser doesn't support the required features for voice chat:
          </p>
          <ul className="text-xs space-y-1 text-muted-foreground">
            <li>• Media Devices API (microphone access)</li>
            <li>• Web Audio API (audio processing)</li>
            <li>• WebSocket API (real-time communication)</li>
          </ul>
          <p className="text-xs text-muted-foreground mt-4">
            Please use a modern browser like Chrome, Firefox, or Safari.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (permissionState === 'granted') {
    return <>{children}</>;
  }

  const getPermissionIcon = () => {
    switch (permissionState) {
      case 'denied':
        return <AlertCircle className="w-8 h-8 text-destructive" />;
      case 'requesting':
        return <Mic className="w-8 h-8 text-primary animate-pulse" />;
      default:
        return <Shield className="w-8 h-8 text-muted-foreground" />;
    }
  };

  const getPermissionMessage = () => {
    switch (permissionState) {
      case 'denied':
        return {
          title: 'Microphone Access Denied',
          description: 'Voice chat requires microphone access. Please enable microphone permissions in your browser settings and refresh the page.',
          showButton: false
        };
      case 'requesting':
        return {
          title: 'Requesting Microphone Access',
          description: 'Please allow microphone access in the browser popup to continue.',
          showButton: false
        };
      default:
        return {
          title: 'Microphone Access Required',
          description: 'Voice chat needs access to your microphone to function properly. Your voice data is processed securely and never stored.',
          showButton: true
        };
    }
  };

  const message = getPermissionMessage();

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getPermissionIcon()}
          {message.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {message.description}
        </p>
        
        {permissionState === 'denied' && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              If you previously denied access, you may need to manually enable microphone 
              permissions in your browser settings (usually found in the address bar).
            </AlertDescription>
          </Alert>
        )}
        
        <div className="flex flex-col gap-2">
          {message.showButton && (
            <Button
              onClick={requestPermission}
              disabled={permissionState === 'requesting'}
              className="w-full"
              variant="hero"
            >
              <Mic className="w-4 h-4 mr-2" />
              {permissionState === 'requesting' ? 'Requesting...' : 'Enable Microphone'}
            </Button>
          )}
          
          <div className="text-xs text-muted-foreground space-y-1">
            <p className="flex items-center gap-1">
              <Shield className="w-3 h-3" />
              Your privacy is protected - audio is processed securely
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}