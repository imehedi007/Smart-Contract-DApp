import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Upload, Plus, AlertCircle, Check, Trash2 } from 'lucide-react';
import axios from 'axios';

interface NIDBankRecord {
  nid: string;
  name: string;
  photo_url: string;
  uploaded_at: string;
}

const NIDBankDashboard = () => {
  const [nidRecords, setNidRecords] = useState<NIDBankRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [formData, setFormData] = useState({
    nid: '',
    name: '',
    photo: null as File | null,
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Load NID records on component mount
  useEffect(() => {
    fetchNIDRecords();
  }, []);

  const fetchNIDRecords = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/nid-bank');
      setNidRecords(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch NID records:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        photo: file
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nid || !formData.name || !formData.photo) {
      setMessage({ type: 'error', text: 'Please fill all fields and select a photo' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('nid', formData.nid);
      uploadFormData.append('name', formData.name);
      uploadFormData.append('photo', formData.photo);

      const response = await axios.post(
        'http://localhost:3001/api/nid-bank',
        uploadFormData,
        {
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      );

      if (response.data.success) {
        setMessage({ type: 'success', text: 'NID record added successfully!' });
        setFormData({ nid: '', name: '', photo: null });
        setIsDialogOpen(false);
        fetchNIDRecords();
      } else {
        setMessage({ type: 'error', text: response.data.message || 'Failed to add NID record' });
      }
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to add NID record' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (nid: string) => {
    if (!confirm('Are you sure you want to delete this NID record?')) return;

    try {
      const response = await axios.delete(`http://localhost:3001/api/nid-bank/${nid}`);
      if (response.data.success) {
        setMessage({ type: 'success', text: 'NID record deleted successfully!' });
        fetchNIDRecords();
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete NID record' });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">NID Database</h1>
            <p className="text-muted-foreground mt-1">
              Manage person identification records for face recognition
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Person
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Person Record</DialogTitle>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="nid">NID Number *</Label>
                  <Input
                    id="nid"
                    name="nid"
                    placeholder="Enter NID number"
                    value={formData.nid}
                    onChange={handleInputChange}
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Enter person's full name"
                    value={formData.name}
                    onChange={handleInputChange}
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <Label htmlFor="photo">Photo *</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="photo"
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      disabled={isLoading}
                    />
                    {formData.photo && (
                      <Check className="h-5 w-5 text-green-600" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Photo will be saved in dl/faces folder with NID naming
                  </p>
                </div>

                {message && (
                  <Alert variant={message.type === 'success' ? 'default' : 'destructive'}>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{message.text}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? 'Adding...' : 'Add Person Record'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {message && (
          <Alert variant={message.type === 'success' ? 'default' : 'destructive'}>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Registered Persons ({nidRecords.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {nidRecords.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No persons registered yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>NID Number</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Photo</TableHead>
                      <TableHead>Uploaded At</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {nidRecords.map(record => (
                      <TableRow key={record.nid}>
                        <TableCell className="font-mono">{record.nid}</TableCell>
                        <TableCell>{record.name}</TableCell>
                        <TableCell>
                          <img 
                            src={`http://localhost:3001${record.photo_url}`} 
                            alt={record.name}
                            className="h-10 w-10 rounded object-cover"
                          />
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(record.uploaded_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(record.nid)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default NIDBankDashboard;
