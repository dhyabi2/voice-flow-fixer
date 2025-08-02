import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Heart, 
  Settings, 
  Mic, 
  MessageCircle,
  Phone,
  PhoneOff,
  Languages,
  Volume2,
  Activity,
  Square,
  Trash2,
  LogOut
} from 'lucide-react';
import { MessageList } from '../VoiceChat/MessageList';
import { VoiceWaves } from '../VoiceChat/VoiceWaves';
import { InstallPrompt } from '../PWA/InstallPrompt';
import { ProcessingIndicator } from '../VoiceChat/ProcessingIndicator';
import { LanguageToggle } from '../VoiceChat/LanguageToggle';
import { VoiceSettingsPanel } from '../VoiceChat/VoiceSettingsPanel';
import { VoiceTestPanel } from '../VoiceChat/VoiceTestPanel';
import { useVoiceChat } from '@/hooks/useVoiceChat';
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
    setElevenLabsApiKey,
    setUserInfo,
    setPatientContext
  } = useVoiceChat();

  const { t, isRTL } = useTranslation(state.currentLanguage);
  const [userName, setUserName] = useState<string>('');
  const [userGender, setUserGender] = useState<'male' | 'female' | null>(null);
  const [showNameInput, setShowNameInput] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [audioInterrupted, setAudioInterrupted] = useState(false);
  const [voiceSettings, setVoiceSettings] = useState({
    language: state.currentLanguage,
    voiceType: 'premium' as 'natural' | 'enhanced' | 'premium',
    rate: 0.85,
    pitch: 1.1
  });

  // Load saved user info on component mount
  useEffect(() => {
    const savedName = localStorage.getItem('nurse-amira-user-name');
    const savedGender = localStorage.getItem('nurse-amira-user-gender') as 'male' | 'female' | null;
    
    if (savedName && savedGender) {
      setUserName(savedName);
      setUserGender(savedGender);
      setShowNameInput(false);
      
      // Set user info for voice services immediately
      setUserInfo(savedName, savedGender);
    }
  }, [setUserInfo]);

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
      
      // Save to localStorage for future sessions
      localStorage.setItem('nurse-amira-user-name', userName.trim());
      localStorage.setItem('nurse-amira-user-gender', detectedGender);
      
      // Set user info for voice services
      setUserInfo(userName.trim(), detectedGender);
      
      toast.success(
        state.currentLanguage === 'ar' 
          ? `أهلاً وسهلاً ${userName}! 🎉 اسمك محفوظ للمرات القادمة`
          : `Welcome ${userName}! 🎉 Your name is saved for next time`
      );
    }
  };

  const handleConnect = async () => {
    try {
      await connect();
      if (userName && userGender) {
        setUserInfo(userName, userGender);
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

  const toggleRecording = () => {
    if (state.isRecording) {
      stopRecording();
    } else {
      // Show immediate feedback that AI audio is being interrupted
      if (state.isSpeaking) {
        setAudioInterrupted(true);
        // Clear the animation after it completes
        setTimeout(() => setAudioInterrupted(false), 300);
        
        toast.info(
          state.currentLanguage === 'ar' 
            ? '🔇 توقفت عن الكلام - تفضل اتكلم'
            : '🔇 I stopped talking - go ahead'
        );
      }
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
                
                {/* Voice Waves Animation when speaking */}
                {state.isSpeaking && (
                  <VoiceWaves 
                    isActive={state.isSpeaking} 
                    size="sm" 
                    color="purple"
                    className="ml-1"
                  />
                )}
                
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

              {/* Change Name Button */}
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  localStorage.removeItem('nurse-amira-user-name');
                  localStorage.removeItem('nurse-amira-user-gender');
                  setShowNameInput(true);
                }}
                className="text-xs"
              >
                {state.currentLanguage === 'ar' ? 'تغيير الاسم' : 'Change Name'}
              </Button>
              
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
                autoFocus
              />
            </div>
            <Button 
              onClick={handleNameSubmit} 
              disabled={!userName.trim()}
              className="w-full btn-neon"
            >
              {state.currentLanguage === 'ar' ? '✨ يلا نبدأ!' : '✨ Let\'s Start!'}
            </Button>
            <p className="text-xs text-gray-500 text-center">
              {state.currentLanguage === 'ar' 
                ? 'اسمك راح يتحفظ للمرات القادمة'
                : 'Your name will be saved for future sessions'
              }
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Main Conversation Area - Full Width with Mobile Optimized Scrolling */}
      <div className="max-w-6xl mx-auto px-4 py-6 pb-36">
        <Card className="h-[calc(100vh-140px)] flex flex-col bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-2 border-purple-200/50 dark:border-purple-700/50 shadow-2xl overflow-hidden">
          <CardContent className="flex-1 flex flex-col p-0">
            {/* Messages Area with Mobile-Optimized Scrolling */}
            <div className="flex-1 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
              <div className="p-6">
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
                              ? "شحالِش عزيزتي؟ 💕 أنا هني أساعدج في أي شي يخص صحتج. كلميني عادي مثل أختج! 🗣️✨"
                              : "شحالَك عزيزي؟ 💕 أنا هني أساعدك في أي شي يخص صحتك. كلمني عادي مثل أخوك! 🗣️✨"
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
                  <>
                    <MessageList 
                      messages={messages} 
                      onTranslate={() => {}} 
                    />
                    
                    {/* Processing Indicator */}
                    {state.isProcessing && state.processingStep && (
                      <div className="mt-4">
                        <ProcessingIndicator
                          isVisible={state.isProcessing}
                          currentStep={state.processingStep}
                          language={state.currentLanguage}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fixed floating control buttons with enhanced UX */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-purple-200/50 dark:border-purple-700/50 p-4 z-50 shadow-2xl">
        <div className="max-w-6xl mx-auto">
          {!state.isConnected ? (
            <Button 
              onClick={handleConnect} 
              className="w-full h-16 btn-neon px-8 py-4 rounded-2xl text-lg font-bold shadow-2xl transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
            >
              <Phone className="h-6 w-6 mr-3" />
              {state.currentLanguage === 'ar' ? '🚀 يلا نبدأ!' : '🚀 Let\'s Go!'}
            </Button>
          ) : (
            <div className="space-y-3">
              {/* Main Voice Button - Full Width */}
              <Button
                onClick={toggleRecording}
                disabled={!canRecord}
                className={cn(
                  "w-full h-20 rounded-2xl transition-all duration-500 transform border-4 text-xl font-bold shadow-2xl",
                  audioInterrupted && "audio-interrupted", // Add shake animation when audio is interrupted
                  state.isRecording 
                    ? "bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 scale-[1.02] border-white pulse-glow text-white" 
                    : "bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 hover:from-purple-600 hover:via-pink-600 hover:to-cyan-600 border-purple-300 hover:scale-[1.02] gradient-animation text-white"
                )}
              >
                <div className="flex items-center justify-center gap-4">
                  {state.isRecording ? (
                    <>
                      <Square className="h-8 w-8 animate-pulse" />
                      <span>{state.currentLanguage === 'ar' ? '🛑 توقف عن التسجيل' : '🛑 Stop Recording'}</span>
                    </>
                  ) : (
                    <>
                      <Mic className="h-8 w-8" />
                      <span>{state.currentLanguage === 'ar' ? '🎤 ابدأ التحدث' : '🎤 Start Speaking'}</span>
                    </>
                  )}
                </div>
              </Button>

              {/* Secondary Controls in a Row */}
              <div className="flex gap-3">
                <Button
                  onClick={handleDisconnect}
                  variant="outline"
                  className="flex-1 h-14 rounded-xl border-2 border-purple-300 text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/20 font-bold text-base shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                >
                  <div className="flex items-center justify-center gap-2">
                    <LogOut className="h-5 w-5" />
                    <span className="hidden sm:inline">{state.currentLanguage === 'ar' ? '👋 انهاء المحادثة' : '👋 End Session'}</span>
                    <span className="sm:hidden">{state.currentLanguage === 'ar' ? 'انهاء' : 'End'}</span>
                  </div>
                </Button>
                
                <Button
                  onClick={clearMessages}
                  variant="outline"
                  disabled={messages.length === 0}
                  className="flex-1 h-14 rounded-xl border-2 border-cyan-300 text-cyan-700 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 font-bold text-base disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                >
                  <div className="flex items-center justify-center gap-2">
                    <Trash2 className="h-5 w-5" />
                    <span className="hidden sm:inline">{state.currentLanguage === 'ar' ? '🗑️ مسح المحادثة' : '🗑️ Clear Chat'}</span>
                    <span className="sm:hidden">{state.currentLanguage === 'ar' ? 'مسح' : 'Clear'}</span>
                  </div>
                </Button>
              </div>
            </div>
          )}

          {state.error && (
            <div className="mt-3 p-3 bg-gradient-to-r from-red-100 to-pink-100 border-2 border-red-300 rounded-xl">
              <p className="text-red-700 text-sm text-center font-medium">⚠️ {state.error}</p>
            </div>
          )}
        </div>
      </div>

      {/* PWA Install Prompt */}
      <InstallPrompt language={state.currentLanguage} />
    </div>
  );
}