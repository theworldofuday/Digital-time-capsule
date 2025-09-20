const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class EncryptionService {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.keyLength = 32;
    this.ivLength = 16;
  }

  generateKey() {
    return crypto.randomBytes(this.keyLength);
  }

  generateIV() {
    return crypto.randomBytes(this.ivLength);
  }

  async encryptText(text, key = null) {
    try {
      const encryptionKey = key || this.generateKey();
      const iv = this.generateIV();
      
      const cipher = crypto.createCipher(this.algorithm, encryptionKey);
      cipher.setAAD(Buffer.from('additional data'));
      
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag();
      
      return {
        encrypted,
        key: encryptionKey.toString('hex'),
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex')
      };
    } catch (error) {
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  async decryptText(encryptedData) {
    try {
      const { encrypted, key, iv, authTag } = encryptedData;
      
      const decipher = crypto.createDecipher(this.algorithm, Buffer.from(key, 'hex'));
      decipher.setAAD(Buffer.from('additional data'));
      decipher.setAuthTag(Buffer.from(authTag, 'hex'));
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  async encryptFile(filePath, outputPath = null) {
    try {
      const key = this.generateKey();
      const iv = this.generateIV();
      
      const fileData = await fs.readFile(filePath);
      const cipher = crypto.createCipher(this.algorithm, key);
      
      const encrypted = Buffer.concat([
        cipher.update(fileData),
        cipher.final()
      ]);
      
      const authTag = cipher.getAuthTag();
      const finalPath = outputPath || `${filePath}.encrypted`;
      
      // Combine IV, authTag, and encrypted data
      const finalData = Buffer.concat([iv, authTag, encrypted]);
      await fs.writeFile(finalPath, finalData);
      
      return {
        encryptedPath: finalPath,
        key: key.toString('hex'),
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex')
      };
    } catch (error) {
      throw new Error(`File encryption failed: ${error.message}`);
    }
  }

  async decryptFile(encryptedPath, key, outputPath = null) {
    try {
      const encryptedData = await fs.readFile(encryptedPath);
      
      // Extract IV, authTag, and encrypted content
      const iv = encryptedData.slice(0, this.ivLength);
      const authTag = encryptedData.slice(this.ivLength, this.ivLength + 16);
      const encrypted = encryptedData.slice(this.ivLength + 16);
      
      const decipher = crypto.createDecipher(this.algorithm, Buffer.from(key, 'hex'));
      decipher.setAuthTag(authTag);
      
      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final()
      ]);
      
      if (outputPath) {
        await fs.writeFile(outputPath, decrypted);
        return outputPath;
      }
      
      return decrypted;
    } catch (error) {
      throw new Error(`File decryption failed: ${error.message}`);
    }
  }

  // Time-based encryption (reveals automatically at specified time)
  async createTimeLock(data, revealDate) {
    try {
      const now = new Date();
      const timeToReveal = revealDate.getTime() - now.getTime();
      
      if (timeToReveal <= 0) {
        throw new Error('Reveal date must be in the future');
      }
      
      // For demo purposes, we'll use regular encryption
      // In production, you might use more sophisticated time-lock cryptography
      const encrypted = await this.encryptText(JSON.stringify(data));
      
      return {
        ...encrypted,
        revealDate: revealDate.toISOString(),
        timeToReveal
      };
    } catch (error) {
      throw new Error(`Time lock creation failed: ${error.message}`);
    }
  }

  // Check if time lock can be opened
  canUnlock(timeLockData) {
    const now = new Date();
    const revealDate = new Date(timeLockData.revealDate);
    return now >= revealDate;
  }
}

module.exports = new EncryptionService();