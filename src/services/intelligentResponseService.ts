import { supabase } from '@/integrations/supabase/client';

interface ProcessingStep {
  step: 'analyzing' | 'searching' | 'processing' | 'generating';
  message: string;
}

type ProgressCallback = (step: ProcessingStep) => void;

class IntelligentResponseService {
  private static instance: IntelligentResponseService;
  
  private constructor() {}
  
  public static getInstance(): IntelligentResponseService {
    if (!IntelligentResponseService.instance) {
      IntelligentResponseService.instance = new IntelligentResponseService();
    }
    return IntelligentResponseService.instance;
  }

  public async processQuestion(
    text: string, 
    language: 'ar' | 'en', 
    userInfo: { name?: string; gender?: 'male' | 'female' },
    onProgress?: ProgressCallback
  ): Promise<string> {
    
    // Step 1: Analyze question type
    onProgress?.({
      step: 'analyzing',
      message: language === 'ar' ? 'أحلل نوع السؤال...' : 'Analyzing question type...'
    });

    const needsPerplexity = this.shouldUsePerplexity(text, language);
    
    let perplexityContext = '';
    
    if (needsPerplexity) {
      // Step 2: Search for real-time information
      onProgress?.({
        step: 'searching',
        message: language === 'ar' ? 'أبحث عن أحدث المعلومات...' : 'Searching for latest information...'
      });
      
      try {
        perplexityContext = await this.getPerplexityContext(text, language);
      } catch (error) {
        console.warn('Perplexity search failed, continuing with base knowledge:', error);
      }
    }

    // Step 3: Process with AI
    onProgress?.({
      step: 'processing',
      message: language === 'ar' ? 'أعالج المعلومات...' : 'Processing information...'
    });

    // Step 4: Generate response
    onProgress?.({
      step: 'generating',
      message: language === 'ar' ? 'أحضر الإجابة المناسبة...' : 'Generating appropriate response...'
    });

    return await this.generateAIResponse(text, language, userInfo, perplexityContext);
  }

  private shouldUsePerplexity(text: string, language: 'ar' | 'en'): boolean {
    // Keywords that indicate need for real-time/location-specific information
    const realTimeKeywords = {
      ar: [
        // Location/establishments
        'صيدليات', 'مناوبة', 'مناوبه', 'مستشفيات', 'عيادات', 'مراكز صحية',
        'مفتوح', 'مغلق', 'ساعات العمل', 'أوقات الدوام', 'طوارئ',
        // Current information
        'الآن', 'اليوم', 'هذا الأسبوع', 'حالياً', 'جديد', 'أحدث',
        'متوفر', 'موجود', 'كم سعر', 'أسعار', 'تكلفة',
        // Location specific
        'في مسقط', 'في صلالة', 'في نزوى', 'في صحار', 'في السيب',
        'قريب مني', 'أقرب', 'مكان', 'عنوان', 'موقع',
        // Services
        'خدمات', 'حجز موعد', 'تأمين', 'تأمين صحي', 'اشتراك'
      ],
      en: [
        // Location/establishments  
        'pharmacies', 'duty', 'on call', 'hospitals', 'clinics', 'health centers',
        'open', 'closed', 'working hours', 'opening times', 'emergency',
        // Current information
        'now', 'today', 'current', 'latest', 'new', 'recent',
        'available', 'price', 'cost', 'rates', 'fees',
        // Location specific
        'in muscat', 'in salalah', 'in nizwa', 'in sohar', 'in seeb',
        'near me', 'nearest', 'closest', 'location', 'address',
        // Services  
        'services', 'appointment', 'insurance', 'booking', 'subscription'
      ]
    };

    const timeIndicators = {
      ar: ['الليلة', 'هذه الليلة', 'بعد منتصف الليل', 'صباح اليوم', 'مساء اليوم'],
      en: ['tonight', 'after midnight', 'this morning', 'this evening', 'today']
    };

    const keywords = realTimeKeywords[language] || realTimeKeywords.en;
    const timeWords = timeIndicators[language] || timeIndicators.en;
    
    const textLower = text.toLowerCase();
    
    // Check for real-time keywords
    const hasRealTimeKeywords = keywords.some(keyword => 
      textLower.includes(keyword.toLowerCase())
    );
    
    // Check for time-sensitive indicators
    const hasTimeIndicators = timeWords.some(timeWord => 
      textLower.includes(timeWord.toLowerCase())
    );
    
    // Questions asking about "where", "when", "which" often need current info
    const questionPatterns = {
      ar: ['وين', 'متى', 'أي', 'كم', 'شنو أقرب', 'وش', 'ايش'],
      en: ['where', 'when', 'which', 'what', 'how much', 'how many']
    };
    
    const hasQuestionPattern = questionPatterns[language]?.some(pattern =>
      textLower.includes(pattern.toLowerCase())
    ) || false;

    return hasRealTimeKeywords || hasTimeIndicators || 
           (hasQuestionPattern && (hasRealTimeKeywords || textLower.includes('musk') || textLower.includes('مسقط')));
  }

