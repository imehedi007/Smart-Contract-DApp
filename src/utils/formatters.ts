import { format, parseISO } from 'date-fns';

export const formatDateTime = (isoString: string): string => {
  try {
    return format(parseISO(isoString), 'MMM dd, yyyy HH:mm:ss');
  } catch {
    return isoString;
  }
};

export const formatTime = (isoString: string): string => {
  try {
    return format(parseISO(isoString), 'HH:mm:ss');
  } catch {
    return isoString;
  }
};

export const calculateDuration = (startTime: string, endTime: string): string => {
  try {
    const start = parseISO(startTime);
    const end = parseISO(endTime);
    const diffMs = end.getTime() - start.getTime();
    const seconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${seconds}s`;
  } catch {
    return 'N/A';
  }
};

export const formatConfidence = (confidence: number): string => {
  return `${(confidence * 100).toFixed(1)}%`;
};

export const getConfidenceTier = (confidence: number): 'high' | 'medium' | 'low' => {
  if (confidence > 0.9) return 'high';
  if (confidence >= 0.7) return 'medium';
  return 'low';
};

export const getConfidenceColor = (confidence: number): string => {
  const tier = getConfidenceTier(confidence);
  switch (tier) {
    case 'high':
      return 'text-success';
    case 'medium':
      return 'text-warning';
    case 'low':
      return 'text-destructive';
  }
};
