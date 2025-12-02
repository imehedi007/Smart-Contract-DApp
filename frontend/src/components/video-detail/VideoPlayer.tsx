import { useRef, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { videoApi } from '@/services/videoApi';
import { Play, Loader2 } from 'lucide-react';

interface VideoPlayerProps {
  videoUrl?: string;
  videoId: string;
  videoData?: any;
  isAnnotated?: boolean;
}

const VideoPlayer = ({ videoUrl: initialVideoUrl, videoId, videoData, isAnnotated = false }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoMetaData, setVideoMetaData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');

  useEffect(() => {
    const fetchVideoData = async () => {
      try {
        setIsLoading(true);
        
        // If videoData is already provided, use it directly
        if (videoData) {
          setVideoMetaData(videoData);
        } else {
          const data = await videoApi.getVideoById(videoId);
          const selectedVideo = isAnnotated ? data.annotated_video : data.original_video;
          setVideoMetaData(selectedVideo);
        }
        
        // Construct the streaming URL
        const url = isAnnotated 
          ? `http://localhost:3001/api/video/stream/${videoId}?type=annotated`
          : `http://localhost:3001/api/video/stream/${videoId}`;
        
        setVideoUrl(url);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch video:', err);
        setError('Failed to load video details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchVideoData();
  }, [videoId, videoData, isAnnotated]);

  if (isLoading) {
    return (
      <Card className="border-border bg-card shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5 text-primary" />
            Video Player
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
            Video Player
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
          Video Player
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            src={videoUrl || initialVideoUrl}
            className="w-full h-full"
            controls
            crossOrigin="anonymous"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          >
            Your browser does not support the video tag.
          </video>
        </div>
        
        <div className="mt-4 space-y-2 text-sm text-muted-foreground">
          <p>File: <span className="font-mono text-foreground text-xs">{videoMetaData?.fileName}</span></p>
          {videoMetaData?.processing_status && (
            <p>Status: <span className="font-mono text-foreground">{videoMetaData.processing_status}</span></p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default VideoPlayer;
