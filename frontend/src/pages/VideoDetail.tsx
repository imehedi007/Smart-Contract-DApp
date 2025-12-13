import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { videoApi } from '@/services/videoApi';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import VideoPlayer from '@/components/video-detail/VideoPlayer';
import DetectedPersons from '@/components/video-detail/DetectedPersons';
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
      
      if (!videoData) {
        setIsLoading(true);
      }
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

    // Poll every 3 seconds if video is processing
    const interval = setInterval(() => {
      if (videoData?.annotated_video?.processing_status === 'Processing') {
        fetchVideoData();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [videoId, videoData?.annotated_video?.processing_status]);

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
          <p className="text-muted-foregrofd">{error || 'Video not found'}</p>
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
          <div>
            <h2 className="text-xl font-semibold mb-4">Uploaded Video</h2>
            <VideoPlayer
              videoUrl={`http://localhost:3001/api/video/stream/${videoData.id}`}
              videoId={videoData.id}
              videoData={videoData.original_video}
            />
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-4">Annotated Video</h2>
            {videoData.annotated_video?.processing_status === 'Completed' ? (
              <VideoPlayer
                videoUrl={`http://localhost:3001/api/video/stream/${videoData.id}?type=annotated`}
                videoId={videoData.id}
                videoData={videoData.annotated_video}
                isAnnotated={true}
              />
            ) : (
              <div className="border border-border rounded-lg p-8 bg-card">
                <div className="text-center">
                  {videoData.annotated_video?.processing_status === 'Processing' ? (
                    <>
                      <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                      <p className="text-muted-foreground">Processing annotated video...</p>
                    </>
                  ) : (
                    <>
                      <p className="text-destructive">Processing failed</p>
                      {videoData.annotated_video?.error && (
                        <p className="text-sm text-muted-foreground mt-2">
                          {videoData.annotated_video.error}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {videoData.annotated_video?.processing_status === 'Completed' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Detected Persons</h2>
            <DetectedPersons persons={videoData.annotated_video?.persons} />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default VideoDetail;
