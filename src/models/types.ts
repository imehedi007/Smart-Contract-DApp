export interface Identification {
  nid: string;
  name: string;
}

export interface Person {
  person_id: string;
  first_detected_frame: number;
  last_detected_frame: number;
  frames_detected: number;
  average_confidence: number;
  identification: Identification | null;
}

export interface DetectedEvent {
  start_time: string;
  end_time: string;
  persons: Person[];
}

export interface VideoMetadata {
  video_id: string;
  camera_location: string;
  camera_id: string;
  detected_events: DetectedEvent[];
}

export interface Video {
  video_id: string;
  camera_location: string;
  camera_id: string;
  upload_time: string;
  processing_status: 'Pending' | 'Processing' | 'Completed' | 'Failed';
  detected_events_count?: number;
  video_url?: string;
}

export interface UploadVideoData {
  video: File;
  camera_location: string;
  camera_id: string;
}

export interface User {
  email: string;
  token: string;
}
