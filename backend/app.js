import express from 'express';
import multer from 'multer';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
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
const nidBankFilePath = path.join(__dirname, 'nid-bank.json');
const facesDir = path.join(__dirname, '..', 'dl', 'faces');

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

// Helper function to run Python script
const runPythonScript = (videoPath, videoId, outputPath) => {
  return new Promise((resolve, reject) => {
    const dlDir = path.join(__dirname, '..', 'dl');
    const pythonScript = path.join(dlDir, 'main.py');
    const pythonExe = path.join(dlDir, 'venv', 'bin', 'python');
    
    console.log(`Starting face detection for video: ${videoId}`);
    console.log(`Input video path: ${videoPath}`);
    console.log(`Output video path: ${outputPath}`);
    
    // Spawn Python process using virtual environment
    const python = spawn(pythonExe, [
      pythonScript,
      '--source', videoPath,
      '--output', outputPath,
      '--faces-dir', path.join(dlDir, 'faces'),
      '--log-level', 'INFO'
    ], {
      cwd: dlDir,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    python.stdout.on('data', (data) => {
      stdout += data.toString();
      console.log(`[Python] ${data}`);
    });

    python.stderr.on('data', (data) => {
      stderr += data.toString();
      console.error(`[Python Error] ${data}`);
    });

    python.on('close', (code) => {
      if (code === 0) {
        console.log(`Face detection completed for video: ${videoId}`);
        // Check if output video was created
        if (fs.existsSync(outputPath)) {
          // Try to read metadata file
          let personData = null;
          const metadataPath = outputPath.replace('.mp4', '_metadata.json');
          if (fs.existsSync(metadataPath)) {
            try {
              const metadataContent = fs.readFileSync(metadataPath, 'utf-8');
              const metadata = JSON.parse(metadataContent);
              personData = metadata.persons || [];
              console.log(`Loaded ${personData.length} person records from metadata`);
            } catch (err) {
              console.error('Error reading metadata file:', err);
              personData = null;
            }
          }
          
          resolve({
            success: true,
            message: 'Face detection completed',
            output: stdout,
            outputPath: outputPath,
            personData: personData
          });
        } else {
          reject(new Error(`Output video not generated at ${outputPath}`));
        }
      } else {
        console.error(`Python script failed with code ${code}`);
        reject(new Error(`Python script exited with code ${code}: ${stderr}`));
      }
    });

    python.on('error', (err) => {
      console.error('Failed to start Python process:', err);
      reject(err);
    });
  });
};

app.post('/api/footage', upload.single('videoFootage'), async (req, res) => {
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
    const videoId = path.parse(req.file.filename).name;

    // Paths for original and annotated videos
    const originalVideoPath = req.file.path;
    const annotatedVideoPath = path.join(uploadsDir, `${videoId}_annotated${path.extname(req.file.filename)}`);

    const footageData = {
      id: videoId,
      cameraId,
      cameraLocation,
      original_video: {
        fileName: req.file.filename,
        path: originalVideoPath
      },
      annotated_video: {
        fileName: `${videoId}_annotated${path.extname(req.file.filename)}`,
        path: annotatedVideoPath,
        processing_status: 'Processing'
      },
      uploadedAt: new Date().toISOString(),
      processing_status: 'Processing'
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

    // Send immediate response to client
    res.status(201).json({
      success: true,
      message: 'Footage uploaded. Face detection processing started.',
      data: footageData
    });

    // Run Python script asynchronously (don't wait for it)
    runPythonScript(originalVideoPath, videoId, annotatedVideoPath)
      .then((result) => {
        console.log('Python script result:', result);
        // Update footage status to completed
        const updatedData = loadFootageData();
        const index = updatedData.findIndex(item => item.id === videoId);
        if (index !== -1) {
          updatedData[index].processing_status = 'Completed';
          updatedData[index].annotated_video.processing_status = 'Completed';
          updatedData[index].annotated_video.path = annotatedVideoPath;
          // Add person data if available
          if (result.personData && Array.isArray(result.personData)) {
            updatedData[index].annotated_video.persons = result.personData;
            console.log(`Stored ${result.personData.length} person records for video: ${videoId}`);
          }
          updatedData[index].completed_at = new Date().toISOString();
          fs.writeFileSync(dataFilePath, JSON.stringify(updatedData, null, 2));
          console.log(`Face detection completed and data updated for: ${videoId}`);
        }
      })
      .catch((error) => {
        console.error('Face detection failed:', error);
        // Update footage status to failed
        const updatedData = loadFootageData();
        const index = updatedData.findIndex(item => item.id === videoId);
        if (index !== -1) {
          updatedData[index].processing_status = 'Failed';
          updatedData[index].annotated_video.processing_status = 'Failed';
          updatedData[index].annotated_video.error = error.message;
          fs.writeFileSync(dataFilePath, JSON.stringify(updatedData, null, 2));
          console.error(`Face detection failed and data updated for: ${videoId}`);
        }
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

app.get('/api/video/stream/:id', (req, res) => {
  try {
    const data = loadFootageData();
    const footage = data.find(item => item.id === req.params.id);

    if (!footage) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    // Default to original video, but allow query param to specify annotated
    const videoType = req.query.type === 'annotated' ? 'annotated' : 'original';
    const videoPath = videoType === 'annotated' 
      ? footage.annotated_video?.path 
      : footage.original_video?.path;

    if (!videoPath) {
      return res.status(404).json({
        success: false,
        message: `${videoType} video path not found`
      });
    }
    
    if (!fs.existsSync(videoPath)) {
      return res.status(404).json({
        success: false,
        message: 'Video file not found on server'
      });
    }

    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': end - start + 1,
        'Content-Type': 'video/mp4',
        'Access-Control-Allow-Origin': '*'
      });
      fs.createReadStream(videoPath, { start, end }).pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
        'Accept-Ranges': 'bytes',
        'Access-Control-Allow-Origin': '*'
      });
      fs.createReadStream(videoPath).pipe(res);
    }
  } catch (error) {
    console.error('Error streaming video:', error);
    res.status(500).json({
      success: false,
      message: 'Error streaming video',
      error: error.message
    });
  }
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
    
    // Delete all associated files
    const filesToDelete = [];
    
    // Old structure: videoPath
    if (removed.videoPath) {
      filesToDelete.push(removed.videoPath);
    }
    
    // New structure: original_video.path
    if (removed.original_video?.path) {
      filesToDelete.push(removed.original_video.path);
    }
    
    // Annotated video file
    if (removed.annotated_video?.path) {
      filesToDelete.push(removed.annotated_video.path);
    }
    
    // Metadata file (derive from annotated video path)
    if (removed.annotated_video?.path) {
      const metadataPath = removed.annotated_video.path.replace('.mp4', '_metadata.json');
      filesToDelete.push(metadataPath);
    }
    
    // Delete all files
    filesToDelete.forEach(filePath => {
      if (filePath && fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
          console.log(`Deleted: ${filePath}`);
        } catch (err) {
          console.error(`Failed to delete ${filePath}:`, err);
        }
      }
    });

    // Save updated data.json
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));

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

// Safely load NID bank data
const loadNIDBankData = () => {
  if (!fs.existsSync(nidBankFilePath)) {
    return [];
  }

  const raw = fs.readFileSync(nidBankFilePath, 'utf-8').trim();
  if (!raw) return [];

  try {
    return JSON.parse(raw);
  } catch (err) {
    console.error('Invalid JSON in nid-bank file:', err);
    return [];
  }
};

// Save NID bank data
const saveNIDBankData = (data) => {
  fs.writeFileSync(nidBankFilePath, JSON.stringify(data, null, 2));
};

// Ensure faces directory exists
if (!fs.existsSync(facesDir)) {
  fs.mkdirSync(facesDir, { recursive: true });
}

// Multer for NID photos
const nidPhotoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, facesDir);
  },
  filename: (req, file, cb) => {
    const nid = req.body.nid;
    cb(null, `${nid}.jpg`);
  }
});

