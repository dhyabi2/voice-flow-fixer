-- Create patients table with sample data from Oman Muscat
CREATE TABLE public.patients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT DEFAULT 'Muscat',
  country TEXT DEFAULT 'Oman',
  medical_history TEXT[],
  current_medications TEXT[],
  allergies TEXT[],
  blood_type TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  last_visit_date TIMESTAMP WITH TIME ZONE,
  next_appointment TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create medical knowledge base table
CREATE TABLE public.medical_knowledge (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  symptoms TEXT[],
  treatments TEXT[],
  medications TEXT[],
  prevention_tips TEXT[],
  severity_level TEXT CHECK (severity_level IN ('low', 'medium', 'high', 'emergency')),
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create nurse interactions table to track conversations
CREATE TABLE public.nurse_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES public.patients(id),
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('voice_chat', 'emergency', 'consultation', 'follow_up')),
  transcript TEXT,
  summary TEXT,
  recommendations TEXT[],
  urgency_level TEXT CHECK (urgency_level IN ('low', 'medium', 'high', 'emergency')),
  duration_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security (public access since no auth)
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nurse_interactions ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Public read access for patients" 
ON public.patients FOR SELECT USING (true);

CREATE POLICY "Public insert access for patients" 
ON public.patients FOR INSERT WITH CHECK (true);

CREATE POLICY "Public update access for patients" 
ON public.patients FOR UPDATE USING (true);

CREATE POLICY "Public read access for medical knowledge" 
ON public.medical_knowledge FOR SELECT USING (true);

CREATE POLICY "Public insert access for medical knowledge" 
ON public.medical_knowledge FOR INSERT WITH CHECK (true);

CREATE POLICY "Public read access for nurse interactions" 
ON public.nurse_interactions FOR SELECT USING (true);

CREATE POLICY "Public insert access for nurse interactions" 
ON public.nurse_interactions FOR INSERT WITH CHECK (true);

-- Insert sample patients from Oman Muscat
INSERT INTO public.patients (patient_id, name, age, gender, phone, email, address, medical_history, current_medications, allergies, blood_type, emergency_contact_name, emergency_contact_phone, last_visit_date, next_appointment, notes) VALUES
('P001', 'Ahmed Al-Rashid', 45, 'male', '+968 9123 4567', 'ahmed.alrashid@email.om', 'Al Khuwair, Muscat', ARRAY['Diabetes Type 2', 'Hypertension'], ARRAY['Metformin 500mg', 'Lisinopril 10mg'], ARRAY['Penicillin'], 'A+', 'Fatima Al-Rashid', '+968 9876 5432', '2024-01-15 10:30:00', '2024-02-15 14:00:00', 'Regular checkup needed'),
('P002', 'Mariam Al-Balushi', 32, 'female', '+968 9234 5678', 'mariam.balushi@email.om', 'Ruwi, Muscat', ARRAY['Asthma'], ARRAY['Salbutamol inhaler'], ARRAY['Aspirin'], 'O-', 'Omar Al-Balushi', '+968 9765 4321', '2024-01-20 09:15:00', '2024-02-20 11:30:00', 'Asthma under control'),
('P003', 'Khalid Al-Hinai', 28, 'male', '+968 9345 6789', 'khalid.hinai@email.om', 'Al Seeb, Muscat', ARRAY[], ARRAY[], ARRAY[], 'B+', 'Aisha Al-Hinai', '+968 9654 3210', '2024-01-10 16:45:00', '2024-03-10 10:00:00', 'Annual physical exam'),
('P004', 'Zahra Al-Lawati', 67, 'female', '+968 9456 7890', 'zahra.lawati@email.om', 'Bausher, Muscat', ARRAY['Arthritis', 'High Cholesterol'], ARRAY['Ibuprofen 400mg', 'Atorvastatin 20mg'], ARRAY['Shellfish'], 'AB+', 'Mohammed Al-Lawati', '+968 9543 2109', '2024-01-25 13:20:00', '2024-02-25 15:30:00', 'Joint pain management'),
('P005', 'Saif Al-Mamari', 55, 'male', '+968 9567 8901', 'saif.mamari@email.om', 'Al Amerat, Muscat', ARRAY['Heart Disease', 'Diabetes Type 2'], ARRAY['Atenolol 50mg', 'Insulin'], ARRAY['Latex'], 'A-', 'Layla Al-Mamari', '+968 9432 1098', '2024-01-30 08:00:00', '2024-02-28 09:30:00', 'Cardiac follow-up required'),
('P006', 'Noor Al-Busaidi', 24, 'female', '+968 9678 9012', 'noor.busaidi@email.om', 'Qurum, Muscat', ARRAY[], ARRAY['Birth Control'], ARRAY[], 'O+', 'Hassan Al-Busaidi', '+968 9321 0987', '2024-01-12 11:00:00', '2024-04-12 14:15:00', 'Routine gynecological exam'),
('P007', 'Abdullah Al-Kindi', 41, 'male', '+968 9789 0123', 'abdullah.kindi@email.om', 'Mutrah, Muscat', ARRAY['Sleep Apnea'], ARRAY[], ARRAY['Nuts'], 'B-', 'Maryam Al-Kindi', '+968 9210 9876', '2024-01-18 17:30:00', '2024-03-18 16:00:00', 'CPAP machine follow-up'),
('P008', 'Amina Al-Ghassani', 39, 'female', '+968 9890 1234', 'amina.ghassani@email.om', 'Al Khoud, Muscat', ARRAY['Migraine'], ARRAY['Sumatriptan'], ARRAY['Codeine'], 'A+', 'Yusuf Al-Ghassani', '+968 9109 8765', '2024-01-22 12:45:00', '2024-03-22 10:30:00', 'Migraine frequency decreasing');

