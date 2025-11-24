import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { videoApi } from '@/services/videoApi';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import VideoPlayer from '@/components/video-detail/VideoPlayer';
import EventsList from '@/components/video-detail/EventsList';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';

const VideoDetail = () => {
  const { videoId } = useParams<{ videoId: string }>();
  const navigate = useNavigate();
  const [videoData, setVideoData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVideoData = async () => {
      if (!videoId) return;
      
      setIsLoading(true);
      setError(null);
      try {
        const data = await videoApi.getVideoById(videoId);
        setVideoData(data);
      } catch (err) {
        console.error('Failed to fetch video:', err);
        setError('Failed to load video details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchVideoData();
  }, [videoId]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading video...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !videoData) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">{error || 'Video not found'}</p>
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
            <h1 className="text-3xl font-bold">{videoData.id}</h1>
            <p className="text-muted-foreground mt-1">
              {videoData.cameraLocation} • {videoData.cameraId}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <VideoPlayer
            videoUrl={`http://localhost:3001/api/video/stream/${videoData.id}`}
            videoId={videoData.id}
          />
          
          <EventsList
            events={[]}
            onJumpToEvent={(time) => console.log('Jump to:', time)}
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default VideoDetail;
