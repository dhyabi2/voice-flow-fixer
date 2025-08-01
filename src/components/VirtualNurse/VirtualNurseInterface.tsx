import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart, Users, Brain, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { PatientLookup } from './PatientLookup';
import { MessageList } from '../VoiceChat/MessageList';
import { LanguageToggle } from '../VoiceChat/LanguageToggle';
import { useVoiceChat } from '@/hooks/useVoiceChat';
import { nurseService, type Patient } from '@/services/nurseService';
import { useTranslation } from '@/utils/translations';
import { toast } from 'sonner';

interface VirtualNurseInterfaceProps {
  className?: string;
}

export function VirtualNurseInterface({ className }: VirtualNurseInterfaceProps) {
  const {
    state,
    messages,
    isInitialized,
    connect,
    disconnect,
    startRecording,
    stopRecording,
    switchLanguage,
    clearMessages,
    canRecord
  } = useVoiceChat();

  const { t, isRTL } = useTranslation(state.currentLanguage);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [recentPatients, setRecentPatients] = useState<Patient[]>([]);
  const [nurseEmotion, setNurseEmotion] = useState<'neutral' | 'caring' | 'concerned' | 'happy'>('neutral');

  useEffect(() => {
    loadRecentPatients();
  }, []);

  useEffect(() => {
    // Update nurse emotion based on voice state and urgency
    if (state.isProcessing) {
      setNurseEmotion('concerned');
    } else if (state.isSpeaking) {
      setNurseEmotion('caring');
    } else if (state.isRecording) {
      setNurseEmotion('neutral');
    } else if (messages.length > 0) {
      setNurseEmotion('happy');
    } else {
      setNurseEmotion('neutral');
    }
  }, [state, messages]);

  const loadRecentPatients = async () => {
    try {
      const patients = await nurseService.getPatients();
      setRecentPatients(patients.slice(0, 5)); // Show only 5 most recent
    } catch (error) {
      console.error('Error loading patients:', error);
    }
  };

  const handleConnect = async () => {
    try {
      await connect();
      toast.success(t('Connected to Nurse Amira'));
    } catch (error) {
      toast.error(t('Failed to connect to voice service'));
    }
  };

  const handleDisconnect = () => {
    disconnect();
    toast.info(t('Disconnected from voice service'));
  };

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    toast.success(`${t('Selected patient:')} ${patient.name}`);
  };

  const toggleRecording = () => {
    if (state.isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const getConnectionStatus = () => {
    if (!isInitialized) return { color: 'secondary', text: t('Initializing...') };
    if (!state.isConnected) return { color: 'destructive', text: t('Disconnected') };
    if (state.isProcessing) return { color: 'warning', text: t('Processing...') };
    if (state.isRecording) return { color: 'primary', text: t('Listening') };
    if (state.isSpeaking) return { color: 'success', text: t('Speaking') };
    return { color: 'success', text: t('Ready') };
  };

  const status = getConnectionStatus();

  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-4 ${className} ${isRTL ? 'rtl font-arabic' : 'ltr'}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Heart className="h-8 w-8 text-red-500" />
                {t('Virtual Nurse Assistant')}
              </h1>
              <p className="text-gray-600 mt-1">{t('Compassionate healthcare guidance for Muscat patients')}</p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant={status.color as any} className="px-3 py-1">
                {status.text}
              </Badge>
              <LanguageToggle 
                currentLanguage={state.currentLanguage}
                onLanguageChange={switchLanguage}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Nurse Avatar & Controls */}
          <div className="lg:col-span-1 space-y-6">
            {/* Simple Nurse Status Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-center flex items-center justify-center gap-2">
                  <Heart className="h-6 w-6 text-red-500" />
                  {t('Nurse Amira')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-4">
                  <div className="w-32 h-32 mx-auto bg-gradient-to-br from-blue-100 to-green-100 rounded-full flex items-center justify-center">
                    <Heart className="h-16 w-16 text-red-500" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-lg font-medium">
                      {state.isRecording ? t('Listening...') : 
                       state.isSpeaking ? t('Speaking...') : 
                       state.isProcessing ? t('Thinking...') : t('Ready to help')}
                    </p>
                    <p className="text-sm text-muted-foreground">{t('Virtual Healthcare Assistant')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Voice Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mic className="h-5 w-5" />
                  {t('Voice Controls')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!state.isConnected ? (
                  <Button onClick={handleConnect} className="w-full">
                    {t('Connect to Nurse Amira')}
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        onClick={toggleRecording}
                        disabled={!canRecord}
                        variant={state.isRecording ? "destructive" : "default"}
                        className="flex items-center gap-2"
                      >
                        {state.isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                        {state.isRecording ? t('Stop') : t('Talk')}
                      </Button>
                      <Button
                        onClick={handleDisconnect}
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <VolumeX className="h-4 w-4" />
                        {t('Disconnect')}
                      </Button>
                    </div>
                    <Button
                      onClick={clearMessages}
                      variant="outline"
                      className="w-full"
                      disabled={messages.length === 0}
                    >
                      {t('Clear Conversation')}
                    </Button>
                  </div>
                )}

                {state.error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700 text-sm">{state.error}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Patient Access */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  {t('Recent Patients')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {recentPatients.map((patient) => (
                    <div
                      key={patient.id}
                      className={`p-2 border rounded cursor-pointer transition-colors hover:bg-muted/50 ${
                        selectedPatient?.id === patient.id ? 'bg-primary/10 border-primary' : ''
                      }`}
                      onClick={() => handlePatientSelect(patient)}
                    >
                      <div className="font-medium text-sm">{patient.name}</div>
                      <div className="text-xs text-muted-foreground">{patient.patient_id}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Main Interface */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="conversation" className="h-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="conversation" className="flex items-center gap-2">
                  <Volume2 className="h-4 w-4" />
                  {t('Conversation')}
                </TabsTrigger>
                <TabsTrigger value="patients" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {t('Patients')}
                </TabsTrigger>
                <TabsTrigger value="knowledge" className="flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  {t('Knowledge')}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="conversation" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('Healthcare Conversation')}</CardTitle>
                    {selectedPatient && (
                      <div className="text-sm text-muted-foreground">
                        {t('Active patient:')} <span className="font-medium">{selectedPatient.name}</span>
                      </div>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="h-96 overflow-hidden">
                      <MessageList 
                        messages={messages} 
                        onTranslate={() => {}} 
                      />
                    </div>
                    
                    {messages.length === 0 && (
                      <div className="text-center py-12 text-muted-foreground">
                        <Heart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium mb-2">{t("Hello, I'm Nurse Amira")}</p>
                        <p className="text-sm max-w-md mx-auto">
                          {t("I'm here to provide caring healthcare guidance and support. Feel free to ask about symptoms, medications, appointments, or general health concerns.")}
                        </p>
                        <p className="text-xs mt-4 text-amber-600">
                          {t("Note: I provide guidance only. Always consult your doctor for medical decisions.")}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="patients" className="mt-6">
                <PatientLookup
                  onPatientSelect={handlePatientSelect}
                  selectedPatient={selectedPatient}
                />
              </TabsContent>

              <TabsContent value="knowledge" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="h-5 w-5" />
                      {t('Medical Knowledge Base')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12 text-muted-foreground">
                      <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium mb-2">{t('Medical Knowledge Available')}</p>
                      <p className="text-sm max-w-md mx-auto">
                        {t('I have access to comprehensive medical knowledge covering respiratory, cardiovascular, endocrine, emergency, and musculoskeletal conditions.')}
                      </p>
                      <div className="flex flex-wrap gap-2 justify-center mt-4">
                        <Badge variant="outline">{t('Respiratory')}</Badge>
                        <Badge variant="outline">{t('Cardiovascular')}</Badge>
                        <Badge variant="outline">{t('Endocrine')}</Badge>
                        <Badge variant="outline">{t('Emergency')}</Badge>
                        <Badge variant="outline">{t('Musculoskeletal')}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}