-- Insert medical knowledge base
INSERT INTO public.medical_knowledge (category, title, description, symptoms, treatments, medications, prevention_tips, severity_level, tags) VALUES
('Respiratory', 'Common Cold', 'Viral infection of the upper respiratory tract', ARRAY['Runny nose', 'Sore throat', 'Cough', 'Sneezing', 'Fatigue'], ARRAY['Rest', 'Hydration', 'Warm salt water gargling'], ARRAY['Paracetamol', 'Throat lozenges'], ARRAY['Frequent hand washing', 'Avoid close contact with sick individuals', 'Get adequate sleep'], 'low', ARRAY['cold', 'virus', 'respiratory']),
('Cardiovascular', 'Hypertension', 'High blood pressure condition', ARRAY['Headaches', 'Dizziness', 'Chest pain', 'Shortness of breath'], ARRAY['Lifestyle modification', 'Regular exercise', 'Dietary changes'], ARRAY['ACE inhibitors', 'Beta blockers', 'Diuretics'], ARRAY['Reduce sodium intake', 'Regular exercise', 'Stress management', 'Limit alcohol'], 'medium', ARRAY['blood pressure', 'heart', 'cardiovascular']),
('Endocrine', 'Diabetes Type 2', 'Metabolic disorder characterized by high blood sugar', ARRAY['Frequent urination', 'Excessive thirst', 'Fatigue', 'Blurred vision', 'Slow healing wounds'], ARRAY['Blood sugar monitoring', 'Dietary management', 'Regular exercise'], ARRAY['Metformin', 'Insulin', 'Sulfonylureas'], ARRAY['Healthy diet', 'Regular exercise', 'Weight management', 'Regular health checkups'], 'medium', ARRAY['diabetes', 'blood sugar', 'endocrine']),
('Emergency', 'Heart Attack', 'Acute myocardial infarction requiring immediate medical attention', ARRAY['Chest pain', 'Shortness of breath', 'Nausea', 'Sweating', 'Arm pain'], ARRAY['Immediate medical attention', 'CPR if needed', 'Aspirin if available'], ARRAY['Aspirin', 'Nitroglycerin'], ARRAY['Healthy lifestyle', 'Regular exercise', 'No smoking', 'Stress management'], 'emergency', ARRAY['heart', 'emergency', 'cardiac']),
('Respiratory', 'Asthma', 'Chronic respiratory condition with airway inflammation', ARRAY['Wheezing', 'Shortness of breath', 'Chest tightness', 'Cough'], ARRAY['Inhaler use', 'Trigger avoidance', 'Regular monitoring'], ARRAY['Salbutamol', 'Beclomethasone', 'Prednisolone'], ARRAY['Avoid triggers', 'Regular medication use', 'Air quality awareness'], 'medium', ARRAY['asthma', 'breathing', 'respiratory']),
('Musculoskeletal', 'Arthritis', 'Joint inflammation causing pain and stiffness', ARRAY['Joint pain', 'Stiffness', 'Swelling', 'Reduced range of motion'], ARRAY['Physical therapy', 'Heat/cold therapy', 'Exercise'], ARRAY['NSAIDs', 'Corticosteroids', 'Disease-modifying drugs'], ARRAY['Regular exercise', 'Weight management', 'Joint protection'], 'medium', ARRAY['joints', 'arthritis', 'pain']);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_patients_updated_at
  BEFORE UPDATE ON public.patients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_medical_knowledge_updated_at
  BEFORE UPDATE ON public.medical_knowledge
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_patients_patient_id ON public.patients(patient_id);
CREATE INDEX idx_patients_name ON public.patients(name);
CREATE INDEX idx_patients_city ON public.patients(city);
CREATE INDEX idx_medical_knowledge_category ON public.medical_knowledge(category);
CREATE INDEX idx_medical_knowledge_tags ON public.medical_knowledge USING GIN(tags);
CREATE INDEX idx_nurse_interactions_patient_id ON public.nurse_interactions(patient_id);
CREATE INDEX idx_nurse_interactions_created_at ON public.nurse_interactions(created_at);