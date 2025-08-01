// Oman Healthcare Service - Real-time information about hospitals and health centers
import { debugLogger } from '@/utils/debugLogger';

interface HealthcareFacility {
  name: string;
  type: 'hospital' | 'health_center' | 'clinic' | 'pharmacy';
  location: string;
  phone?: string;
  services: string[];
  emergencyServices: boolean;
}

interface PerplexityResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export class OmanHealthcareService {
  private static PERPLEXITY_API_KEY = 'pplx-7c8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e'; // Default key
  private static PERPLEXITY_BASE_URL = 'https://api.perplexity.ai/chat/completions';
  
  // Static comprehensive database of Oman healthcare facilities
  private static OMAN_FACILITIES: HealthcareFacility[] = [
    {
      name: 'مستشفى السلطان قابوس الجامعي',
      type: 'hospital',
      location: 'الخود، مسقط',
      phone: '+968 24144000',
      services: ['طوارئ', 'جراحة', 'باطنية', 'أطفال', 'نساء وولادة', 'قلب', 'عظام', 'عيون', 'أنف وأذن وحنجرة'],
      emergencyServices: true
    },
    {
      name: 'مستشفى خولة',
      type: 'hospital', 
      location: 'العذيبة، مسقط',
      phone: '+968 24560300',
      services: ['طوارئ', 'جراحة', 'باطنية', 'أطفال', 'نساء وولادة', 'عظام', 'جلدية'],
      emergencyServices: true
    },
    {
      name: 'مستشفى جامعة السلطان قابوس',
      type: 'hospital',
      location: 'الخود، مسقط',
      phone: '+968 24141000',
      services: ['طوارئ', 'تعليم طبي', 'بحوث', 'تخصصات دقيقة'],
      emergencyServices: true
    },
    {
      name: 'مستشفى النهضة',
      type: 'hospital',
      location: 'الغبرة، مسقط',
      phone: '+968 24837000',
      services: ['طوارئ', 'جراحة', 'باطنية', 'أطفال'],
      emergencyServices: true
    },
    {
      name: 'مركز صحة الخويرات',
      type: 'health_center',
      location: 'الخويرات، مسقط',
      services: ['رعاية أولية', 'تطعيمات', 'فحوصات دورية', 'أمومة وطفولة'],
      emergencyServices: false
    },
    {
      name: 'مركز صحة الحيل',
      type: 'health_center',
      location: 'الحيل، مسقط',
      services: ['رعاية أولية', 'تطعيمات', 'علاج مزمنة', 'صحة المجتمع'],
      emergencyServices: false
    },
    {
      name: 'مركز صحة المطار',
      type: 'health_center',
      location: 'المطار، مسقط',
      services: ['رعاية أولية', 'فحوصات طبية', 'علاج عام'],
      emergencyServices: false
    },
    {
      name: 'مركز صحة الوطية',
      type: 'health_center',
      location: 'الوطية، مسقط',
      services: ['رعاية أولية', 'صحة الأسرة', 'تطعيمات'],
      emergencyServices: false
    },
    {
      name: 'مستشفى صحار',
      type: 'hospital',
      location: 'صحار، الباطنة شمال',
      phone: '+968 26850200',
      services: ['طوارئ', 'جراحة', 'باطنية', 'أطفال', 'نساء وولادة'],
      emergencyServices: true
    },
    {
      name: 'مستشفى نزوى',
      type: 'hospital',
      location: 'نزوى، الداخلية',
      phone: '+968 25411200',
      services: ['طوارئ', 'جراحة', 'باطنية', 'أطفال'],
      emergencyServices: true
    },
    {
      name: 'مستشفى صلالة',
      type: 'hospital',
      location: 'صلالة، ظفار',
      phone: '+968 23211200',
      services: ['طوارئ', 'جراحة', 'باطنية', 'أطفال', 'نساء وولادة'],
      emergencyServices: true
    },
    {
      name: 'مركز صحة الرستاق',
      type: 'health_center',
      location: 'الرستاق، الباطنة جنوب',
      services: ['رعاية أولية', 'علاج عام', 'تطعيمات'],
      emergencyServices: false
    }
  ];

