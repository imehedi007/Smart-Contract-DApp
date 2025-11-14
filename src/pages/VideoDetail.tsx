import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { VideoMetadata } from '@/models/types';
import { videoApi } from '@/services/videoApi';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import VideoPlayer from '@/components/video-detail/VideoPlayer';
import EventsList from '@/components/video-detail/EventsList';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';

const VideoDetail = () => {
  const { videoId } = useParams<{ videoId: string }>();
  const navigate = useNavigate();
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMetadata = async () => {
      if (!videoId) return;
      
      setIsLoading(true);
      try {
        const data = await videoApi.getVideoMetadata(videoId);
        setMetadata(data);
      } catch (error) {
        console.error('Failed to fetch metadata:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetadata();
  }, [videoId]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!metadata) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Video not found</p>
          <Button
            onClick={() => navigate('/dashboard')}
            className="mt-4"
            variant="outline"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Button
              onClick={() => navigate('/dashboard')}
              variant="outline"
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Videos
            </Button>
            <h1 className="text-3xl font-bold">{metadata.video_id}</h1>
            <p className="text-muted-foreground mt-1">
              {metadata.camera_location} • {metadata.camera_id}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <VideoPlayer
            videoUrl={videoApi.getVideoStreamUrl(metadata.video_id)}
            videoId={metadata.video_id}
          />
          
          <EventsList
            events={metadata.detected_events}
            onJumpToEvent={(time) => console.log('Jump to:', time)}
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default VideoDetail;
