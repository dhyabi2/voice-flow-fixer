import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Heart, 
  Settings, 
  Mic, 
  MicOff, 
  Users, 
  MessageCircle,
  Phone,
  PhoneOff,
  TestTube,
  Languages,
  Volume2,
  User,
  ArrowRight,
  Activity
} from 'lucide-react';
import { PatientLookup } from './PatientLookup';
import { MessageList } from '../VoiceChat/MessageList';
import { LanguageToggle } from '../VoiceChat/LanguageToggle';
import { VoiceSettingsPanel } from '../VoiceChat/VoiceSettingsPanel';
import { VoiceTestPanel } from '../VoiceChat/VoiceTestPanel';
import { useVoiceChat } from '@/hooks/useVoiceChat';
import { nurseService, type Patient } from '@/services/nurseService';
import { useTranslation } from '@/utils/translations';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ModernVirtualNurseInterfaceProps {
  className?: string;
}

export function ModernVirtualNurseInterface({ className }: ModernVirtualNurseInterfaceProps) {
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
    canRecord,
    setElevenLabsApiKey
  } = useVoiceChat();

  const { t, isRTL } = useTranslation(state.currentLanguage);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [recentPatients, setRecentPatients] = useState<Patient[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showPatients, setShowPatients] = useState(false);
  const [voiceSettings, setVoiceSettings] = useState({
    language: state.currentLanguage,
    voiceType: 'premium' as 'natural' | 'enhanced' | 'premium', // Default to ElevenLabs
    rate: 0.85,
    pitch: 1.1
  });

  useEffect(() => {
    loadRecentPatients();
  }, []);

  const loadRecentPatients = async () => {
    try {
      const patients = await nurseService.getPatients();
      setRecentPatients(patients.slice(0, 3));
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
    setShowPatients(false);
    toast.success(`${t('Selected patient:')} ${patient.name}`);
  };

  const toggleRecording = () => {
    if (state.isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const getStatusInfo = () => {
    if (!isInitialized) return { 
      color: 'bg-gray-100 text-gray-600', 
      text: t('Initializing...'),
      icon: Activity,
      pulse: true 
    };
    if (!state.isConnected) return { 
      color: 'bg-red-100 text-red-700', 
      text: t('Disconnected'),
      icon: PhoneOff,
      pulse: false 
    };
    if (state.isProcessing) return { 
      color: 'bg-blue-100 text-blue-700', 
      text: t('Processing...'),
      icon: Activity,
      pulse: true 
    };
    if (state.isRecording) return { 
      color: 'bg-green-100 text-green-700', 
      text: t('Listening'),
      icon: Mic,
      pulse: true 
    };
    if (state.isSpeaking) return { 
      color: 'bg-purple-100 text-purple-700', 
      text: t('Speaking'),
      icon: Volume2,
      pulse: true 
    };
    return { 
      color: 'bg-emerald-100 text-emerald-700', 
      text: t('Ready'),
      icon: Heart,
      pulse: false 
    };
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <div className={cn(
      "min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50",
      isRTL ? 'rtl font-arabic' : 'ltr',
      className
    )}>
      {/* Modern Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <Heart className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    {t('Nurse Amira')}
                  </h1>
                  <p className="text-sm text-gray-500">{t('Virtual Healthcare Assistant')}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Status Badge */}
              <div className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium",
                statusInfo.color
              )}>
                <StatusIcon className={cn(
                  "h-4 w-4",
                  statusInfo.pulse && "animate-pulse"
                )} />
                {statusInfo.text}
              </div>

              {/* Language Toggle */}
              <LanguageToggle 
                currentLanguage={state.currentLanguage}
                onLanguageChange={switchLanguage}
              />

              {/* Settings */}
              <Sheet open={showSettings} onOpenChange={setShowSettings}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                    <Settings className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-96">
                  <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      {t('Voice Settings')}
                    </SheetTitle>
                  </SheetHeader>
                  <div className="mt-6 space-y-6">
                    <VoiceSettingsPanel 
                      settings={voiceSettings}
                      onSettingsChange={setVoiceSettings}
                      currentLanguage={state.currentLanguage}
                      onElevenLabsApiKeyChange={setElevenLabsApiKey}
                    />
                    <VoiceTestPanel currentLanguage={state.currentLanguage} />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Conversation Area */}
          <div className="lg:col-span-2">
            <Card className="h-[calc(100vh-200px)] flex flex-col">
              <CardContent className="flex-1 flex flex-col p-0">
                {/* Patient Context Bar */}
                {selectedPatient && (
                  <div className="p-4 bg-blue-50 border-b border-blue-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-blue-900">{selectedPatient.name}</p>
                          <p className="text-sm text-blue-600">{selectedPatient.patient_id}</p>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setSelectedPatient(null)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                )}

                {/* Messages Area */}
                <div className="flex-1 p-6 overflow-hidden">
                  {messages.length === 0 ? (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center max-w-md">
                        <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                          <MessageCircle className="h-10 w-10 text-red-500" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          {t("Hello, I'm Nurse Amira")}
                        </h3>
                        <p className="text-gray-600 text-sm leading-relaxed mb-6">
                          {t("I'm here to provide caring healthcare guidance and support. Feel free to ask about symptoms, medications, appointments, or general health concerns.")}
                        </p>
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-full text-xs">
                          <Heart className="h-4 w-4" />
                          {t("Always consult your doctor for medical decisions")}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <MessageList 
                      messages={messages} 
                      onTranslate={() => {}} 
                    />
                  )}
                </div>

                {/* Voice Controls Bar */}
                <div className="p-6 bg-gray-50 border-t">
                  <div className="flex items-center justify-center gap-4">
                    {!state.isConnected ? (
                      <Button 
                        onClick={handleConnect} 
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-medium"
                      >
                        <Phone className="h-5 w-5 mr-2" />
                        {t('Connect to Nurse Amira')}
                      </Button>
                    ) : (
                      <>
                        {/* Main Voice Button */}
                        <Button
                          onClick={toggleRecording}
                          disabled={!canRecord}
                          className={cn(
                            "w-16 h-16 rounded-full p-0 transition-all duration-300",
                            state.isRecording 
                              ? "bg-red-500 hover:bg-red-600 scale-110 shadow-lg shadow-red-500/30" 
                              : "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                          )}
                        >
                          {state.isRecording ? (
                            <MicOff className="h-7 w-7 text-white" />
                          ) : (
                            <Mic className="h-7 w-7 text-white" />
                          )}
                        </Button>

                        {/* Secondary Actions */}
                        <div className="flex gap-2">
                          <Button
                            onClick={handleDisconnect}
                            variant="outline"
                            size="sm"
                            className="h-9"
                          >
                            <PhoneOff className="h-4 w-4 mr-2" />
                            {t('Disconnect')}
                          </Button>
                          
                          <Button
                            onClick={clearMessages}
                            variant="outline"
                            size="sm"
                            disabled={messages.length === 0}
                            className="h-9"
                          >
                            {t('Clear')}
                          </Button>
                        </div>
                      </>
                    )}
                  </div>

                  {state.error && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-700 text-sm text-center">{state.error}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Patient Access */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-500" />
                    {t('Patients')}
                  </h3>
                  <Sheet open={showPatients} onOpenChange={setShowPatients}>
                    <SheetTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-96">
                      <SheetHeader>
                        <SheetTitle className="flex items-center gap-2">
                          <Users className="h-5 w-5" />
                          {t('Patient Directory')}
                        </SheetTitle>
                      </SheetHeader>
                      <div className="mt-6">
                        <PatientLookup
                          onPatientSelect={handlePatientSelect}
                          selectedPatient={selectedPatient}
                        />
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>

                <div className="space-y-3">
                  {recentPatients.map((patient) => (
                    <div
                      key={patient.id}
                      className={cn(
                        "p-3 border border-gray-200 rounded-lg cursor-pointer transition-all hover:border-blue-300 hover:bg-blue-50",
                        selectedPatient?.id === patient.id && "border-blue-500 bg-blue-50"
                      )}
                      onClick={() => handlePatientSelect(patient)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-gray-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-gray-900 truncate">{patient.name}</p>
                          <p className="text-xs text-gray-500">{patient.patient_id}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Button 
                  variant="outline" 
                  className="w-full mt-4" 
                  onClick={() => setShowPatients(true)}
                >
                  {t('View All Patients')}
                </Button>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Activity className="h-5 w-5 text-green-500" />
                  {t('Session Stats')}
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{t('Messages')}</span>
                    <Badge variant="secondary">{messages.length}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{t('Language')}</span>
                    <Badge variant="outline">
                      {state.currentLanguage === 'ar' ? 'العربية' : 'English'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{t('Patient')}</span>
                    <Badge variant={selectedPatient ? "default" : "secondary"}>
                      {selectedPatient ? t('Selected') : t('None')}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}