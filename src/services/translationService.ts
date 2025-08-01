import { TranslationResult } from '@/types/voice';

export class TranslationService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = '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';
    this.baseUrl = 'https://openrouter.ai/api/v1';
  }

  public async translateText(
    text: string,
    targetLanguage: 'en' | 'ar',
    sourceLanguage?: 'en' | 'ar'
  ): Promise<TranslationResult> {
    try {
      // Auto-detect source language if not provided
      const detectedLanguage = sourceLanguage || this.detectLanguage(text);
      
      if (detectedLanguage === targetLanguage) {
        return {
          originalText: text,
          translatedText: text,
          sourceLanguage: detectedLanguage,
          targetLanguage: targetLanguage,
          confidence: 1.0
        };
      }

      const prompt = this.buildTranslationPrompt(text, detectedLanguage, targetLanguage);
      
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Voice Chat Translator'
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-3.1-8b-instruct:free',
          messages: [
            {
              role: 'system',
              content: 'You are a professional translator. Provide only the translation without explanations or additional text. Maintain the original meaning and tone.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 200,
          temperature: 0.1
        })
      });

      if (!response.ok) {
        throw new Error(`Translation API error: ${response.statusText}`);
      }

      const data = await response.json();
      const translatedText = data.choices[0]?.message?.content?.trim() || text;

      return {
        originalText: text,
        translatedText: this.cleanTranslation(translatedText),
        sourceLanguage: detectedLanguage,
        targetLanguage: targetLanguage,
        confidence: 0.95
      };

    } catch (error) {
      console.error('Translation failed:', error);
      
      // Fallback to original text
      return {
        originalText: text,
        translatedText: text,
        sourceLanguage: sourceLanguage || 'en',
        targetLanguage: targetLanguage,
        confidence: 0.0
      };
    }
  }

  public async translateToStructuredOutput(
    text: string,
    targetLanguage: 'en' | 'ar'
  ): Promise<{
    summary: string;
    keyPoints: string[];
    action: string;
    translatedSummary: string;
    translatedKeyPoints: string[];
    translatedAction: string;
  }> {
    try {
      const structurePrompt = this.buildStructurePrompt(text, targetLanguage);
      
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Voice Chat Analyzer'
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-3.1-8b-instruct:free',
          messages: [
            {
              role: 'system',
              content: 'You are an AI assistant that analyzes text and provides structured output in JSON format. Always respond with valid JSON only.'
            },
            {
              role: 'user',
              content: structurePrompt
            }
          ],
          max_tokens: 300,
          temperature: 0.1
        })
      });

      if (!response.ok) {
        throw new Error(`Structure API error: ${response.statusText}`);
      }

      const data = await response.json();
      const responseText = data.choices[0]?.message?.content?.trim() || '{}';
      
      try {
        const structured = JSON.parse(responseText);
        return {
          summary: structured.summary || text,
          keyPoints: structured.keyPoints || [text],
          action: structured.action || 'No action required',
          translatedSummary: structured.translatedSummary || text,
          translatedKeyPoints: structured.translatedKeyPoints || [text],
          translatedAction: structured.translatedAction || 'No action required'
        };
      } catch (parseError) {
        console.error('Failed to parse structured response:', parseError);
        throw parseError;
      }

    } catch (error) {
      console.error('Structured output failed:', error);
      
      // Fallback structure
      return {
        summary: text,
        keyPoints: [text],
        action: 'No action required',
        translatedSummary: text,
        translatedKeyPoints: [text],
        translatedAction: 'No action required'
      };
    }
  }

  private detectLanguage(text: string): 'en' | 'ar' {
    // Simple Arabic detection based on Unicode ranges
    const arabicPattern = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
    return arabicPattern.test(text) ? 'ar' : 'en';
  }

  private buildTranslationPrompt(text: string, from: string, to: string): string {
    const languageNames = {
      'en': 'English',
      'ar': 'Arabic'
    };

    return `Translate the following text from ${languageNames[from as keyof typeof languageNames]} to ${languageNames[to as keyof typeof languageNames]}. Provide only the translation:

${text}`;
  }

  private buildStructurePrompt(text: string, targetLanguage: 'en' | 'ar'): string {
    const targetLang = targetLanguage === 'ar' ? 'Arabic' : 'English';
    
    return `Analyze the following text and provide a structured JSON response with the following fields:
- summary: A brief summary (max 50 words)
- keyPoints: Array of 2-3 key points
- action: Any action required or "No action required"
- translatedSummary: Summary translated to ${targetLang}
- translatedKeyPoints: Key points translated to ${targetLang}
- translatedAction: Action translated to ${targetLang}

Text to analyze:
${text}

Respond with valid JSON only:`;
  }

  private cleanTranslation(text: string): string {
    // Remove common prefixes/suffixes that might be added by the model
    return text
      .replace(/^(Translation:|Translated text:|Here is the translation:)/i, '')
      .replace(/^["']|["']$/g, '')
      .trim();
  }
}

export const translationService = new TranslationService();