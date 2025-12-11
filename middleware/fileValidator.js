import { fileTypeFromBuffer } from 'file-type';
import sanitizeFilename from 'sanitize-filename';
import path from 'path';
import crypto from 'crypto';

// Maximum file size: 100MB
export const MAX_FILE_SIZE = 100 * 1024 * 1024;

// Blocked file extensions (dangerous/executable files)
const BLOCKED_EXTENSIONS = new Set([
  // Windows executables
  'exe', 'msi', 'dll', 'com', 'bat', 'cmd', 'ps1', 'vbs', 'vbe',
  'js', 'jse', 'ws', 'wsf', 'wsc', 'wsh', 'psc1', 'scr', 'cpl',
  
  // Unix/Linux executables
  'sh', 'bash', 'zsh', 'csh', 'ksh', 'run', 'bin',
  
  // macOS
  'app', 'command', 'osx', 'pkg', 'dmg',
  
  // Scripting languages
  'py', 'pyc', 'pyo', 'pyw', 'rb', 'pl', 'php', 'php3', 'php4',
  'php5', 'phtml', 'asp', 'aspx', 'jsp', 'jspx', 'cfm', 'cgi',
  
  // Java
  'jar', 'class', 'war',
  
  // Web content (XSS risk)
  'html', 'htm', 'xhtml', 'svg', 'xml', 'xsl', 'xslt',
  'htaccess', 'htpasswd',
  
  // Office macros
  'docm', 'dotm', 'xlsm', 'xltm', 'xlam', 'pptm', 'potm', 'ppam',
  'ppsm', 'sldm',
  
  // Archives that can contain executables
  'iso', 'img',
  
  // Windows shortcuts/links
  'lnk', 'scf', 'inf', 'reg', 'pif', 'url',
  
  // Other dangerous
  'hta', 'mht', 'mhtml', 'xpi', 'crx', 'swf', 'action', 'apk',
  'deb', 'rpm', 'elf', 'so', 'dylib'
]);

// Blocked MIME types
const BLOCKED_MIME_TYPES = new Set([
  // Executables
  'application/x-msdownload',
  'application/x-msdos-program',
  'application/x-executable',
  'application/x-dosexec',
  'application/x-msi',
  'application/x-sh',
  'application/x-shellscript',
  'application/x-csh',
  'application/x-perl',
  'application/x-python',
  'application/x-ruby',
  'application/x-php',
  
  // Java
  'application/java-archive',
  'application/x-java-class',
  'application/x-java-applet',
  
  // Web content
  'text/html',
  'text/javascript',
  'application/javascript',
  'application/x-javascript',
  'text/x-javascript',
  'application/xhtml+xml',
  'image/svg+xml',
  'application/xml',
  'text/xml',
  
  // Flash
  'application/x-shockwave-flash',
  
  // Windows specific
  'application/x-ms-shortcut',
  'application/hta'
]);

/**
 * Sanitize a filename for safe storage
 * @param {string} originalFilename - The original filename from upload
 * @returns {string} Sanitized filename with unique prefix
 */
export function sanitizeUploadFilename(originalFilename) {
  // Extract just the filename (remove any path components)
  let filename = path.basename(originalFilename);
  
  // Use sanitize-filename to remove dangerous characters
  filename = sanitizeFilename(filename, { replacement: '_' });
  
  // Handle empty result
  if (!filename || filename.length === 0) {
    filename = 'unnamed_file';
  }
  
  // Limit length (leave room for prefix)
  const ext = path.extname(filename);
  const name = path.basename(filename, ext);
  const maxNameLength = 150;
  
  if (name.length > maxNameLength) {
    filename = name.substring(0, maxNameLength) + ext;
  }
  
  // Add unique identifier to prevent overwrites
  const uniqueId = crypto.randomBytes(8).toString('hex');
  const safeName = `${Date.now()}_${uniqueId}_${filename}`;
  
  return safeName;
}

/**
 * Validate an uploaded file for security
 * @param {Buffer} buffer - File buffer
 * @param {string} originalFilename - Original filename
 * @returns {Promise<{valid: boolean, errors: string[], detectedType: object|null}>}
 */
export async function validateFile(buffer, originalFilename) {
  const errors = [];
  
  // Check file size
  if (buffer.length > MAX_FILE_SIZE) {
    errors.push(`File size exceeds maximum allowed (100 MB)`);
  }
  
  // Check extension from filename
  const ext = path.extname(originalFilename).toLowerCase().slice(1);
  if (ext && BLOCKED_EXTENSIONS.has(ext)) {
    errors.push(`File extension .${ext} is not allowed`);
  }
  
  // Detect actual file type from magic bytes
  let detectedType = null;
  try {
    detectedType = await fileTypeFromBuffer(buffer);
    
    if (detectedType) {
      // Check if detected extension is blocked
      if (BLOCKED_EXTENSIONS.has(detectedType.ext)) {
        errors.push(`Detected file type .${detectedType.ext} is not allowed`);
      }
      
      // Check if MIME type is blocked
      if (BLOCKED_MIME_TYPES.has(detectedType.mime)) {
        errors.push(`Detected MIME type ${detectedType.mime} is not allowed`);
      }
    }
  } catch (err) {
    console.error('Error detecting file type:', err);
    // Continue without type detection - allow upload but log warning
  }
  
  return {
    valid: errors.length === 0,
    errors,
    detectedType
  };
}

/**
 * Get content type for a file
 * @param {object|null} detectedType - Result from file-type detection
 * @param {string} originalFilename - Original filename
 * @returns {string} Content type
 */
export function getContentType(detectedType, originalFilename) {
  if (detectedType && detectedType.mime) {
    return detectedType.mime;
  }
  
  // Fallback based on extension
  const ext = path.extname(originalFilename).toLowerCase();
  const mimeTypes = {
    '.epub': 'application/epub+zip',
    '.mobi': 'application/x-mobipocket-ebook',
    '.azw': 'application/vnd.amazon.ebook',
    '.azw3': 'application/vnd.amazon.ebook',
    '.pdf': 'application/pdf',
    '.txt': 'text/plain',
    '.rtf': 'application/rtf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.cbz': 'application/x-cbz',
    '.cbr': 'application/x-cbr'
  };
  
  return mimeTypes[ext] || 'application/octet-stream';
}

export default {
  MAX_FILE_SIZE,
  sanitizeUploadFilename,
  validateFile,
  getContentType
};
