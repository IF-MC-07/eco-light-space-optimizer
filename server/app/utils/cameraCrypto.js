import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const SECRET_KEY = process.env.CAMERA_SECRET_KEY || crypto.randomBytes(32).toString('hex');
const IV_LENGTH = 16;

/**
 * Encrypt a camera URL
 * @param {string} text - The plaintext URL
 * @returns {string} - The encrypted string format: iv:encryptedData
 */
export const encryptCameraUrl = (text) => {
  if (!text) return text;
  
  // Backward compatibility check - if it looks like it's already encrypted (iv:encrypted), skip
  if (text.includes(':') && text.split(':')[0].length === 32) {
      return text;
  }

  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    // Ensure key is 32 bytes
    const key = crypto.createHash('sha256').update(String(SECRET_KEY)).digest('base64').substring(0, 32);
    
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(key), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  } catch (error) {
    console.error('Encryption error:', error);
    return text; // Fallback
  }
};

/**
 * Decrypt a camera URL
 * @param {string} text - The encrypted string format: iv:encryptedData
 * @returns {string} - The decrypted URL
 */
export const decryptCameraUrl = (text) => {
  if (!text) return text;
  
  // Check if it's actually encrypted format
  const textParts = text.split(':');
  if (textParts.length !== 2 || textParts[0].length !== 32) {
    // Treat as plaintext (backward compatibility)
    return text;
  }

  try {
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const key = crypto.createHash('sha256').update(String(SECRET_KEY)).digest('base64').substring(0, 32);
    
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(key), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted.toString();
  } catch (error) {
    console.error('Decryption error:', error);
    return text; // Return original if decryption fails
  }
};

/**
 * Generate a SHA-256 hash for camera unique identification
 * @param {string} cameraId - The camera ID
 * @param {string} url - The URL
 * @returns {string} - The SHA-256 hash
 */
export const generateCameraHash = (cameraId, url) => {
  if (!cameraId || !url) return null;
  return crypto.createHash('sha256').update(`${cameraId}-${url}-${SECRET_KEY}`).digest('hex');
};