  private static COMMON_MEDICATIONS = {
    headache: {
      ar: ['البنادول', 'الأدفيل', 'الأسبرين', 'البروفين', 'السيتامول', 'النوروفين'],
      en: ['Panadol', 'Advil', 'Aspirin', 'Brufen', 'Paracetamol', 'Nurofen']
    },
    fever: {
      ar: ['البنادول', 'الأدفيل', 'السيتامول', 'البروفين'],
      en: ['Panadol', 'Advil', 'Paracetamol', 'Brufen']
    },
    cold: {
      ar: ['أكتيفيد', 'كونجستال', 'فلودريكس', 'بانادول كولد آند فلو'],
      en: ['Actifed', 'Congestal', 'Fludrex', 'Panadol Cold & Flu']
    },
    cough: {
      ar: ['بروسبان', 'ميوكوسولفان', 'دكستروميثورفان'],
      en: ['Prospan', 'Mucosolvan', 'Dextromethorphan']
    },
    stomach: {
      ar: ['انتاسيد', 'جافيسكون', 'رانيتيدين', 'أوميبرازول'],
      en: ['Antacid', 'Gaviscon', 'Ranitidine', 'Omeprazole']
    }
  };

  public static setPerplexityApiKey(apiKey: string): void {
    this.PERPLEXITY_API_KEY = apiKey;
    localStorage.setItem('perplexity-api-key', apiKey);
  }

  public static getPerplexityApiKey(): string {
    return localStorage.getItem('perplexity-api-key') || this.PERPLEXITY_API_KEY;
  }

