
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Video as VideoIcon, Users, MapPin } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LabelList } from 'recharts';


import { useEffect, useState } from 'react';
import { videoApi } from '@/services/videoApi';
import { Video } from '@/models/types';

const Analytics = () => {
  // Use 'any' for videos to match backend response structure
  const [videos, setVideos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchVideos = async () => {
      setIsLoading(true);
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
        setVideos([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchVideos();
  }, []);

  // Compute analytics
  const totalVideos = videos.length;
  const completedVideos = videos.filter(v => v.annotated_video?.processing_status === 'Completed');
  const totalEvents = completedVideos.length;
  // Unique identified persons
  const personIds = new Set<string>();
  completedVideos.forEach(v => {
    v.annotated_video?.persons?.forEach(p => {
      if (p.identification !== null && p.identification !== undefined) {
        personIds.add(p.person_id);
      }
    });
  });
  const totalPersons = personIds.size;
  // Unique locations
  const locationSet = new Set<string>(videos.map(v => v.camera_location));
  const totalLocations = locationSet.size;

  const stats = [
    { label: 'Total Videos', value: totalVideos, icon: VideoIcon, color: 'text-primary' },
    { label: 'Total Events', value: totalEvents, icon: BarChart3, color: 'text-success' },
    { label: 'Persons Detected', value: totalPersons, icon: Users, color: 'text-warning' },
    { label: 'Locations', value: totalLocations, icon: MapPin, color: 'text-accent' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Analytics</h1>
          <p className="text-muted-foreground">
            Overview of surveillance system activity
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {isLoading ? (
            <div className="col-span-4 text-center py-8 text-muted-foreground">
              Loading analytics...
            </div>
          ) : (
            stats.map((stat) => (
              <Card key={stat.label} className="border-border bg-card shadow-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </CardTitle>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <Card className="border-border bg-card shadow-card">
          <CardHeader>
            <CardTitle>Bar Chart</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" tick={{ fill: '#8884d8', fontWeight: 'bold', fontSize: 14 }} />
                  <YAxis allowDecimals={false} tick={{ fill: '#8884d8', fontWeight: 'bold', fontSize: 14 }} />
                  <Tooltip wrapperStyle={{ fontSize: '16px' }} />
                  <Bar dataKey="value" fill="#6366f1" radius={[8,8,0,0]}>
                    <LabelList dataKey="value" position="top" style={{ fontWeight: 'bold', fontSize: 16 }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Analytics;
