import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  const [userName, setUserName] = useState<string>('');
  const [userGender, setUserGender] = useState<'male' | 'female' | null>(null);
  const [showNameInput, setShowNameInput] = useState(true);
  const [voiceSettings, setVoiceSettings] = useState({
    language: state.currentLanguage,
    voiceType: 'premium' as 'natural' | 'enhanced' | 'premium', // Default to ElevenLabs
    rate: 0.85,
    pitch: 1.1
  });

  useEffect(() => {
    loadRecentPatients();
  }, []);

  const detectGender = (name: string): 'male' | 'female' => {
    const maleNames = ['محمد', 'أحمد', 'علي', 'حسن', 'حسين', 'عبدالله', 'عبدالرحمن', 'خالد', 'سعد', 'فهد', 'مشعل', 'طلال', 'نايف', 'بندر', 'سلطان', 'راشد', 'منصور', 'عبدالعزيز', 'يوسف', 'إبراهيم', 'عمر', 'زايد', 'حمد', 'سالم', 'عيسى', 'موسى', 'داود', 'سليمان', 'يعقوب'];
    const femaleNames = ['فاطمة', 'عائشة', 'خديجة', 'زينب', 'مريم', 'آمنة', 'صفية', 'حفصة', 'أم كلثوم', 'رقية', 'سارة', 'هاجر', 'ليلى', 'نورا', 'سلمى', 'أسماء', 'جميلة', 'كريمة', 'حنان', 'وفاء', 'إيمان', 'أمل', 'رحمة', 'بركة', 'شيخة', 'موزة', 'منى', 'هند', 'عائشة', 'أميرة', 'نوال', 'سميرة', 'لطيفة', 'عزيزة'];
    
    const firstName = name.trim().split(' ')[0].toLowerCase();
    
    if (maleNames.some(maleName => maleName.includes(firstName) || firstName.includes(maleName))) {
      return 'male';
    }
    if (femaleNames.some(femaleName => femaleName.includes(firstName) || firstName.includes(femaleName))) {
      return 'female';
    }
    
    // Default fallback based on name ending patterns
    if (firstName.endsWith('ة') || firstName.endsWith('اء') || firstName.endsWith('ان')) {
      return 'female';
    }
    
    return 'male'; // Default to male if uncertain
  };

  const handleNameSubmit = () => {
    if (userName.trim()) {
      const detectedGender = detectGender(userName);
      setUserGender(detectedGender);
      setShowNameInput(false);
      toast.success(
        state.currentLanguage === 'ar' 
          ? `أهلاً وسهلاً ${userName}! 🎉`
          : `Welcome ${userName}! 🎉`
      );
    }
  };

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
      if (userName && userGender) {
        // Pass user info to the voice service via the enhanced voice service
        const { enhancedVoiceService } = await import('@/services/enhancedVoiceService');
        enhancedVoiceService.setUserInfo(userName, userGender);
      }
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
      "min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-cyan-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-pink-900/20",
      "relative overflow-hidden",
      isRTL ? 'rtl font-arabic' : 'ltr',
      className
    )}>
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-xl float-animation"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-r from-cyan-400/20 to-purple-400/20 rounded-full blur-xl float-animation" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-32 left-1/3 w-40 h-40 bg-gradient-to-r from-pink-400/15 to-cyan-400/15 rounded-full blur-xl float-animation" style={{animationDelay: '2s'}}></div>
      </div>

      {/* Modern Header with Gen Z vibes */}
      <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-b border-purple-200/50 dark:border-purple-700/50 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 via-pink-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg pulse-glow">
                  <Heart className="h-7 w-7 text-white" />
                </div>
                <div>
                   <h1 className="text-2xl font-bold text-gradient">
                     {state.currentLanguage === 'ar' ? '🩺 الممرضة أميرة' : '🩺 Nurse Amira'}
                   </h1>
                   <p className="text-sm text-purple-600 dark:text-purple-300 font-medium">
                     {state.currentLanguage === 'ar' 
                       ? (userGender === 'female' ? '✨ مساعدتج الصحية المفضلة' : '✨ مساعدك الصحي المفضل')
                       : '✨ Your Fave Health Buddy'
                     }
                   </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Status Badge with Gen Z style */}
              <div className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold border-2",
                statusInfo.color.includes('gray') && "bg-gray-100 text-gray-700 border-gray-300",
                statusInfo.color.includes('red') && "bg-red-100 text-red-700 border-red-300",
                statusInfo.color.includes('blue') && "bg-blue-100 text-blue-700 border-blue-300",
                statusInfo.color.includes('green') && "bg-green-100 text-green-700 border-green-300",
                statusInfo.color.includes('purple') && "bg-purple-100 text-purple-700 border-purple-300",
                statusInfo.color.includes('emerald') && "bg-gradient-to-r from-emerald-400 to-cyan-400 text-white border-emerald-300 shadow-lg"
              )}>
                <StatusIcon className={cn(
                  "h-4 w-4",
                  statusInfo.pulse && "animate-pulse"
                )} />
                {state.currentLanguage === 'ar' ? 
                  (statusInfo.text === 'Ready' ? 'جاهزة! 💪' : 
                   statusInfo.text === 'Listening' ? (userGender === 'female' ? 'اسمعج 👂' : 'اسمعك 👂') : 
                   statusInfo.text === 'Speaking' ? 'اتكلم 🎤' : 
                   statusInfo.text === 'Processing...' ? 'اشتغل... 🧠' :
                   statusInfo.text === 'Disconnected' ? 'مو متصلة 😴' : 
                   statusInfo.text) : 
                  (statusInfo.text === 'Ready' ? 'Ready! 💪' : 
                   statusInfo.text === 'Listening' ? 'Listening 👂' : 
                   statusInfo.text === 'Speaking' ? 'Speaking 🎤' : 
                   statusInfo.text === 'Processing...' ? 'Thinking... 🧠' :
                   statusInfo.text === 'Disconnected' ? 'Offline 😴' : 
                   statusInfo.text)
                }
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

      {/* Name Input Modal */}
      <Dialog open={showNameInput} onOpenChange={(open) => !open && setShowNameInput(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-bold text-gradient">
              {state.currentLanguage === 'ar' ? '🤗 أهلاً وسهلاً!' : '🤗 Welcome!'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="text-center mb-6">
              <p className="text-gray-600 dark:text-gray-300">
                {state.currentLanguage === 'ar' 
                  ? 'شنو اسمك حتى أعرف كيف أكلمك؟ 😊'
                  : 'What\'s your name so I know how to talk to you? 😊'
                }
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="userName" className="text-sm font-medium">
                {state.currentLanguage === 'ar' ? 'الاسم' : 'Name'}
              </Label>
              <Input
                id="userName"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder={state.currentLanguage === 'ar' ? 'ادخل اسمك...' : 'Enter your name...'}
                className="text-center"
                onKeyPress={(e) => e.key === 'Enter' && handleNameSubmit()}
              />
            </div>
            <Button 
              onClick={handleNameSubmit} 
              disabled={!userName.trim()}
              className="w-full btn-neon"
            >
              {state.currentLanguage === 'ar' ? '✨ يلا نبدأ!' : '✨ Let\'s Start!'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Conversation Area with Gen Z styling */}
          <div className="lg:col-span-2">
            <Card className="h-[calc(100vh-200px)] flex flex-col bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-2 border-purple-200/50 dark:border-purple-700/50 shadow-2xl overflow-hidden">
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
                        <div className="w-24 h-24 bg-gradient-to-br from-purple-400 via-pink-400 to-cyan-400 rounded-3xl flex items-center justify-center mx-auto mb-6 float-animation">
                          <MessageCircle className="h-12 w-12 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-gradient mb-3">
                          {state.currentLanguage === 'ar' 
                            ? (userName ? `هلا والله ${userName}! 🤗 أنا أميرة` : "هلا والله! 🤗 أنا أميرة") 
                            : (userName ? `Hey there ${userName}! 🤗 I'm Amira` : "Hey there! 🤗 I'm Amira")
                          }
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 text-base leading-relaxed mb-6 font-medium">
                          {state.currentLanguage === 'ar' 
                            ? (userGender === 'female' 
                                ? "شحالِش حبيبتي؟ 💕 أنا هني أساعدج في أي شي يخص صحتج. كلميني عادي مثل أختج! 🗣️✨"
                                : "شحالَك حبيبي؟ 💕 أنا هني أساعدك في أي شي يخص صحتك. كلمني عادي مثل أخوك! 🗣️✨"
                              )
                            : "What's good bestie? 💕 I'm here to help with all your health stuff. Just talk to me like your best friend! 🗣️✨"
                          }
                        </p>
                        <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-400 to-orange-400 text-white rounded-full text-sm font-bold shadow-lg">
                          <Heart className="h-5 w-5" />
                          {state.currentLanguage === 'ar' 
                            ? (userGender === 'female' 
                                ? "دايماً استشيري الدكتور للقرارات المهمة 👩‍⚕️" 
                                : "دايماً استشر الدكتور للقرارات المهمة 👨‍⚕️"
                              )
                            : "Always check with your doc for the big stuff 👩‍⚕️"
                          }
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

                {/* Voice Controls Bar with Gen Z style */}
                <div className="p-6 bg-gradient-to-r from-purple-50/80 via-pink-50/80 to-cyan-50/80 dark:from-gray-800/80 dark:via-purple-900/20 dark:to-pink-900/20 border-t border-purple-200/50 backdrop-blur-sm">
                  <div className="flex items-center justify-center gap-4">
                    {!state.isConnected ? (
                      <Button 
                        onClick={handleConnect} 
                        className="btn-neon px-8 py-4 rounded-2xl text-lg font-bold shadow-2xl transform hover:scale-105 transition-all duration-300"
                      >
                        <Phone className="h-6 w-6 mr-3" />
                        {state.currentLanguage === 'ar' ? '🚀 يلا نبدأ!' : '🚀 Let\'s Go!'}
                      </Button>
                    ) : (
                      <>
                        {/* Main Voice Button with extreme Gen Z styling */}
                        <Button
                          onClick={toggleRecording}
                          disabled={!canRecord}
                          className={cn(
                            "w-20 h-20 rounded-full p-0 transition-all duration-500 transform border-4",
                            state.isRecording 
                              ? "bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 scale-110 shadow-2xl border-white pulse-glow" 
                              : "bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 hover:from-purple-600 hover:via-pink-600 hover:to-cyan-600 shadow-xl border-purple-300 hover:scale-105 gradient-animation"
                          )}
                        >
                          {state.isRecording ? (
                            <MicOff className="h-8 w-8 text-white animate-pulse" />
                          ) : (
                            <Mic className="h-8 w-8 text-white" />
                          )}
                        </Button>

                        {/* Secondary Actions with Gen Z style */}
                        <div className="flex gap-3">
                          <Button
                            onClick={handleDisconnect}
                            variant="outline"
                            className="h-12 px-6 rounded-xl border-2 border-purple-300 text-purple-700 hover:bg-purple-50 font-bold"
                          >
                            <PhoneOff className="h-5 w-5 mr-2" />
                            {state.currentLanguage === 'ar' ? '👋 باي' : '👋 Peace'}
                          </Button>
                          
                          <Button
                            onClick={clearMessages}
                            variant="outline"
                            disabled={messages.length === 0}
                            className="h-12 px-6 rounded-xl border-2 border-cyan-300 text-cyan-700 hover:bg-cyan-50 font-bold"
                          >
                            {state.currentLanguage === 'ar' ? '🗑️ امسح' : '🗑️ Clear'}
                          </Button>
                        </div>
                      </>
                    )}
                  </div>

                  {state.error && (
                    <div className="mt-4 p-4 bg-gradient-to-r from-red-100 to-pink-100 border-2 border-red-300 rounded-2xl">
                      <p className="text-red-700 text-sm text-center font-medium">⚠️ {state.error}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar with Gen Z aesthetic */}
          <div className="space-y-6">
            {/* Quick Patient Access with modern styling */}
            <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-2 border-purple-200/50 dark:border-purple-700/50 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-lg text-gradient flex items-center gap-2">
                    <Users className="h-6 w-6 text-purple-500" />
                    {state.currentLanguage === 'ar' ? '👥 المرضى' : '👥 Patients'}
                  </h3>
                  <Sheet open={showPatients} onOpenChange={setShowPatients}>
                    <SheetTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-96">
                      <SheetHeader>
                        <SheetTitle className="flex items-center gap-2 text-xl font-bold text-gradient">
                          <Users className="h-6 w-6" />
                          {state.currentLanguage === 'ar' ? '📋 دليل المرضى' : '📋 Patient Directory'}
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
                  className="w-full mt-4 h-12 rounded-xl border-2 border-purple-300 text-purple-700 hover:bg-purple-50 font-bold" 
                  onClick={() => setShowPatients(true)}
                >
                  {state.currentLanguage === 'ar' ? '📋 شوف الكل' : '📋 See All'}
                </Button>
              </CardContent>
            </Card>

            {/* Quick Stats with Gen Z vibes */}
            <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-2 border-cyan-200/50 dark:border-cyan-700/50 shadow-xl">
              <CardContent className="p-6">
                <h3 className="font-bold text-lg text-gradient mb-4 flex items-center gap-2">
                  <Activity className="h-6 w-6 text-cyan-500" />
                  {state.currentLanguage === 'ar' ? '📊 إحصائيات الجلسة' : '📊 Session Stats'}
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
                    <span className="text-sm font-bold text-gray-700">{state.currentLanguage === 'ar' ? '💬 الرسائل' : '💬 Messages'}</span>
                    <Badge variant="secondary" className="bg-purple-200 text-purple-800 font-bold">{messages.length}</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl">
                    <span className="text-sm font-bold text-gray-700">{state.currentLanguage === 'ar' ? '🌍 اللغة' : '🌍 Language'}</span>
                    <Badge variant="outline" className="border-cyan-300 text-cyan-700 font-bold">
                      {state.currentLanguage === 'ar' ? '🇴🇲 عربي' : '🇺🇸 English'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl">
                    <span className="text-sm font-bold text-gray-700">{state.currentLanguage === 'ar' ? '👤 المريض' : '👤 Patient'}</span>
                    <Badge variant={selectedPatient ? "default" : "secondary"} className={selectedPatient ? "bg-green-200 text-green-800 font-bold" : "bg-gray-200 text-gray-600 font-bold"}>
                      {selectedPatient ? (state.currentLanguage === 'ar' ? '✅ محدد' : '✅ Selected') : (state.currentLanguage === 'ar' ? '❌ مو محدد' : '❌ None')}
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