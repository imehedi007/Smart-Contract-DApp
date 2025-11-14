import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video } from '@/models/types';
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
import { Search, Eye } from 'lucide-react';
import { formatDateTime } from '@/utils/formatters';

interface VideoListProps {
  videos: Video[];
}

const VideoList = ({ videos }: VideoListProps) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');

  const locations = useMemo(() => {
    const unique = new Set(videos.map(v => v.camera_location));
    return Array.from(unique).sort();
  }, [videos]);

  const filteredVideos = useMemo(() => {
    return videos.filter(video => {
      const matchesSearch = 
        video.video_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        video.camera_id.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = 
        statusFilter === 'all' || video.processing_status === statusFilter;
      
      const matchesLocation = 
        locationFilter === 'all' || video.camera_location === locationFilter;

      return matchesSearch && matchesStatus && matchesLocation;
    });
  }, [videos, searchQuery, statusFilter, locationFilter]);

  const getStatusBadge = (status: Video['processing_status']) => {
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
      <Badge variant={variants[status]} className={colors[status]}>
        {status}
      </Badge>
    );
  };

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
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Processing">Processing</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
            <SelectItem value="Failed">Failed</SelectItem>
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
              <TableHead className="text-right">Events</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredVideos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No videos found
                </TableCell>
              </TableRow>
            ) : (
              filteredVideos.map((video) => (
                <TableRow key={video.video_id} className="border-border">
                  <TableCell className="font-mono text-sm">
                    {video.video_id}
                  </TableCell>
                  <TableCell>{video.camera_location}</TableCell>
                  <TableCell className="font-mono text-sm">
                    {video.camera_id}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDateTime(video.upload_time)}
                  </TableCell>
                  <TableCell>{getStatusBadge(video.processing_status)}</TableCell>
                  <TableCell className="text-right">
                    {video.detected_events_count ?? '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/dashboard/video/${video.video_id}`)}
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
