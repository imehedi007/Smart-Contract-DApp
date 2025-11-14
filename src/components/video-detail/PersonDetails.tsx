import { Person } from '@/models/types';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { User, UserCheck, UserX } from 'lucide-react';
import { formatConfidence, getConfidenceTier } from '@/utils/formatters';

interface PersonDetailsProps {
  persons: Person[];
}

const PersonDetails = ({ persons }: PersonDetailsProps) => {
  const getConfidenceBadge = (confidence: number) => {
    const tier = getConfidenceTier(confidence);
    const colors = {
      high: 'bg-success/20 text-success-foreground border-success',
      medium: 'bg-warning/20 text-warning-foreground border-warning',
      low: 'bg-destructive/20 text-destructive-foreground border-destructive',
    };

    return (
      <Badge className={colors[tier]}>
        {formatConfidence(confidence)}
      </Badge>
    );
  };

  return (
    <div className="rounded-lg border border-border bg-background overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-border">
            <TableHead>Person ID</TableHead>
            <TableHead>Frames</TableHead>
            <TableHead>Confidence</TableHead>
            <TableHead>Identification</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {persons.map((person) => (
            <TableRow key={person.person_id} className="border-border">
              <TableCell className="font-mono text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  {person.person_id}
                </div>
              </TableCell>
              
              <TableCell>
                <div className="text-sm space-y-1">
                  <div>
                    <span className="text-muted-foreground">First:</span>{' '}
                    <span className="font-mono">{person.first_detected_frame}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Last:</span>{' '}
                    <span className="font-mono">{person.last_detected_frame}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total:</span>{' '}
                    <span className="font-mono font-semibold">{person.frames_detected}</span>
                  </div>
                </div>
              </TableCell>
              
              <TableCell>
                {getConfidenceBadge(person.average_confidence)}
              </TableCell>
              
              <TableCell>
                {person.identification ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-success">
                      <UserCheck className="h-4 w-4" />
                      <span className="font-semibold">Identified</span>
                    </div>
                    <div className="text-sm">
                      <div>
                        <span className="text-muted-foreground">Name:</span>{' '}
                        <span className="font-medium">{person.identification.name}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">NID:</span>{' '}
                        <span className="font-mono text-xs">{person.identification.nid}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <UserX className="h-4 w-4" />
                    <span>Unknown</span>
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default PersonDetails;
