import { supabase } from '@/integrations/supabase/client';
import { VoiceMessage } from '@/types/voice';
import { type Patient } from '@/services/nurseService';

export interface ConversationLogEntry {
  user_name: string;
  user_gender: 'male' | 'female';
  session_id: string;
  message_type: 'user' | 'assistant';
  content: string;
  language: 'en' | 'ar';
  patient_context?: any;
  ip_address?: string;
  user_agent?: string;
}

export interface ConversationMemory {
  user_name: string;
  session_id: string;
  memory_type: 'user_info' | 'medical_history' | 'preferences' | 'context';
  content: any;
  relevance_score?: number;
  expires_at?: Date;
}

class ConversationLoggerService {
  private currentSessionId: string = this.generateSessionId();
  private userName: string = '';
  private userGender: 'male' | 'female' = 'male';
  private selectedPatient: Patient | null = null;

  private generateSessionId(): string {
    return crypto.randomUUID();
  }

  public setUserInfo(name: string, gender: 'male' | 'female') {
    this.userName = name;
    this.userGender = gender;
    
    // Store user info in memory for context
    this.storeMemory({
      user_name: name,
      session_id: this.currentSessionId,
      memory_type: 'user_info',
      content: { name, gender, session_started: new Date().toISOString() }
    });
  }

  public setPatientContext(patient: Patient | null) {
    this.selectedPatient = patient;
    
    if (patient) {
      // Store patient context in memory
      this.storeMemory({
        user_name: this.userName,
        session_id: this.currentSessionId,
        memory_type: 'context',
        content: { patient_id: patient.id, patient_name: patient.name, set_at: new Date().toISOString() }
      });
    }
  }

  public async logMessage(message: VoiceMessage): Promise<void> {
    if (!this.userName) {
      console.warn('Cannot log message: user name not set');
      return;
    }

    try {
      const logEntry: ConversationLogEntry = {
        user_name: this.userName,
        user_gender: this.userGender,
        session_id: this.currentSessionId,
        message_type: message.type,
        content: message.content,
        language: message.language,
        patient_context: this.selectedPatient ? {
          id: this.selectedPatient.id,
          name: this.selectedPatient.name,
          patient_id: this.selectedPatient.patient_id
        } : null,
        user_agent: navigator.userAgent
      };

      const { error } = await supabase
        .from('conversation_logs')
        .insert(logEntry);

      if (error) {
        console.error('Failed to log conversation:', error);
      } else {
        console.log(`[CONVERSATION LOG] ${message.type}: ${message.content.substring(0, 50)}...`);
      }
    } catch (error) {
      console.error('Error logging conversation:', error);
    }
  }

  public async storeMemory(memory: ConversationMemory): Promise<void> {
    try {
      const { error } = await supabase
        .from('conversation_memory')
        .upsert({
          ...memory,
          expires_at: memory.expires_at ? memory.expires_at.toISOString() : null,
          last_accessed: new Date().toISOString()
        }, {
          onConflict: 'user_name,session_id,memory_type'
        });

      if (error) {
        console.error('Failed to store memory:', error);
      }
    } catch (error) {
      console.error('Error storing memory:', error);
    }
  }

  public async getConversationMemory(userName: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('conversation_memory')
        .select('*')
        .eq('user_name', userName)
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .order('relevance_score', { ascending: false })
        .order('last_accessed', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Failed to get conversation memory:', error);
        return [];
      }

      // Update last_accessed timestamp
      if (data && data.length > 0) {
        await supabase
          .from('conversation_memory')
          .update({ last_accessed: new Date().toISOString() })
          .in('id', data.map(item => item.id));
      }

      return data || [];
    } catch (error) {
      console.error('Error getting conversation memory:', error);
      return [];
    }
  }

  public async getSessionMemory(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('conversation_memory')
        .select('*')
        .eq('session_id', this.currentSessionId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to get session memory:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error getting session memory:', error);
      return [];
    }
  }

  public getCurrentSessionId(): string {
    return this.currentSessionId;
  }

  public getUserInfo(): { name: string; gender: 'male' | 'female' } {
    return { name: this.userName, gender: this.userGender };
  }

  public startNewSession(): void {
    this.currentSessionId = this.generateSessionId();
    console.log(`[CONVERSATION LOG] New session started: ${this.currentSessionId}`);
  }
}

export const conversationLogger = new ConversationLoggerService();