const nidPhotoUpload = multer({ storage: nidPhotoStorage });

// NID Bank - Get all records
app.get('/api/nid-bank', (req, res) => {
  try {
    const records = loadNIDBankData();
    res.json({
      success: true,
      data: records
    });
  } catch (error) {
    console.error('Error fetching NID records:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching NID records'
    });
  }
});

// NID Bank - Upload new record
app.post('/api/nid-bank', nidPhotoUpload.single('photo'), (req, res) => {
  try {
    const { nid, name } = req.body;
    const photoFile = req.file;

    if (!nid || !name || !photoFile) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: nid, name, or photo'
      });
    }

    // Check if NID already exists
    const existingRecords = loadNIDBankData();
    if (existingRecords.some(record => record.nid === nid)) {
      // Delete the uploaded file if NID already exists
      if (fs.existsSync(photoFile.path)) {
        fs.unlinkSync(photoFile.path);
      }
      return res.status(409).json({
        success: false,
        message: `NID ${nid} already exists. Cannot upload multiple times for the same NID.`
      });
    }

    // Add record to NID bank
    const records = loadNIDBankData();
    const personId = `PERSON_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    const newRecord = {
      person_id: personId,
      nid,
      name,
      photo_url: `/api/nid-bank/photo/${nid}`,
      uploaded_at: new Date().toISOString()
    };

    records.push(newRecord);
    saveNIDBankData(records);

    res.status(201).json({
      success: true,
      message: 'NID record added successfully',
      data: newRecord
    });
  } catch (error) {
    console.error('Error adding NID record:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding NID record',
      error: error.message
    });
  }
});

// NID Bank - Get photo by NID
app.get('/api/nid-bank/photo/:nid', (req, res) => {
  try {
    const photoPath = path.join(facesDir, `${req.params.nid}.jpg`);

    if (!fs.existsSync(photoPath)) {
      return res.status(404).json({
        success: false,
        message: 'Photo not found'
      });
    }

    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    fs.createReadStream(photoPath).pipe(res);
  } catch (error) {
    console.error('Error retrieving photo:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving photo'
    });
  }
});

// NID Bank - Delete record
app.delete('/api/nid-bank/:nid', (req, res) => {
  try {
    const { nid } = req.params;
    const records = loadNIDBankData();

    // Find and remove the record
    const filteredRecords = records.filter(record => record.nid !== nid);
    
    if (filteredRecords.length === records.length) {
      return res.status(404).json({
        success: false,
        message: 'NID record not found'
      });
    }

    // Delete photo file
    const photoPath = path.join(facesDir, `${nid}.jpg`);
    if (fs.existsSync(photoPath)) {
      fs.unlinkSync(photoPath);
    }

    saveNIDBankData(filteredRecords);

    res.json({
      success: true,
      message: 'NID record deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting NID record:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting NID record'
    });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
