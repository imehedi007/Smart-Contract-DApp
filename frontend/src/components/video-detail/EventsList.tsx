import { useState } from 'react';
import { DetectedEvent } from '@/models/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDown, Users, Clock } from 'lucide-react';
import { formatTime, calculateDuration } from '@/utils/formatters';
import PersonDetails from './PersonDetails';

interface EventsListProps {
  events: DetectedEvent[];
  onJumpToEvent: (startTime: string) => void;
}

const EventsList = ({ events, onJumpToEvent }: EventsListProps) => {
  const [openEvents, setOpenEvents] = useState<Set<number>>(new Set([0]));

  const toggleEvent = (index: number) => {
    const newOpen = new Set(openEvents);
    if (newOpen.has(index)) {
      newOpen.delete(index);
    } else {
      newOpen.add(index);
    }
    setOpenEvents(newOpen);
  };

  const handleJumpToEvent = (startTime: string) => {
    const date = new Date(startTime);
    const seconds = date.getSeconds() + (date.getMinutes() * 60) + (date.getHours() * 3600);
    onJumpToEvent(startTime);
    // In a real implementation, you would use a ref to the video player
  };

  return (
    <Card className="border-border bg-card shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Detected Events
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {events.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No events detected
          </p>
        ) : (
          events.map((event, index) => (
            <Collapsible
              key={index}
              open={openEvents.has(index)}
              onOpenChange={() => toggleEvent(index)}
            >
              <div className="rounded-lg border border-border bg-secondary/30 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg">Event #{index + 1}</h3>
                      <Badge className="bg-primary/20 text-primary border-primary">
                        <Users className="h-3 w-3 mr-1" />
                        {event.persons.length} {event.persons.length === 1 ? 'Person' : 'Persons'}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Start:</span>{' '}
                        <span className="font-mono">{formatTime(event.start_time)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">End:</span>{' '}
                        <span className="font-mono">{formatTime(event.end_time)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Duration:</span>{' '}
                        <span className="font-mono">
                          {calculateDuration(event.start_time, event.end_time)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleJumpToEvent(event.start_time)}
                      className="whitespace-nowrap"
                    >
                      Jump to Event
                    </Button>
                    
                    <CollapsibleTrigger asChild>
                      <Button size="sm" variant="ghost">
                        <ChevronDown
                          className={`h-4 w-4 transition-transform ${
                            openEvents.has(index) ? 'rotate-180' : ''
                          }`}
                        />
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                </div>

                <CollapsibleContent className="mt-4">
                  <PersonDetails persons={event.persons} />
                </CollapsibleContent>
              </div>
            </Collapsible>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default EventsList;
