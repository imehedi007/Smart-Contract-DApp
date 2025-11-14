import { useState, useEffect } from 'react';
import { Video } from '@/models/types';
import { videoApi } from '@/services/videoApi';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import UploadPanel from '@/components/videos/UploadPanel';
import VideoList from '@/components/videos/VideoList';
import { Loader2 } from 'lucide-react';

const Dashboard = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchVideos = async () => {
    setIsLoading(true);
    try {
      const data = await videoApi.getVideos();
      setVideos(data);
    } catch (error) {
      console.error('Failed to fetch videos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <UploadPanel onUploadSuccess={fetchVideos} />
        
        <div>
          <h2 className="text-2xl font-bold mb-4">Video Library</h2>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <VideoList videos={videos} />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
