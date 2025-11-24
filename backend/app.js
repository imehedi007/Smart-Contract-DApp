import express from 'express';
import multer from 'multer';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const uploadsDir = path.join(__dirname, '..', 'uploads');
const dataFilePath = path.join(__dirname, 'data.json');

// Safely load data file, returning [] when missing or invalid
const loadFootageData = () => {
  if (!fs.existsSync(dataFilePath)) {
    return [];
  }

  const raw = fs.readFileSync(dataFilePath, 'utf-8').trim();
  if (!raw) return [];

  try {
    return JSON.parse(raw);
  } catch (err) {
    console.error('Invalid JSON in data file, resetting to empty list:', err);
    return [];
  }
};

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const footageId = req.body.footageId || Date.now().toString();
    const extension = path.extname(file.originalname);
    cb(null, `${footageId}${extension}`);
  }
});

const upload = multer({ storage });

app.post('/api/footage', upload.single('videoFootage'), (req, res) => {
  try {
    const { cameraId, cameraLocation } = req.body;

    if (!cameraId || !cameraLocation) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: cameraId and cameraLocation are required'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No video file uploaded'
      });
    }

    const existingData = loadFootageData();

    const footageData = {
      id: path.parse(req.file.filename).name,
      cameraId,
      cameraLocation,
      videoFileName: req.file.filename,
      videoPath: req.file.path,
      uploadedAt: new Date().toISOString()
    };

    const duplicate = existingData.some(item => item.id === footageData.id);
    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: 'Footage data already exists with this ID'
      });
    }

    existingData.push(footageData);
    fs.writeFileSync(dataFilePath, JSON.stringify(existingData, null, 2));

    res.status(201).json({
      success: true,
      message: 'Footage data saved successfully',
      data: footageData
    });

  } catch (error) {
    console.error('Error processing footage:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is healthy' });
});

app.get('/api/footage', (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const data = loadFootageData();

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = data.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedData,
      pagination: {
        page,
        limit,
        total: data.length,
        totalPages: Math.ceil(data.length / limit)
      }
    });
  } catch (error) {
    console.error('Error reading footage data:', error);
    res.status(500).json({
      success: false,
      message: 'Error reading footage data',
      error: error.message
    });
  }
});

app.get('/api/footage/list/all', (req, res) => {
  try {
    const data = loadFootageData();
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error reading footage data:', error);
    res.status(500).json({
      success: false,
      message: 'Error reading footage data',
      error: error.message
    });
  }
});

app.get('/api/footage/:id', (req, res) => {
  try {
    const data = loadFootageData();
    const footage = data.find(item => item.id === req.params.id);

    if (!footage) {
      return res.status(404).json({
        success: false,
        message: 'Footage not found'
      });
    }

    res.json({ success: true, data: footage });
  } catch (error) {
    console.error('Error fetching footage:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching footage',
      error: error.message
    });
  }
});

app.delete('/api/footage/:id', (req, res) => {
  try {
    const data = loadFootageData();
    const index = data.findIndex(item => item.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: 'Footage not found'
      });
    }

    const [removed] = data.splice(index, 1);
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));

    if (removed?.videoPath && fs.existsSync(removed.videoPath)) {
      try {
        fs.unlinkSync(removed.videoPath);
      } catch (err) {
        console.error('Failed to delete uploaded file:', err);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Footage deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting footage:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting footage',
      error: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
