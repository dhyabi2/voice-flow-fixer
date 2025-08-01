import { supabase } from '@/integrations/supabase/client';

export interface Patient {
  id: string;
  patient_id: string;
  name: string;
  age: number;
  gender: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  country?: string;
  medical_history?: string[];
  current_medications?: string[];
  allergies?: string[];
  blood_type?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  last_visit_date?: string;
  next_appointment?: string;
  notes?: string;
}

export interface MedicalKnowledge {
  id: string;
  category: string;
  title: string;
  description: string;
  symptoms?: string[];
  treatments?: string[];
  medications?: string[];
  prevention_tips?: string[];
  severity_level?: string;
  tags?: string[];
}

export interface NurseInteraction {
  id: string;
  patient_id?: string;
  interaction_type: 'voice_chat' | 'emergency' | 'consultation' | 'follow_up';
  transcript?: string;
  summary?: string;
  recommendations?: string[];
  urgency_level?: 'low' | 'medium' | 'high' | 'emergency';
  duration_seconds?: number;
  created_at: string;
}

class NurseService {
  async getPatients(): Promise<Patient[]> {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Error fetching patients:', error);
      return [];
    }
    
    return data || [];
  }

  async getPatientById(patientId: string): Promise<Patient | null> {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('patient_id', patientId)
      .single();
    
    if (error) {
      console.error('Error fetching patient:', error);
      return null;
    }
    
    return data;
  }

  async searchPatients(query: string): Promise<Patient[]> {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .or(`name.ilike.%${query}%,patient_id.ilike.%${query}%,phone.ilike.%${query}%`)
      .order('name');
    
    if (error) {
      console.error('Error searching patients:', error);
      return [];
    }
    
    return data || [];
  }

  async getMedicalKnowledge(category?: string): Promise<MedicalKnowledge[]> {
    let query = supabase.from('medical_knowledge').select('*');
    
    if (category) {
      query = query.eq('category', category);
    }
    
    const { data, error } = await query.order('title');
    
    if (error) {
      console.error('Error fetching medical knowledge:', error);
      return [];
    }
    
    return data || [];
  }

  async searchMedicalKnowledge(symptoms: string[]): Promise<MedicalKnowledge[]> {
    const { data, error } = await supabase
      .from('medical_knowledge')
      .select('*')
      .overlaps('symptoms', symptoms)
      .order('severity_level', { ascending: false });
    
    if (error) {
      console.error('Error searching medical knowledge:', error);
      return [];
    }
    
    return data || [];
  }

  async logInteraction(interaction: Omit<NurseInteraction, 'id' | 'created_at'>): Promise<void> {
    const { error } = await supabase
      .from('nurse_interactions')
      .insert([interaction]);
    
    if (error) {
      console.error('Error logging interaction:', error);
    }
  }

  async getPatientInteractions(patientId: string): Promise<NurseInteraction[]> {
    const { data, error } = await supabase
      .from('nurse_interactions')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching patient interactions:', error);
      return [];
    }
    
    return (data || []) as NurseInteraction[];
  }

  generateNursePrompt(userInput: string, patientContext?: Patient, medicalKnowledge?: MedicalKnowledge[]): string {
    let prompt = `You are Nurse Amira, a caring and professional virtual nurse assistant working in Muscat, Oman. You provide compassionate healthcare guidance while maintaining a warm, supportive tone.

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

`;

    if (patientContext) {
      prompt += `\nPATIENT CONTEXT:
- Name: ${patientContext.name}
- Age: ${patientContext.age}
- Gender: ${patientContext.gender}
- Medical History: ${patientContext.medical_history?.join(', ') || 'None recorded'}
- Current Medications: ${patientContext.current_medications?.join(', ') || 'None recorded'}
- Allergies: ${patientContext.allergies?.join(', ') || 'None recorded'}
- Blood Type: ${patientContext.blood_type || 'Not specified'}
- Notes: ${patientContext.notes || 'No additional notes'}
`;
    }

    if (medicalKnowledge && medicalKnowledge.length > 0) {
      prompt += `\nRELEVANT MEDICAL KNOWLEDGE:
${medicalKnowledge.map(mk => `
- ${mk.title} (${mk.category}): ${mk.description}
  Symptoms: ${mk.symptoms?.join(', ') || 'N/A'}
  Treatments: ${mk.treatments?.join(', ') || 'N/A'}
  Prevention: ${mk.prevention_tips?.join(', ') || 'N/A'}
  Severity: ${mk.severity_level || 'N/A'}
`).join('')}
`;
    }

    prompt += `\nUSER INPUT: "${userInput}"

Please respond as Nurse Amira with care, professionalism, and appropriate medical guidance. Keep responses concise but thorough.`;

    return prompt;
  }

  assessUrgencyLevel(userInput: string): 'low' | 'medium' | 'high' | 'emergency' {
    const emergencyKeywords = ['chest pain', 'heart attack', 'stroke', 'severe bleeding', 'unconscious', 'can\'t breathe', 'severe headache'];
    const highKeywords = ['fever', 'severe pain', 'vomiting', 'diarrhea', 'dizzy', 'allergic reaction'];
    const mediumKeywords = ['pain', 'headache', 'cough', 'tired', 'worried', 'anxious'];

    const input = userInput.toLowerCase();

    if (emergencyKeywords.some(keyword => input.includes(keyword))) {
      return 'emergency';
    }
    if (highKeywords.some(keyword => input.includes(keyword))) {
      return 'high';
    }
    if (mediumKeywords.some(keyword => input.includes(keyword))) {
      return 'medium';
    }
    
    return 'low';
  }

  extractSymptoms(userInput: string): string[] {
    const symptomKeywords = [
      'headache', 'fever', 'cough', 'sore throat', 'runny nose', 'fatigue',
      'nausea', 'vomiting', 'diarrhea', 'constipation', 'dizziness',
      'chest pain', 'shortness of breath', 'back pain', 'stomach pain',
      'rash', 'itching', 'swelling', 'bleeding', 'bruising'
    ];

    const input = userInput.toLowerCase();
    return symptomKeywords.filter(symptom => input.includes(symptom));
  }
}

export const nurseService = new NurseService();