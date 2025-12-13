# Smart Contract DApp - Surveillance & Face Recognition System

A comprehensive surveillance system with real-time face detection, recognition, and NID (National ID) matching capabilities. Built with modern web technologies and machine learning.

## 🏗️ System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │  ML Pipeline    │
│  (React/TS)     │◄──►│  (Node.js)      │◄──►│   (Python)      │
│                 │    │                 │    │                 │
│ • Dashboard     │    │ • REST API      │    │ • YOLOv8        │
│ • Video Upload  │    │ • File Storage  │    │ • ArcFace       │
│ • Analytics     │    │ • NID Database  │    │ • Face Match    │
│ • Person View   │    │ • Processing    │    │ • Annotation    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Features

### Frontend (React + TypeScript)
- **Video Management**: Upload, view, and manage surveillance videos
- **Real-time Analytics**: Dynamic charts showing detection statistics
- **Person Detection Display**: View detected persons with identification status
- **Responsive UI**: Built with shadcn/ui components and Tailwind CSS
- **Auto-refresh**: Live updates during video processing

### Backend (Node.js + Express)
- **REST API**: Complete CRUD operations for videos and persons
- **File Management**: Video upload, streaming, and storage
- **NID Database**: National ID management with person matching
- **Processing Queue**: Handles video processing workflow
- **Real-time Status**: Processing status updates

### ML Pipeline (Python)
- **Face Detection**: YOLOv8 model for accurate face detection
- **Face Recognition**: ArcFace model for face feature extraction
- **NID Matching**: Compare detected faces with NID database
- **Video Annotation**: Generate annotated videos with bounding boxes
- **Confidence Scoring**: Reliability metrics for identifications

## 📁 Project Structure

```
Smart-Contract-DApp/
├── frontend/                 # React TypeScript frontend
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Main application pages
│   │   ├── services/       # API service layer
│   │   └── utils/          # Helper utilities
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                 # Node.js Express backend
│   ├── app.js              # Main server file
│   ├── data.json           # Video metadata storage
│   ├── nid-bank.json       # NID database
│   └── package.json
│
├── dl/                     # Machine Learning Pipeline
│   ├── main.py             # Face detection & recognition
│   ├── app.py              # Flask API (alternative)
│   ├── detection.py        # Core detection logic
│   ├── utils/              # ML helper functions
│   ├── faces/              # NID face database
│   ├── assets/             # Test video files
│   ├── requirements.txt    # Python dependencies
│   ├── w600k_r50.onnx     # ArcFace model (LFS)
│   └── yolov8m_200e.pt    # YOLOv8 model (LFS)
│
└── uploads/                # Video upload storage
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 16+ and npm
- Python 3.9+
- Git with Git LFS support

### 1. Clone Repository
```bash
git clone https://github.com/imehedi007/Smart-Contract-DApp.git
cd Smart-Contract-DApp

# Install Git LFS and pull large files
git lfs install
git lfs pull
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev  # Runs on http://localhost:8080
```

### 3. Backend Setup
```bash
cd backend
npm install
node app.js  # Runs on http://localhost:3001
```

### 4. ML Pipeline Setup
```bash
cd dl
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Test the pipeline
python main.py --input assets/1.mp4 --output test_output.mp4
```

## 🔧 Configuration

### Environment Variables
Create `.env` files in respective directories:

**Frontend (.env)**
```
VITE_API_BASE_URL=http://localhost:3001
```

**Backend (.env)**
```
PORT=3001
UPLOAD_DIR=../uploads
ML_PYTHON_PATH=../dl/main.py
```

### NID Database Format
The NID database (`backend/nid-bank.json`) follows this structure:
```json
{
  "person_id": "PERSON_1234567890_ABCDEF",
  "nid": "1234567890",
  "name": "John Doe",
  "photo_url": "/api/nid-bank/photo/1234567890",
  "uploaded_at": "2025-12-13T10:00:00.000Z"
}
```

## 📊 API Endpoints

### Videos
- `GET /api/footage` - List all videos with pagination
- `GET /api/footage/:id` - Get specific video details
- `POST /api/footage` - Upload new video
- `DELETE /api/footage/:id` - Delete video and associated files

### NID Management
- `GET /api/nid-bank` - List all NID entries
- `POST /api/nid-bank` - Add new NID entry
- `GET /api/nid-bank/photo/:nid` - Get NID photo

### Video Streaming
- `GET /api/video/stream/:id` - Stream video file
- `GET /api/video/stream/:id?type=annotated` - Stream annotated video

## 🤖 Machine Learning Models

### Large Files (Git LFS)
The project uses Git LFS to manage large model files:

- **w600k_r50.onnx** (166MB) - ArcFace face recognition model
- **yolov8m_200e.pt** (198MB) - YOLOv8 face detection model

### Model Performance
- **Face Detection**: YOLOv8 with 95%+ accuracy
- **Face Recognition**: ArcFace with 99%+ accuracy on controlled datasets
- **Processing Speed**: ~2-5 FPS on CPU, ~15-30 FPS on GPU

## 🔄 Workflow

1. **Video Upload**: User uploads surveillance video via frontend
2. **Processing Queue**: Backend queues video for ML processing
3. **Face Detection**: Python pipeline detects faces in video frames
4. **Face Recognition**: Extract face features using ArcFace
5. **NID Matching**: Compare features with NID database
6. **Annotation**: Generate annotated video with bounding boxes
7. **Results Display**: Frontend shows detected persons with identification

## 📈 Analytics Features

- **Total Videos**: Count of uploaded videos
- **Processing Events**: Completed processing sessions
- **Persons Detected**: Unique identified individuals
- **Location Coverage**: Camera locations monitored
- **Interactive Charts**: Real-time data visualization with recharts

## 🐛 Troubleshooting

### Common Issues

**Git LFS Problems**
```bash
# Re-initialize LFS if files aren't downloading
git lfs install --force
git lfs pull
```

**Python Dependencies**
```bash
# If face recognition fails to install
sudo apt-get install cmake  # Linux
brew install cmake          # macOS

# For OpenCV issues
pip install opencv-python-headless
```

**Model Loading Issues**
```bash
# Verify model files exist and are not corrupted
ls -la dl/*.onnx dl/*.pt
git lfs ls-files  # Check LFS status
```

**Port Conflicts**
- Frontend: Change port in `vite.config.ts`
- Backend: Change PORT in `app.js` or environment variable

## 🔄 Development Workflow

### Adding New Features
1. Create feature branch: `git checkout -b feature/new-feature`
2. Develop and test locally
3. Commit changes: `git commit -m "Add new feature"`
4. Push: `git push origin feature/new-feature`
5. Create pull request

### Updating ML Models
1. Add model to Git LFS: `git lfs track "*.onnx" "*.pt"`
2. Add file: `git add new_model.onnx`
3. Commit: `git commit -m "Update ML model"`
4. Push: `git push origin main`

### Database Updates
- Videos: Stored in `backend/data.json`
- NID Database: Stored in `backend/nid-bank.json`
- Face Images: Stored in `dl/faces/` directory

## 📝 Future Enhancements

- [ ] GPU acceleration for faster processing
- [ ] Real-time video streaming support
- [ ] Advanced analytics and reporting
- [ ] Mobile app integration
- [ ] Cloud deployment configuration
- [ ] Multi-camera synchronization
- [ ] Advanced person tracking across videos

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is part of academic research. Please contact the repository owner for usage permissions.

## 🙋‍♂️ Support

For questions or issues:
- Create an issue on GitHub
- Check the troubleshooting section above
- Review the API documentation

---

**Built with ❤️ for surveillance and security applications**