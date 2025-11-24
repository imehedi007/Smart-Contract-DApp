import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Loader2 } from 'lucide-react';
import { videoApi } from '@/services/videoApi';
import { toast } from 'sonner';

interface UploadPanelProps {
  onUploadSuccess: () => void;
}

const UploadPanel = ({ onUploadSuccess }: UploadPanelProps) => {
  const [cameraLocation, setCameraLocation] = useState('');
  const [cameraId, setCameraId] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      toast.error('Please select a video file');
      return;
    }

    setIsUploading(true);
    
    try {
      await videoApi.uploadVideo({
        video: selectedFile,
        camera_location: cameraLocation,
        camera_id: cameraId,
      });
      
      toast.success('Video uploaded successfully! Processing started.');
      
      // Reset form
      setCameraLocation('');
      setCameraId('');
      setSelectedFile(null);
      const fileInput = document.getElementById('video-file') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      console.log(fileInput);
      onUploadSuccess();
    } catch (error) {
      toast.error('Failed to upload video');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="border-border bg-card shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5 text-primary" />
          Upload Video
        </CardTitle>
        <CardDescription>
          Upload surveillance footage with camera details
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="camera-location">Camera Location</Label>
              <Input
                id="camera-location"
                placeholder="e.g., Dhanmondi"
                value={cameraLocation}
                onChange={(e) => setCameraLocation(e.target.value)}
                required
                className="bg-input border-border"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="camera-id">Camera ID</Label>
              <Input
                id="camera-id"
                placeholder="e.g., CAM01"
                value={cameraId}
                onChange={(e) => setCameraId(e.target.value)}
                required
                className="bg-input border-border"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="video-file">Video File</Label>
            <Input
              id="video-file"
              type="file"
              accept="video/*"
              onChange={handleFileChange}
              required
              className="bg-input border-border"
            />
            {selectedFile && (
              <p className="text-xs text-muted-foreground">
                Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isUploading}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload Video
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default UploadPanel;
