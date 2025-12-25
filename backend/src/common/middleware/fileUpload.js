/**
 * File Upload Validation Middleware
 * Handles file uploads with security validation
 */

const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const config = require('../config');
const logger = require('../utils/logger');
const { APIError } = require('../utils/errors');

/**
 * Allowed MIME types for different upload categories
 */
const ALLOWED_MIME_TYPES = {
  images: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
  ],
  videos: [
    'video/mp4',
    'video/quicktime',
    'video/x-msvideo',
    'video/mpeg',
  ],
  documents: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  all: [],
};

// Combine all allowed types
ALLOWED_MIME_TYPES.all = [
  ...ALLOWED_MIME_TYPES.images,
  ...ALLOWED_MIME_TYPES.videos,
  ...ALLOWED_MIME_TYPES.documents,
];

/**
 * File extensions for additional validation
 */
const ALLOWED_EXTENSIONS = {
  images: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
  videos: ['.mp4', '.mov', '.avi', '.mpeg'],
  documents: ['.pdf', '.doc', '.docx'],
};

/**
 * Validate file type by checking both MIME type and extension
 */
const validateFileType = (file, allowedCategory = 'all') => {
  const allowedMimeTypes = ALLOWED_MIME_TYPES[allowedCategory] || ALLOWED_MIME_TYPES.all;
  const fileExtension = path.extname(file.originalname).toLowerCase();

  // Check MIME type
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return {
      valid: false,
      error: `File type ${file.mimetype} is not allowed. Allowed types: ${allowedMimeTypes.join(', ')}`,
    };
  }

  // Check extension
  const allowedExts = ALLOWED_EXTENSIONS[allowedCategory]
    || Object.values(ALLOWED_EXTENSIONS).flat();

  if (!allowedExts.includes(fileExtension)) {
    return {
      valid: false,
      error: `File extension ${fileExtension} is not allowed`,
    };
  }

  // Check for double extensions (e.g., file.php.jpg)
  const fileName = file.originalname.toLowerCase();
  const dangerousExtensions = ['.php', '.exe', '.sh', '.bat', '.cmd', '.com', '.pif', '.scr'];

  if (dangerousExtensions.some((ext) => fileName.includes(ext))) {
    return {
      valid: false,
      error: 'File contains dangerous extension pattern',
    };
  }

  return { valid: true };
};

/**
 * Validate file size
 */
const validateFileSize = (file, maxSize = config.upload.maxFileSize) => {
  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      error: `File size exceeds maximum allowed size of ${maxSizeMB}MB`,
    };
  }
  return { valid: true };
};

/**
 * Scan file content for malicious patterns (basic)
 */
const scanFileContent = (buffer) => {
  // Check for common malicious patterns in the first 1KB
  const header = buffer.slice(0, 1024).toString('utf8', 0, 1024);

  const maliciousPatterns = [
    /<\?php/i,
    /<script/i,
    /eval\s*\(/i,
    /exec\s*\(/i,
    /system\s*\(/i,
    /passthru\s*\(/i,
    /shell_exec/i,
  ];

  for (const pattern of maliciousPatterns) {
    if (pattern.test(header)) {
      return {
        valid: false,
        error: 'File contains potentially malicious content',
      };
    }
  }

  return { valid: true };
};

/**
 * Configure multer storage
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = file.mimetype.startsWith('video/')
      ? config.upload.videoUploadPath
      : config.upload.uploadPath;
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with random hash
    const uniqueSuffix = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9]/g, '_')
      .substring(0, 50); // Limit filename length
    cb(null, `${name}-${Date.now()}-${uniqueSuffix}${ext}`);
  },
});

/**
 * Memory storage for content scanning
 */
const memoryStorage = multer.memoryStorage();

/**
 * File filter function
 */
const createFileFilter = (allowedCategory = 'all') => (req, file, cb) => {
  // Validate file type
  const typeValidation = validateFileType(file, allowedCategory);
  if (!typeValidation.valid) {
    logger.warn('File upload rejected - invalid type', {
      userId: req.user?.id,
      filename: file.originalname,
      mimetype: file.mimetype,
      reason: typeValidation.error,
    });
    return cb(new APIError(typeValidation.error, 400), false);
  }

  cb(null, true);
};

/**
 * Create multer upload middleware
 */
const createUploadMiddleware = (options = {}) => {
  const {
    maxFiles = 1,
    maxSize = config.upload.maxFileSize,
    allowedCategory = 'all',
    useMemory = false,
  } = options;

  const multerConfig = {
    storage: useMemory ? memoryStorage : storage,
    limits: {
      fileSize: maxSize,
      files: maxFiles,
    },
    fileFilter: createFileFilter(allowedCategory),
  };

  return multer(multerConfig);
};

/**
 * Middleware to validate uploaded files
 */
const validateUploadedFiles = (options = {}) => {
  const {
    maxSize = config.upload.maxFileSize,
    allowedCategory = 'all',
    scanContent = true,
  } = options;

  return (req, res, next) => {
    try {
      const files = req.files || (req.file ? [req.file] : []);

      if (files.length === 0) {
        return next();
      }

      // Validate each file
      for (const file of files) {
        // Size validation
        const sizeValidation = validateFileSize(file, maxSize);
        if (!sizeValidation.valid) {
          logger.warn('File upload rejected - size exceeded', {
            userId: req.user?.id,
            filename: file.originalname,
            size: file.size,
          });
          throw new APIError(sizeValidation.error, 400);
        }

        // Content scanning (if buffer available)
        if (scanContent && file.buffer) {
          const contentScan = scanFileContent(file.buffer);
          if (!contentScan.valid) {
            logger.warn('File upload rejected - malicious content detected', {
              userId: req.user?.id,
              filename: file.originalname,
            });
            throw new APIError(contentScan.error, 400);
          }
        }

        // Log successful upload
        logger.info('File uploaded successfully', {
          userId: req.user?.id,
          filename: file.originalname,
          size: file.size,
          mimetype: file.mimetype,
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Handle multer errors
 */
const handleUploadErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    logger.warn('Multer error:', {
      code: err.code,
      field: err.field,
      userId: req.user?.id,
    });

    let message = 'File upload error';

    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        message = `File size exceeds maximum allowed size of ${(config.upload.maxFileSize / (1024 * 1024)).toFixed(2)}MB`;
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Too many files uploaded';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Unexpected field in file upload';
        break;
      default:
        message = err.message;
    }

    return res.status(400).json({
      requestId: req.id,
      timestamp: new Date().toISOString(),
      data: null,
      error: {
        message,
        statusCode: 400,
      },
      meta: {},
    });
  }

  next(err);
};

// Export configured middleware
module.exports = {
  createUploadMiddleware,
  validateUploadedFiles,
  handleUploadErrors,
  validateFileType,
  validateFileSize,
  scanFileContent,

  // Pre-configured middleware for common use cases
  uploadSingleImage: createUploadMiddleware({ maxFiles: 1, allowedCategory: 'images' }),
  uploadMultipleImages: createUploadMiddleware({ maxFiles: 10, allowedCategory: 'images' }),
  uploadSingleVideo: createUploadMiddleware({ maxFiles: 1, allowedCategory: 'videos' }),
  uploadDocument: createUploadMiddleware({ maxFiles: 1, allowedCategory: 'documents' }),
};