  public static async getRealtimeHealthcareInfo(query: string, language: 'ar' | 'en' = 'ar'): Promise<string> {
    try {
      const apiKey = this.getPerplexityApiKey();
      if (!apiKey) {
        return this.getFallbackHealthcareInfo(query, language);
      }

      const searchPrompt = language === 'ar' 
        ? `ابحث عن معلومات حديثة عن المستشفيات والمراكز الصحية في عُمان لسؤال: "${query}". اذكر أسماء المستشفيات، المواقع، أرقام الهواتف، والخدمات المتاحة. كن دقيق ومحدث.`
        : `Search for current information about hospitals and health centers in Oman for query: "${query}". Include hospital names, locations, phone numbers, and available services. Be accurate and up-to-date.`;

      const response = await fetch(this.PERPLEXITY_BASE_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-small-128k-online',
          messages: [
            {
              role: 'system',
              content: language === 'ar' 
                ? 'أنت مساعد طبي متخصص في النظام الصحي العُماني. قدم معلومات دقيقة ومحدثة.'
                : 'You are a medical assistant specialized in the Omani healthcare system. Provide accurate and up-to-date information.'
            },
            {
              role: 'user',
              content: searchPrompt
            }
          ],
          temperature: 0.2,
          top_p: 0.9,
          max_tokens: 500,
          return_images: false,
          return_related_questions: false,
          search_domain_filter: ['moh.gov.om', 'omanobserver.om', 'timesofoman.com'],
          search_recency_filter: 'month',
          frequency_penalty: 1,
          presence_penalty: 0
        }),
      });

      if (!response.ok) {
        debugLogger.warn('OMAN_HEALTHCARE', 'Perplexity API failed, using fallback', { status: response.status });
        return this.getFallbackHealthcareInfo(query, language);
      }

      const data: PerplexityResponse = await response.json();
      const content = data.choices?.[0]?.message?.content;
      
      if (content) {
        return content;
      } else {
        return this.getFallbackHealthcareInfo(query, language);
      }

    } catch (error) {
      debugLogger.error('OMAN_HEALTHCARE', 'Failed to get realtime healthcare info', { error });
      return this.getFallbackHealthcareInfo(query, language);
    }
  }

  private static getFallbackHealthcareInfo(query: string, language: 'ar' | 'en'): string {
    const lowerQuery = query.toLowerCase();
    
    // Search for relevant facilities
    const relevantFacilities = this.OMAN_FACILITIES.filter(facility => {
      const facilityText = `${facility.name} ${facility.location} ${facility.services.join(' ')}`.toLowerCase();
      return lowerQuery.split(' ').some(word => facilityText.includes(word)) ||
             facility.services.some(service => lowerQuery.includes(service.toLowerCase()));
    });

    // Get medication suggestions
    const medications = this.getMedicationSuggestions(query, language);

    if (language === 'ar') {
      let response = '';
      
      if (relevantFacilities.length > 0) {
        response += 'المستشفيات والمراكز المناسبة: ';
        response += relevantFacilities.slice(0, 2).map(facility => 
          `${facility.name} (${facility.location})${facility.phone ? ` - ${facility.phone}` : ''}`
        ).join('، ');
      } else {
        response += 'أقرب المستشفيات: مستشفى السلطان قابوس الجامعي (24144000)، مستشفى خولة (24560300)';
      }

      if (medications.length > 0) {
        response += `. الأدوية الشائعة: ${medications.join('، ')}`;
      }

      response += '. انصحك تراجع الطبيب للتشخيص الصحيح.';
      return response;
    } else {
      let response = '';
      
      if (relevantFacilities.length > 0) {
        response += 'Recommended hospitals/centers: ';
        response += relevantFacilities.slice(0, 2).map(facility => 
          `${facility.name} (${facility.location})${facility.phone ? ` - ${facility.phone}` : ''}`
        ).join(', ');
      } else {
        response += 'Nearest hospitals: Sultan Qaboos University Hospital (24144000), Khoula Hospital (24560300)';
      }

      if (medications.length > 0) {
        response += `. Common medications: ${medications.join(', ')}`;
      }

      response += '. I recommend consulting a doctor for proper diagnosis.';
      return response;
    }
  }

  private static getMedicationSuggestions(query: string, language: 'ar' | 'en'): string[] {
    const lowerQuery = query.toLowerCase();
    
    for (const [condition, meds] of Object.entries(this.COMMON_MEDICATIONS)) {
      const conditionTerms = {
        headache: ['headache', 'صداع', 'head', 'راس', 'الم راس'],
        fever: ['fever', 'حمى', 'سخونة', 'حرارة'],
        cold: ['cold', 'برد', 'انفلونزا', 'flu', 'زكام'],
        cough: ['cough', 'كحة', 'سعال'],
        stomach: ['stomach', 'معدة', 'بطن', 'هضم', 'acid', 'حموضة']
      };

      const terms = conditionTerms[condition as keyof typeof conditionTerms] || [];
      if (terms.some(term => lowerQuery.includes(term))) {
        return meds[language].slice(0, 3); // Return top 3 medications
      }
    }

    return [];
  }

  public static getEmergencyContacts(language: 'ar' | 'en'): string {
    if (language === 'ar') {
      return 'أرقام الطوارئ: الإسعاف 999، الشرطة 999، الحريق 999، مركز معلومات السموم 24695781';
    } else {
      return 'Emergency numbers: Ambulance 999, Police 999, Fire 999, Poison Control 24695781';
    }
  }

  public static findNearestHospital(location?: string, language: 'ar' | 'en' = 'ar'): HealthcareFacility[] {
    // Return hospitals with emergency services
    const emergencyHospitals = this.OMAN_FACILITIES.filter(facility => 
      facility.type === 'hospital' && facility.emergencyServices
    );

    if (location) {
      const filtered = emergencyHospitals.filter(hospital => 
        hospital.location.toLowerCase().includes(location.toLowerCase())
      );
      if (filtered.length > 0) return filtered;
    }

    // Return major hospitals in Muscat as default
    return emergencyHospitals.filter(hospital => 
      hospital.location.includes('مسقط') || hospital.location.includes('Muscat')
    );
  }
}