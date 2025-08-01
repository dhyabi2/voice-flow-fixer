import { conversationLogger } from './conversationLogger';
import { VoiceMessage } from '@/types/voice';
import { type Patient } from '@/services/nurseService';

export interface ConversationContext {
  userInfo: {
    name: string;
    gender: 'male' | 'female';
  };
  sessionMemory: any[];
  userMemory: any[];
  currentPatient: Patient | null;
  sessionHistory: VoiceMessage[];
}

class MemoryService {
  private sessionHistory: VoiceMessage[] = [];
  private contextMemory: Map<string, any> = new Map();

  public addMessage(message: VoiceMessage): void {
    this.sessionHistory.push(message);
    
    // Keep only last 20 messages in memory for performance
    if (this.sessionHistory.length > 20) {
      this.sessionHistory = this.sessionHistory.slice(-20);
    }

    // Log the message for quality control
    conversationLogger.logMessage(message);

    // Extract and store important context
    this.extractAndStoreContext(message);
  }

  private extractAndStoreContext(message: VoiceMessage): void {
    const content = message.content.toLowerCase();
    
    // Extract medical symptoms mentioned
    const medicalKeywords = [
      'pain', 'headache', 'fever', 'cough', 'tired', 'dizzy', 'nausea',
      'ألم', 'صداع', 'حمى', 'سعال', 'تعب', 'دوخة', 'غثيان'
    ];
    
    const mentionedSymptoms = medicalKeywords.filter(keyword => 
      content.includes(keyword)
    );

    if (mentionedSymptoms.length > 0) {
      conversationLogger.storeMemory({
        user_name: conversationLogger.getUserInfo().name,
        session_id: conversationLogger.getCurrentSessionId(),
        memory_type: 'medical_history',
        content: {
          symptoms: mentionedSymptoms,
          mentioned_at: new Date().toISOString(),
          context: message.content,
          message_id: message.id
        },
        relevance_score: 0.9
      });
    }

    // Extract preferences (language, communication style)
    if (message.type === 'user') {
      conversationLogger.storeMemory({
        user_name: conversationLogger.getUserInfo().name,
        session_id: conversationLogger.getCurrentSessionId(),
        memory_type: 'preferences',
        content: {
          preferred_language: message.language,
          communication_style: content.length > 100 ? 'detailed' : 'brief',
          last_interaction: new Date().toISOString()
        },
        relevance_score: 0.5
      });
    }
  }

  public async getConversationContext(): Promise<ConversationContext> {
    const userInfo = conversationLogger.getUserInfo();
    const sessionMemory = await conversationLogger.getSessionMemory();
    const userMemory = await conversationLogger.getConversationMemory(userInfo.name);

    return {
      userInfo,
      sessionMemory,
      userMemory,
      currentPatient: null, // Will be set by the main interface
      sessionHistory: this.getRecentHistory()
    };
  }

  public getRecentHistory(limit: number = 10): VoiceMessage[] {
    return this.sessionHistory.slice(-limit);
  }

  public clearSessionHistory(): void {
    this.sessionHistory = [];
    conversationLogger.startNewSession();
  }

  public updateContext(key: string, value: any): void {
    this.contextMemory.set(key, value);
  }

  public getContext(key: string): any {
    return this.contextMemory.get(key);
  }

  public getContextSummary(): string {
    const userInfo = conversationLogger.getUserInfo();
    const recentMessages = this.getRecentHistory(5);
    
    let summary = `User: ${userInfo.name} (${userInfo.gender})\n`;
    
    if (recentMessages.length > 0) {
      summary += `Recent conversation (${recentMessages.length} messages):\n`;
      recentMessages.forEach((msg, index) => {
        summary += `${index + 1}. [${msg.type}] ${msg.content.substring(0, 100)}...\n`;
      });
    }

    return summary;
  }

  public async getMemoryForAI(): Promise<string> {
    const context = await this.getConversationContext();
    
    let memoryContext = '';
    
    // Add user info
    memoryContext += `User Information:\n`;
    memoryContext += `- Name: ${context.userInfo.name}\n`;
    memoryContext += `- Gender: ${context.userInfo.gender}\n\n`;

    // Add recent medical history from memory
    const medicalMemories = context.userMemory.filter(m => m.memory_type === 'medical_history');
    if (medicalMemories.length > 0) {
      memoryContext += `Recent Medical History:\n`;
      medicalMemories.slice(0, 3).forEach(memory => {
        memoryContext += `- ${memory.content.symptoms?.join(', ')} (${memory.content.mentioned_at})\n`;
      });
      memoryContext += '\n';
    }

    // Add preferences
    const preferences = context.userMemory.filter(m => m.memory_type === 'preferences');
    if (preferences.length > 0) {
      const latestPref = preferences[0];
      memoryContext += `User Preferences:\n`;
      memoryContext += `- Preferred Language: ${latestPref.content.preferred_language}\n`;
      memoryContext += `- Communication Style: ${latestPref.content.communication_style}\n\n`;
    }

    // Add recent conversation context
    if (context.sessionHistory.length > 0) {
      memoryContext += `Recent Conversation Context (last 5 messages):\n`;
      context.sessionHistory.slice(-5).forEach((msg, index) => {
        memoryContext += `${index + 1}. [${msg.type}] ${msg.content}\n`;
      });
    }

    return memoryContext;
  }
}

export const memoryService = new MemoryService();