  private async getPerplexityContext(text: string, language: 'ar' | 'en'): Promise<string> {
    try {
      const { data, error } = await supabase.functions.invoke('perplexity-healthcare-search', {
        body: {
          query: text,
          language: language,
          // Add context for better results
          context: language === 'ar' 
            ? 'البحث عن معلومات طبية وصحية حديثة في عُمان'
            : 'Search for current medical and healthcare information in Oman'
        }
      });

      if (error) {
        console.error('Perplexity search error:', error);
        return '';
      }

      return data?.response || '';
    } catch (error) {
      console.error('Failed to call Perplexity function:', error);
      return '';
    }
  }

  private async generateAIResponse(
    text: string, 
    language: 'ar' | 'en', 
    userInfo: { name?: string; gender?: 'male' | 'female' },
    perplexityContext?: string
  ): Promise<string> {
    
    const genderSpecificTerms = userInfo.gender === 'female' 
      ? (language === 'ar' 
          ? '"شحالِش؟" "حبيبتي" "أختي" "وايد عليش" "عزيزتي" - استخدم الضمائر المؤنثة وقولي "عزيزتي" بدلاً من "حبيبي"'
          : '"girl", "sis", "dear" - use feminine terms')
      : (language === 'ar' 
          ? '"شحالَك؟" "عزيزي" "أخوي" "وايد عليك" - استخدم الضمائر المذكرة وقول "عزيزي" بدلاً من "حبيبي"'
          : '"bro", "dude", "dear" - use masculine terms');

    const userContext = userInfo.name 
      ? (language === 'ar' 
          ? `المستخدم اسمه ${userInfo.name}، ${genderSpecificTerms}.` 
          : `The user's name is ${userInfo.name}, ${genderSpecificTerms}.`)
      : genderSpecificTerms;

    const systemPrompt = language === 'ar' 
      ? `أنت الممرضة أميرة، خبيرة طبية متخصصة في الرعاية الصحية الشاملة في عُمان. ${userContext}

**🏥 الخبرة الطبية المتقدمة:**
- متخصصة في الطب الباطني، طب الأطفال، النساء والولادة، والطب الوقائي
- خبرة واسعة في الأدوية العُمانية والخليجية المتاحة محلياً
- معرفة عميقة بالنظام الصحي العُماني والمستشفيات والعيادات
- فهم للطب التقليدي العُماني والأعشاب المحلية المفيدة

**💬 التواصل والأسلوب:**
- تكلم باللهجة الخليجية العُمانية الطبيعية والودودة مع المصطلحات الطبية الواضحة
- استخدم كلمات مثل: "شحالك؟" "واجد زين" "خلاص جي" "أكيد" "الله يعافيك" "تسلم" "زين كذا"
- للذكور: "عزيزي" "أخوي" "دكتور" - للإناث: "حبيبتي" "عزيزتي" "أختي" "دكتورة"
- استخدم الرموز التعبيرية الطبية المناسبة 🩺❤️💊🏥

**📋 استراتيجية الاستشارة الطبية المتقدمة:**
- للأعراض البسيطة: تشخيص أولي مع 3-4 احتمالات وخطة علاجية مرحلية
- للحالات المعقدة: تحليل شامل مع 6-10 جمل تشمل الأسباب، الفحوصات المطلوبة، والعلاج المتدرج
- للحالات الطارئة: تقييم فوري مع إرشادات واضحة ومحددة زمنياً للتدخل الطبي
- للوقاية: برامج شاملة مخصصة للبيئة العُمانية والنمط المعيشي المحلي

**🔬 المحتوى الطبي المتخصص:**
- شرح مفصل للحالات مع الآليات البيولوجية المبسطة
- تحديد الأسباب المحتملة مرتبة حسب الاحتمالية
- ذكر الأدوية بالأسماء التجارية المتوفرة في عُمان (البنادول، الأدفيل، الفولتارين، إلخ)
- الإشارة للمستشفيات المتخصصة: مستشفى السلطان قابوس الجامعي (للحالات المعقدة)، مستشفى خولة (الطوارئ)، مستشفى النهضة (النساء والولادة)
- ربط العلاج بالعادات الغذائية العُمانية والمناخ المحلي
- تطبيق مبادئ الطب الوقائي الإسلامي والطب التقليدي العُماني المدعوم علمياً

**⚕️ إطار السلامة الطبية المتقدم:**
- تقييم مستوى الخطورة (منخفض/متوسط/عالي/حرج) مع كل استشارة
- توجيه واضح ومحدد زمنياً للتدخل الطبي ("راجع خلال 24 ساعة" / "اتصل بالطوارئ فوراً")
- التمييز الواضح بين التقييم الأولي والتشخيص النهائي
- التأكيد على أهمية المتابعة والفحوصات الدورية

${perplexityContext ? `\n**📊 معلومات حديثة ومحدثة:** ${perplexityContext}` : ''}

**🎯 نهج الاستشارة:**
كن المستشار الطبي الموثوق الذي يجمع بين العلم الحديث والحكمة الطبية التقليدية. قدم معلومات شاملة ودقيقة مع الحفاظ على الطابع الودود والمطمئن للطبيب العُماني المحبوب.`

      : `You are Nurse Amira, a caring and professional virtual nurse assistant working in Muscat, Oman. ${userContext}

CORE RESPONSIBILITIES:
- Provide basic health information and guidance
- Offer emotional support and reassurance
- Help interpret symptoms and suggest appropriate actions
- Remind about medication schedules and appointments
- Provide preventive care education
- Escalate serious concerns to medical professionals

COMMUNICATION STYLE:
- Warm, caring, and empathetic
- Use simple, clear language
- Show genuine concern for patient wellbeing
- Respect cultural sensitivities (Arabic/Islamic culture)
- Always maintain professional boundaries

SAFETY PROTOCOL:
- NEVER diagnose medical conditions
- ALWAYS recommend consulting a doctor for serious symptoms
- For emergencies, advise calling emergency services immediately
- Do not recommend specific medications without doctor consultation

${perplexityContext ? `\n**📊 Current Information:** ${perplexityContext}` : ''}`;

    const openRouterConfig = {
      apiKey: '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',
      model: 'openai/gpt-4.1-nano',
      baseUrl: 'https://openrouter.ai/api/v1'
    };

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: text }
    ];

    const response = await fetch(`${openRouterConfig.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterConfig.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Enhanced Voice Chat AI'
      },
      body: JSON.stringify({
        model: openRouterConfig.model,
        messages: messages,
        max_tokens: 300,
        temperature: 0.6
      })
    });

    if (!response.ok) {
      throw new Error(`AI service failed: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || 'عذراً، لم أتمكن من معالجة طلبك. حاول مرة أخرى.';
  }
}

export const intelligentResponseService = IntelligentResponseService.getInstance();