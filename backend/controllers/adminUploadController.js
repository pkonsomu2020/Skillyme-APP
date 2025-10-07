const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { body, validationResult } = require('express-validator');
const ErrorHandler = require('../middleware/errorHandler');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/session-posters');
    
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `session-poster-${uniqueSuffix}${ext}`);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Allow only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1 // Only one file at a time
  }
});

// Upload session poster
const uploadSessionPoster = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await ErrorHandler.logError(new Error('File upload validation failed'), {
        endpoint: '/api/admin/upload/session-poster',
        errors: errors.array()
      });
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const { session_id } = req.body;
    
    if (!session_id) {
      // Delete the uploaded file if session_id is missing
      await fs.unlink(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'Session ID is required'
      });
    }

    // Generate public URL (in production, this would be your CDN or static file server URL)
    const baseUrl = process.env.BASE_URL || 'http://localhost:10000';
    const fileUrl = `${baseUrl}/uploads/session-posters/${req.file.filename}`;

    // Update session with poster URL
    const supabase = require('../config/supabase');
    const { data: session, error } = await supabase
      .from('sessions')
      .update({
        poster_url: fileUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', session_id)
      .select('id, title, poster_url')
      .single();

    if (error) {
      // Delete the uploaded file if database update fails
      await fs.unlink(req.file.path);
      throw error;
    }

    res.json({
      success: true,
      message: 'Session poster uploaded successfully',
      data: {
        session: session,
        file: {
          filename: req.file.filename,
          originalname: req.file.originalname,
          size: req.file.size,
          mimetype: req.file.mimetype,
          url: fileUrl
        }
      }
    });
  } catch (error) {
    // Clean up uploaded file on error
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Failed to delete uploaded file:', unlinkError);
      }
    }

    await ErrorHandler.logError(error, {
      endpoint: '/api/admin/upload/session-poster',
      adminId: req.admin?.id
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to upload session poster',
      error: error.message
    });
  }
};

// Upload session thumbnail
const uploadSessionThumbnail = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await ErrorHandler.logError(new Error('File upload validation failed'), {
        endpoint: '/api/admin/upload/session-thumbnail',
        errors: errors.array()
      });
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const { session_id } = req.body;
    
    if (!session_id) {
      // Delete the uploaded file if session_id is missing
      await fs.unlink(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'Session ID is required'
      });
    }

    // Generate public URL
    const baseUrl = process.env.BASE_URL || 'http://localhost:10000';
    const fileUrl = `${baseUrl}/uploads/session-posters/${req.file.filename}`;

    // Update session with thumbnail URL
    const supabase = require('../config/supabase');
    const { data: session, error } = await supabase
      .from('sessions')
      .update({
        thumbnail_url: fileUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', session_id)
      .select('id, title, thumbnail_url')
      .single();

    if (error) {
      // Delete the uploaded file if database update fails
      await fs.unlink(req.file.path);
      throw error;
    }

    res.json({
      success: true,
      message: 'Session thumbnail uploaded successfully',
      data: {
        session: session,
        file: {
          filename: req.file.filename,
          originalname: req.file.originalname,
          size: req.file.size,
          mimetype: req.file.mimetype,
          url: fileUrl
        }
      }
    });
  } catch (error) {
    // Clean up uploaded file on error
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Failed to delete uploaded file:', unlinkError);
      }
    }

    await ErrorHandler.logError(error, {
      endpoint: '/api/admin/upload/session-thumbnail',
      adminId: req.admin?.id
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to upload session thumbnail',
      error: error.message
    });
  }
};

// Delete session poster
const deleteSessionPoster = async (req, res) => {
  try {
    const { session_id } = req.body;

    if (!session_id) {
      return res.status(400).json({
        success: false,
        message: 'Session ID is required'
      });
    }

    // Get session to find current poster URL
    const supabase = require('../config/supabase');
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('id, title, poster_url')
      .eq('id', session_id)
      .single();

    if (sessionError || !session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    if (!session.poster_url) {
      return res.status(400).json({
        success: false,
        message: 'No poster found for this session'
      });
    }

    // Extract filename from URL
    const filename = session.poster_url.split('/').pop();
    const filePath = path.join(__dirname, '../uploads/session-posters', filename);

    // Delete file from filesystem
    try {
      await fs.unlink(filePath);
    } catch (unlinkError) {
      console.error('Failed to delete file from filesystem:', unlinkError);
      // Continue even if file deletion fails
    }

    // Update session to remove poster URL
    const { data: updatedSession, error: updateError } = await supabase
      .from('sessions')
      .update({
        poster_url: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', session_id)
      .select('id, title, poster_url')
      .single();

    if (updateError) {
      throw updateError;
    }

    res.json({
      success: true,
      message: 'Session poster deleted successfully',
      data: {
        session: updatedSession
      }
    });
  } catch (error) {
    await ErrorHandler.logError(error, {
      endpoint: '/api/admin/upload/delete-poster',
      adminId: req.admin?.id
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to delete session poster',
      error: error.message
    });
  }
};

// Get upload statistics
const getUploadStats = async (req, res) => {
  try {
    const uploadDir = path.join(__dirname, '../uploads/session-posters');
    
    // Get directory stats
    const stats = await fs.stat(uploadDir).catch(() => null);
    
    if (!stats) {
      return res.json({
        success: true,
        data: {
          totalFiles: 0,
          totalSize: 0,
          directoryExists: false
        }
      });
    }

    // Get all files in directory
    const files = await fs.readdir(uploadDir);
    let totalSize = 0;

    for (const file of files) {
      try {
        const filePath = path.join(uploadDir, file);
        const fileStats = await fs.stat(filePath);
        totalSize += fileStats.size;
      } catch (error) {
        console.error(`Failed to get stats for file ${file}:`, error);
      }
    }

    res.json({
      success: true,
      data: {
        totalFiles: files.length,
        totalSize: totalSize,
        totalSizeMB: Math.round((totalSize / (1024 * 1024)) * 100) / 100,
        directoryExists: true
      }
    });
  } catch (error) {
    await ErrorHandler.logError(error, {
      endpoint: '/api/admin/upload/stats',
      adminId: req.admin?.id
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to get upload statistics',
      error: error.message
    });
  }
};

module.exports = {
  upload,
  uploadSessionPoster,
  uploadSessionThumbnail,
  deleteSessionPoster,
  getUploadStats
};
