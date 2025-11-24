import { useRef, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { videoApi } from '@/services/videoApi';
import { Play, Pause, Loader2 } from 'lucide-react';

interface VideoPlayerProps {
  videoUrl?: string;
  videoId: string;
}

const VideoPlayer = ({ videoUrl: initialVideoUrl, videoId }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoData, setVideoData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVideoData = async () => {
      try {
        setIsLoading(true);
        const data = await videoApi.getVideoById(videoId);
        setVideoData(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch video:', err);
        setError('Failed to load video details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchVideoData();
  }, [videoId]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const seekToTime = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = seconds;
    }
  };

  if (isLoading) {
    return (
      <Card className="border-border bg-card shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5 text-primary" />
            Annotated Video
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Loading video...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-border bg-card shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5 text-primary" />
            Annotated Video
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-destructive">
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border bg-card shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Play className="h-5 w-5 text-primary" />
          Annotated Video
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            src={initialVideoUrl}
            className="w-full h-full"
            controls
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          >
            Your browser does not support the video tag.
          </video>
        </div>
        
        <div className="mt-4 space-y-2 text-sm text-muted-foreground">
          <p>Video ID: <span className="font-mono text-foreground">{videoData?.id}</span></p>
          <p>Camera: <span className="font-mono text-foreground">{videoData?.cameraId}</span></p>
          <p>Location: <span className="font-mono text-foreground">{videoData?.cameraLocation}</span></p>
          <p>Uploaded: <span className="font-mono text-foreground">{new Date(videoData?.uploadedAt).toLocaleString()}</span></p>
          <p>File: <span className="font-mono text-foreground text-xs">{videoData?.videoFileName}</span></p>
        </div>
      </CardContent>
    </Card>
  );
};

export default VideoPlayer;
