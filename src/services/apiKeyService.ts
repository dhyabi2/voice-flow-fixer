import { supabase } from '@/integrations/supabase/client';

interface ApiKeys {
  openrouter: string;
  elevenlabs: string;
  perplexity: string;
}

class ApiKeyService {
  private static instance: ApiKeyService;
  private apiKeys: ApiKeys | null = null;
  private lastFetch: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

  private constructor() {}

  public static getInstance(): ApiKeyService {
    if (!ApiKeyService.instance) {
      ApiKeyService.instance = new ApiKeyService();
    }
    return ApiKeyService.instance;
  }

  private async fetchApiKeys(): Promise<ApiKeys> {
    const now = Date.now();
    
    // Use cached keys if available and not expired
    if (this.apiKeys && (now - this.lastFetch) < this.CACHE_DURATION) {
      return this.apiKeys;
    }

    try {
      const { data, error } = await supabase.functions.invoke('get-api-keys');
      
      if (error) {
        console.error('Error fetching API keys:', error);
        throw new Error('Failed to fetch API keys');
      }

      if (!data?.success) {
        throw new Error('API key service returned error');
      }

      this.apiKeys = {
        openrouter: data.keys.openrouter || '',
        elevenlabs: data.keys.elevenlabs || '',
        perplexity: data.keys.perplexity || ''
      };
      
      this.lastFetch = now;
      return this.apiKeys;
    } catch (error) {
      console.error('Failed to fetch API keys:', error);
      
      // Fallback to hardcoded keys for development
      this.apiKeys = {
        openrouter: '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',
        elevenlabs: 'demo-key',
        perplexity: 'demo-key'
      };
      
      return this.apiKeys;
    }
  }

  public async getOpenRouterKey(): Promise<string> {
    const keys = await this.fetchApiKeys();
    return keys.openrouter;
  }

  public async getElevenLabsKey(): Promise<string> {
    const keys = await this.fetchApiKeys();
    return keys.elevenlabs;
  }

  public async getPerplexityKey(): Promise<string> {
    const keys = await this.fetchApiKeys();
    return keys.perplexity;
  }

  public async getAllKeys(): Promise<ApiKeys> {
    return await this.fetchApiKeys();
  }

  // Clear cache to force refresh
  public clearCache(): void {
    this.apiKeys = null;
    this.lastFetch = 0;
  }
}

export const apiKeyService = ApiKeyService.getInstance();