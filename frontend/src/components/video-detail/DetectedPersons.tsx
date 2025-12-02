import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, AlertCircle } from 'lucide-react';

interface Person {
  person_id: string;
  first_detected_frame: number;
  last_detected_frame: number;
  frames_detected: number;
  average_confidence: number;
  identification?: {
    nid: string;
    name: string;
  } | null;
}

interface DetectedPersonsProps {
  persons?: Person[];
}

const DetectedPersons = ({ persons = [] }: DetectedPersonsProps) => {
  // Filter out unknown persons (those without identification)
  const identifiedPersons = persons.filter(person => 
    person.identification !== null && person.identification !== undefined
  );
  
  if (!identifiedPersons || identifiedPersons.length === 0) {
    return (
      <Card className="border-border bg-card shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Detected Persons
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <AlertCircle className="h-4 w-4 mr-2" />
            <span>No persons detected in this video</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border bg-card shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Detected Persons ({identifiedPersons.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {identifiedPersons.map((person) => (
            <div key={person.person_id} className="border border-border rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-sm">{person.person_id}</p>
                  <div className="mt-1 space-y-1">
                    <p className="text-sm text-muted-foreground">
                      Name: <span className="text-foreground font-medium">{person.identification.name}</span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      NID: <span className="text-foreground font-mono">{person.identification.nid}</span>
                    </p>
                  </div>
                </div>
                <Badge variant="secondary">
                <p className="text-muted-foreground">Confidence Avg:</p>
                  {(person.average_confidence * 100).toFixed(1)}%
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default DetectedPersons;
