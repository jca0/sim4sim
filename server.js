const express = require('express');
const path = require('path');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Preserve original filename with timestamp to avoid conflicts
    const timestamp = Date.now();
    const originalName = file.originalname;
    cb(null, `${timestamp}-${originalName}`);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    // Only allow specific file types
    const allowedTypes = ['xml', 'stl', 'urdf'];
    const fileExtension = file.originalname.split('.').pop().toLowerCase();
    
    if (allowedTypes.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error(`File type .${fileExtension} is not supported. Allowed types: ${allowedTypes.join(', ')}`));
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// File upload endpoint
app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileInfo = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      path: req.file.path
    };

    res.json({
      success: true,
      message: 'File uploaded successfully',
      file: fileInfo
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Get uploaded files list
app.get('/api/files', (req, res) => {
  try {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      return res.json({ files: [] });
    }

    const files = fs.readdirSync(uploadDir)
      .filter(file => {
        const ext = file.split('.').pop().toLowerCase();
        return ['xml', 'stl', 'urdf'].includes(ext);
      })
      .map(file => {
        const filePath = path.join(uploadDir, file);
        const stats = fs.statSync(filePath);
        return {
          filename: file,
          originalName: file.substring(file.indexOf('-') + 1),
          size: stats.size,
          uploadDate: stats.mtime
        };
      });

    res.json({ files });
  } catch (error) {
    console.error('Error reading files:', error);
    res.status(500).json({ error: 'Failed to read files' });
  }
});

// Download file endpoint
app.get('/api/download/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'uploads', filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.download(filePath);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Download failed' });
  }
});

// Export scene endpoint
app.post('/api/export', (req, res) => {
  try {
    const sceneData = req.body;
    
    if (!sceneData || !sceneData.objects) {
      return res.status(400).json({ error: 'Invalid scene data' });
    }

    const xml = generateSceneXML(sceneData);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `simulation_scene_${timestamp}.xml`;
    
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(xml);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Export failed' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 50MB.' });
    }
  }
  
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Helper function to generate scene XML
function generateSceneXML(sceneData) {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<simulation_scene>\n';
  xml += '  <metadata>\n';
  xml += `    <created>${new Date().toISOString()}</created>\n`;
  xml += `    <generator>Sim4Sim Environment Builder (Node.js)</generator>\n`;
  xml += `    <object_count>${sceneData.objects.length}</object_count>\n`;
  xml += '  </metadata>\n';
  xml += '  <objects>\n';

  sceneData.objects.forEach((obj, index) => {
    xml += `    <object id="${index}">\n`;
    xml += `      <name>${obj.fileName}</name>\n`;
    xml += `      <type>${obj.fileType}</type>\n`;
    xml += '      <transform>\n';
    xml += '        <position>\n';
    xml += `          <x>${obj.position.x.toFixed(6)}</x>\n`;
    xml += `          <y>${obj.position.y.toFixed(6)}</y>\n`;
    xml += `          <z>${obj.position.z.toFixed(6)}</z>\n`;
    xml += '        </position>\n';
    xml += '        <rotation>\n';
    xml += `          <x>${obj.rotation.x.toFixed(6)}</x>\n`;
    xml += `          <y>${obj.rotation.y.toFixed(6)}</y>\n`;
    xml += `          <z>${obj.rotation.z.toFixed(6)}</z>\n`;
    xml += '        </rotation>\n';
    xml += '        <scale>\n';
    xml += `          <x>${obj.scale.x.toFixed(6)}</x>\n`;
    xml += `          <y>${obj.scale.y.toFixed(6)}</y>\n`;
    xml += `          <z>${obj.scale.z.toFixed(6)}</z>\n`;
    xml += '        </scale>\n';
    xml += '      </transform>\n';
    xml += '    </object>\n';
  });

  xml += '  </objects>\n';
  xml += '</simulation_scene>';

  return xml;
}

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Sim4Sim server running on http://localhost:${PORT}`);
  console.log(`📁 Upload directory: ${path.join(__dirname, 'uploads')}`);
  console.log(`🔧 Development mode: ${process.env.NODE_ENV !== 'production' ? 'enabled' : 'disabled'}`);
}); 