import { Video, VideoMetadata, UploadVideoData } from '@/models/types';
import axios from "axios";

// Mock data for development
const mockVideos: Video[] = [
  {
    video_id: 'VID_20230927_120000',
    camera_location: 'Dhanmondi',
    camera_id: 'CAM01',
    upload_time: '2023-09-27T12:00:00.000Z',
    processing_status: 'Completed',
    detected_events_count: 1,
  },
  {
    video_id: 'VID_20230927_130000',
    camera_location: 'Gulshan',
    camera_id: 'CAM02',
    upload_time: '2023-09-27T13:00:00.000Z',
    processing_status: 'Processing',
    detected_events_count: 0,
  },
];

const mockMetadata: Record<string, VideoMetadata> = {
  'VID_20230927_120000': {
    video_id: 'VID_20230927_120000',
    camera_location: 'Dhanmondi',
    camera_id: 'CAM01',
    detected_events: [
      {
        start_time: '2023-09-27T12:00:00.000Z',
        end_time: '2023-09-27T12:00:10.000Z',
        persons: [
          {
            person_id: 'P001',
            first_detected_frame: 1,
            last_detected_frame: 300,
            frames_detected: 300,
            average_confidence: 0.94,
            identification: {
              nid: '1234567890',
              name: 'John Doe',
            },
          },
          {
            person_id: 'P002',
            first_detected_frame: 1,
            last_detected_frame: 150,
            frames_detected: 150,
            average_confidence: 0.85,
            identification: null,
          },
          {
            person_id: 'P003',
            first_detected_frame: 2,
            last_detected_frame: 300,
            frames_detected: 299,
            average_confidence: 0.88,
            identification: {
              nid: '0987654321',
              name: 'Jane Smith',
            },
          },
        ],
      },
    ],
  },
};

export const videoApi = {
  getVideos: async (): Promise<Video[]> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockVideos;
  },

  uploadVideo: async (data: UploadVideoData): Promise<Video> => {
    const formData = new FormData();

    formData.append("cameraId", data.camera_id);
    formData.append("cameraLocation", data.camera_location);
    formData.append("footageId", crypto.randomUUID());
    formData.append("videoFootage", data.video);

    const response = await axios.post(
      "http://localhost:3001/api/footage",
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" }
      }
    );

    return response.data;
  },

  // uploadVideo: async (data: UploadVideoData): Promise<Video> => {
  //   await new Promise(resolve => setTimeout(resolve, 2000));
    
  //   const newVideo: Video = {
  //     video_id: `VID_${new Date().toISOString().replace(/[:.]/g, '_').slice(0, -5)}`,
  //     camera_location: data.camera_location,
  //     camera_id: data.camera_id,
  //     upload_time: new Date().toISOString(),
  //     processing_status: 'Processing',
  //     detected_events_count: 0,
  //   };
    
  //   mockVideos.unshift(newVideo);
  //   console.log(newVideo);
  //   return newVideo;
  // },

  getVideoMetadata: async (videoId: string): Promise<VideoMetadata> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const metadata = mockMetadata[videoId];
    if (!metadata) {
      throw new Error('Video metadata not found');
    }
    
    return metadata;
  },

  getVideoStreamUrl: (videoId: string): string => {
    // Return a mock video URL (you can replace with actual backend URL)
    return `https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4`;
  },
};
