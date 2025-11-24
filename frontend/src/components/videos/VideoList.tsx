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
import { Search, Eye, Loader2 } from 'lucide-react';
import { formatDateTime } from '@/utils/formatters';

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

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        setIsLoading(true);
        const result = await videoApi.getVideos();
        setVideos(result.data || []);
      } catch (error) {
        console.error('Failed to fetch videos:', error);
        setVideos([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVideos();
  }, []);

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

      return matchesSearch && matchesLocation;
    });
  }, [videos, searchQuery, locationFilter]);

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
                  <TableCell>{getStatusBadge('Completed')}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/dashboard/video/${video.id}`)}
                      className="gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default VideoList;
