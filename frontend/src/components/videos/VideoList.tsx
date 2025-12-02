import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video } from '@/models/types';
import { videoApi } from '@/services/videoApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Eye, Loader2, Trash2 } from 'lucide-react';
import { formatDateTime } from '@/utils/formatters';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface VideoListProps {
  videos?: Video[];
}

const VideoList = ({ videos: initialVideos }: VideoListProps) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [videos, setVideos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; videoId: string | null }>({ show: false, videoId: null });
  const [deleteAllConfirm, setDeleteAllConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        setIsLoading(true);
        const result = await videoApi.getVideos();
        // Combine all pages if available
        let allVideos = result.data || [];
        if (result.pagination && result.pagination.totalPages > 1) {
          // Fetch remaining pages
          for (let page = 2; page <= result.pagination.totalPages; page++) {
            const pageResult = await videoApi.getVideosPaginated(page, 10);
            allVideos = [...allVideos, ...(pageResult.data || [])];
          }
        }
        setVideos(allVideos);
      } catch (error) {
        console.error('Failed to fetch videos:', error);
        setVideos([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVideos();
  }, []);

  // Auto-refresh when there are processing videos
  useEffect(() => {
    const hasProcessing = videos.some(v => 
      (v.processing_status === 'Processing') || 
      (v.annotated_video?.processing_status === 'Processing')
    );

    if (!hasProcessing) return;

    const interval = setInterval(async () => {
      try {
        const result = await videoApi.getVideos();
        let allVideos = result.data || [];
        if (result.pagination && result.pagination.totalPages > 1) {
          for (let page = 2; page <= result.pagination.totalPages; page++) {
            const pageResult = await videoApi.getVideosPaginated(page, 10);
            allVideos = [...allVideos, ...(pageResult.data || [])];
          }
        }
        setVideos(allVideos);
      } catch (error) {
        console.error('Failed to refresh videos:', error);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [videos.some(v => (v.processing_status === 'Processing') || (v.annotated_video?.processing_status === 'Processing'))]);

  const locations = useMemo(() => {
    const unique = new Set(videos.map(v => v.cameraLocation));
    return Array.from(unique).sort();
  }, [videos]);

  const filteredVideos = useMemo(() => {
    return videos.filter(video => {
      const matchesSearch = 
        video.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        video.cameraId.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesLocation = 
        locationFilter === 'all' || video.cameraLocation === locationFilter;

      const matchesStatus = 
        statusFilter === 'all' || (video.processing_status || video.annotated_video?.processing_status || 'Completed') === statusFilter;

      return matchesSearch && matchesLocation && matchesStatus;
    });
  }, [videos, searchQuery, locationFilter, statusFilter]);

  const getStatusBadge = (status: string = 'Completed') => {
    const variants = {
      Pending: 'secondary',
      Processing: 'default',
      Completed: 'default',
      Failed: 'destructive',
    } as const;

    const colors = {
      Pending: 'bg-muted text-muted-foreground',
      Processing: 'bg-warning/20 text-warning-foreground border-warning',
      Completed: 'bg-success/20 text-success-foreground border-success',
      Failed: 'bg-destructive/20 text-destructive-foreground border-destructive',
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'default'} className={colors[status as keyof typeof colors] || ''}>
        {status}
      </Badge>
    );
  };

  const handleDeleteVideo = async (videoId: string) => {
    try {
      setIsDeleting(true);
      await videoApi.deleteVideo(videoId);
      setVideos(videos.filter(v => v.id !== videoId));
      setDeleteConfirm({ show: false, videoId: null });
    } catch (error) {
      console.error('Failed to delete video:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteAll = async () => {
    try {
      setIsDeleting(true);
      for (const video of videos) {
        await videoApi.deleteVideo(video.id);
      }
      setVideos([]);
      setDeleteAllConfirm(false);
    } catch (error) {
      console.error('Failed to delete videos:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading videos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by video ID or camera ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-input border-border"
          />
        </div>
        
        <Select value={locationFilter} onValueChange={setLocationFilter}>
          <SelectTrigger className="w-full sm:w-[180px] bg-input border-border">
            <SelectValue placeholder="All Locations" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            {locations.map(loc => (
              <SelectItem key={loc} value={loc}>{loc}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px] bg-input border-border">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
            <SelectItem value="Processing">Processing</SelectItem>
            <SelectItem value="Failed">Failed</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="destructive"
          onClick={() => setDeleteAllConfirm(true)}
          disabled={videos.length === 0 || isDeleting}
          className="w-full sm:w-auto"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete All
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-md border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border">
              <TableHead>Video ID</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Camera ID</TableHead>
              <TableHead>Upload Time</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredVideos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No videos found
                </TableCell>
              </TableRow>
            ) : (
              filteredVideos.map((video) => (
                <TableRow key={video.id} className="border-border">
                  <TableCell className="font-mono text-sm">
                    {video.id}
                  </TableCell>
                  <TableCell>{video.cameraLocation}</TableCell>
                  <TableCell className="font-mono text-sm">
                    {video.cameraId}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDateTime(video.uploadedAt)}
                  </TableCell>
                  <TableCell>{getStatusBadge(video.processing_status || video.annotated_video?.processing_status || 'Completed')}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/dashboard/video/${video.id}`)}
                        className="gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setDeleteConfirm({ show: true, videoId: video.id })}
                        disabled={isDeleting}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Single Video Dialog */}
      <AlertDialog open={deleteConfirm.show} onOpenChange={(open) => setDeleteConfirm({ ...deleteConfirm, show: open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Video</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this video? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-4">
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm.videoId && handleDeleteVideo(deleteConfirm.videoId)}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete All Videos Dialog */}
      <AlertDialog open={deleteAllConfirm} onOpenChange={setDeleteAllConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete All Videos</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete all {videos.length} videos? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-4">
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAll}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete All'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default VideoList;
