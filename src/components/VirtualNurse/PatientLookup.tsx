import { useState } from 'react';
import { Search, User, Phone, MapPin, Calendar, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { nurseService, type Patient } from '@/services/nurseService';
import { useTranslation } from '@/utils/translations';

interface PatientLookupProps {
  onPatientSelect: (patient: Patient) => void;
  selectedPatient?: Patient | null;
}

export function PatientLookup({ onPatientSelect, selectedPatient }: PatientLookupProps) {
  const { t, isRTL } = useTranslation('ar');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const results = await nurseService.searchPatients(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
    }
    setIsSearching(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not scheduled';
    return new Date(dateString).toLocaleDateString('en-OM');
  };

  const getUrgencyColor = (patient: Patient) => {
    const now = new Date();
    const nextAppt = patient.next_appointment ? new Date(patient.next_appointment) : null;
    
    if (nextAppt && nextAppt < now) return 'destructive';
    if (patient.medical_history?.some(h => h.includes('Heart') || h.includes('Diabetes'))) return 'outline';
    return 'secondary';
  };

  return (
    <div className="space-y-4">
      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Patient Lookup
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder={t('Search by name, ID, or phone number...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button 
              onClick={handleSearch} 
              disabled={isSearching || !searchQuery.trim()}
            >
              {isSearching ? 'Searching...' : 'Search'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Selected Patient */}
      {selectedPatient && (
        <Card className="border-primary bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <User className="h-5 w-5" />
              Selected Patient
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">{selectedPatient.name}</h3>
                <Badge variant={getUrgencyColor(selectedPatient)}>
                  {selectedPatient.patient_id}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedPatient.age} years, {selectedPatient.gender}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedPatient.phone || 'No phone'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedPatient.address || 'No address'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Next: {formatDate(selectedPatient.next_appointment)}</span>
                </div>
              </div>
              
              {selectedPatient.medical_history && selectedPatient.medical_history.length > 0 && (
                <div className="pt-2">
                  <p className="text-sm font-medium mb-1">Medical History:</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedPatient.medical_history.map((condition, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {condition}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {selectedPatient.allergies && selectedPatient.allergies.length > 0 && (
                <div className="pt-2">
                  <p className="text-sm font-medium mb-1 text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    Allergies:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {selectedPatient.allergies.map((allergy, index) => (
                      <Badge key={index} variant="destructive" className="text-xs">
                        {allergy}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Search Results ({searchResults.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {searchResults.map((patient) => (
                <div
                  key={patient.id}
                  className="p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => onPatientSelect(patient)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{patient.name}</h4>
                    <Badge variant={getUrgencyColor(patient)}>
                      {patient.patient_id}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                    <span>{patient.age} years, {patient.gender}</span>
                    <span>{patient.phone || 'No phone'}</span>
                    <span>{patient.city}</span>
                    <span>Blood: {patient.blood_type || 'Unknown'}</span>
                  </div>
                  {patient.medical_history && patient.medical_history.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {patient.medical_history.slice(0, 3).map((condition, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {condition}
                        </Badge>
                      ))}
                      {patient.medical_history.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{patient.medical_history.length - 3} more
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Results */}
      {searchResults.length === 0 && searchQuery && !isSearching && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No patients found matching "{searchQuery}"</p>
            <p className="text-sm mt-2">Try searching by name, patient ID, or phone number</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}